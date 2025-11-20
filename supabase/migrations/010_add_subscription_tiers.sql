-- Migration: 010_add_subscription_tiers
-- Description: Add multi-tier subscription system with project limits and feature flags
-- Author: System
-- Date: 2025-10-24

-- ============================================
-- 1. ADD SUBSCRIPTION TIER COLUMNS TO PROFILES
-- ============================================

-- Add subscription_tier column with enum constraint
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'essentials', 'premium', 'pro_studio', 'enterprise'));

-- Add active projects limit column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS active_projects_limit INTEGER DEFAULT 1;

-- Add features enabled as JSONB for flexible feature flags
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '{}';

-- Create index on subscription_tier for efficient filtering
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);

-- Add comments for documentation
COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription tier: free, essentials, premium, pro_studio, or enterprise';
COMMENT ON COLUMN profiles.active_projects_limit IS 'Maximum number of concurrent active blueprint sessions allowed';
COMMENT ON COLUMN profiles.features_enabled IS 'JSON object of enabled features based on tier (e.g., {"priority_support": true, "api_access": true})';

-- ============================================
-- 2. UPDATE EXISTING USERS WITH DEFAULT TIER
-- ============================================

-- Set existing active subscribers to premium tier (migration from old single-tier system)
UPDATE profiles
SET
  subscription_tier = 'premium',
  active_projects_limit = 15,
  features_enabled = '{"priority_support": true, "advanced_prompts": true, "code_examples": true, "unlimited_exports": true}'
WHERE subscription_status = 'active' AND subscription_tier = 'free';

-- Set free users appropriately
UPDATE profiles
SET
  active_projects_limit = 1,
  features_enabled = '{}'
WHERE subscription_tier = 'free';

-- ============================================
-- 3. CREATE FUNCTION TO SET TIER LIMITS
-- ============================================

-- Function to automatically set project limits and features based on tier
CREATE OR REPLACE FUNCTION set_tier_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Set limits and features based on subscription_tier
  CASE NEW.subscription_tier
    WHEN 'free' THEN
      NEW.active_projects_limit := 1;
      NEW.features_enabled := '{}';

    WHEN 'essentials' THEN
      NEW.active_projects_limit := 5;
      NEW.features_enabled := '{"advanced_prompts": true}';

    WHEN 'premium' THEN
      NEW.active_projects_limit := 15;
      NEW.features_enabled := '{"priority_support": true, "advanced_prompts": true, "code_examples": true, "unlimited_exports": true}';

    WHEN 'pro_studio' THEN
      NEW.active_projects_limit := 999999; -- Effectively unlimited
      NEW.features_enabled := '{"priority_support": true, "advanced_prompts": true, "code_examples": true, "unlimited_exports": true, "api_access": true, "team_collaboration": true, "white_label": true}';

    WHEN 'enterprise' THEN
      NEW.active_projects_limit := 999999; -- Unlimited
      NEW.features_enabled := '{"priority_support": true, "advanced_prompts": true, "code_examples": true, "unlimited_exports": true, "api_access": true, "team_collaboration": true, "white_label": true, "dedicated_support": true, "custom_integrations": true, "sla": true}';
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically set limits when tier changes
DROP TRIGGER IF EXISTS set_tier_limits_on_change ON profiles;
CREATE TRIGGER set_tier_limits_on_change
  BEFORE INSERT OR UPDATE OF subscription_tier ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_tier_limits();

-- ============================================
-- 4. UPDATE SESSION VALIDATION FUNCTION
-- ============================================

-- Drop old subscription check trigger and function
DROP TRIGGER IF EXISTS validate_subscription_on_session ON sessions;
DROP FUNCTION IF EXISTS check_subscription_before_session();

-- Create new function that checks tier-based project limits
CREATE OR REPLACE FUNCTION check_project_limit_before_session()
RETURNS TRIGGER AS $$
DECLARE
  user_tier TEXT;
  user_limit INTEGER;
  current_active_count INTEGER;
BEGIN
  -- Get user's tier and limit
  SELECT subscription_tier, active_projects_limit
  INTO user_tier, user_limit
  FROM profiles
  WHERE id = NEW.user_id;

  -- Count current active sessions
  SELECT COUNT(*) INTO current_active_count
  FROM sessions
  WHERE user_id = NEW.user_id
  AND status = 'in_progress';

  -- Check if user has reached their limit
  IF current_active_count >= user_limit THEN
    RAISE EXCEPTION 'Project limit reached. You have % active projects. Upgrade to create more. (Tier: %)',
      current_active_count, user_tier;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add new trigger
CREATE TRIGGER validate_project_limit_on_session
  BEFORE INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION check_project_limit_before_session();

-- ============================================
-- 5. ADD STRIPE PRICE ID TO PROFILES
-- ============================================

-- Add column to track which Stripe price ID the user is subscribed to
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_price ON profiles(stripe_price_id);

COMMENT ON COLUMN profiles.stripe_price_id IS 'Stripe Price ID for the current subscription (maps to tier)';

-- ============================================
-- 6. CREATE TIER MAPPING TABLE
-- ============================================

-- Create table to map Stripe Price IDs to subscription tiers
CREATE TABLE IF NOT EXISTS subscription_tier_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL CHECK (tier IN ('free', 'essentials', 'premium', 'pro_studio', 'enterprise')),
  stripe_price_id TEXT NOT NULL UNIQUE,
  stripe_product_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  price_monthly NUMERIC(10, 2) NOT NULL,
  price_annual NUMERIC(10, 2),
  currency TEXT DEFAULT 'usd' NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tier_mapping_stripe_price ON subscription_tier_mapping(stripe_price_id);
CREATE INDEX idx_tier_mapping_tier ON subscription_tier_mapping(tier);
CREATE INDEX idx_tier_mapping_active ON subscription_tier_mapping(active);

COMMENT ON TABLE subscription_tier_mapping IS 'Maps Stripe Price IDs to subscription tiers for webhook processing';

-- Add updated_at trigger
CREATE TRIGGER update_tier_mapping_updated_at
  BEFORE UPDATE ON subscription_tier_mapping
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ADD FUNCTION TO GET USER FEATURES
-- ============================================

-- Helper function to check if user has a specific feature
CREATE OR REPLACE FUNCTION user_has_feature(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  features JSONB;
BEGIN
  SELECT features_enabled INTO features
  FROM profiles
  WHERE id = user_uuid;

  RETURN (features ? feature_name) AND (features ->> feature_name)::BOOLEAN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION user_has_feature IS 'Check if a user has access to a specific feature based on their tier';

-- ============================================
-- 8. ADD ANALYTICS COLUMNS
-- ============================================

-- Add columns to track tier analytics
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tier_upgraded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tier_downgraded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS previous_tier TEXT;

COMMENT ON COLUMN profiles.tier_upgraded_at IS 'Timestamp of last tier upgrade';
COMMENT ON COLUMN profiles.tier_downgraded_at IS 'Timestamp of last tier downgrade';
COMMENT ON COLUMN profiles.previous_tier IS 'Previous subscription tier before most recent change';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
