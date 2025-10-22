-- Add admin role system
-- This migration adds admin capabilities and sets up james@martialmarketing.org as admin

-- Add role and admin fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS upgraded_at timestamp with time zone;

-- Create admin_access_log table for audit trail
CREATE TABLE IF NOT EXISTS admin_access_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource text,
  resource_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create feature_flags table for admin-controlled features
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  enabled boolean DEFAULT false,
  description text,
  admin_only boolean DEFAULT false,
  rollout_percentage integer DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  user_whitelist uuid[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create admin_overrides table for bypassing limits
CREATE TABLE IF NOT EXISTS admin_overrides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  override_type text NOT NULL, -- 'subscription', 'limits', 'features'
  override_value jsonb NOT NULL,
  reason text,
  expires_at timestamp with time zone,
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, override_type)
);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND (is_admin = true OR role IN ('admin', 'superadmin'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check feature access (considers admin status)
CREATE OR REPLACE FUNCTION has_feature_access(user_id uuid, feature_name text)
RETURNS boolean AS $$
DECLARE
  user_is_admin boolean;
  feature_enabled boolean;
  feature_admin_only boolean;
  user_whitelisted boolean;
BEGIN
  -- Check if user is admin
  user_is_admin := is_admin(user_id);
  
  -- Admins have access to all features
  IF user_is_admin THEN
    RETURN true;
  END IF;
  
  -- Check feature flag
  SELECT enabled, admin_only, user_id = ANY(user_whitelist)
  INTO feature_enabled, feature_admin_only, user_whitelisted
  FROM feature_flags
  WHERE name = feature_name;
  
  -- If feature doesn't exist, allow access (default open)
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  -- Check access rules
  IF feature_admin_only THEN
    RETURN false;
  END IF;
  
  IF user_whitelisted THEN
    RETURN true;
  END IF;
  
  RETURN feature_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_resource text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_access_log (admin_id, action, resource, resource_id, metadata)
  VALUES (auth.uid(), p_action, p_resource, p_resource_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to respect admin privileges

-- Drop existing policies that need updating
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view their own exports" ON exports;
DROP POLICY IF EXISTS "Users can view their own payment history" ON payment_history;

-- Recreate policies with admin access
CREATE POLICY "Users can view their own sessions or admins can view all" ON sessions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

CREATE POLICY "Users can view their own exports or admins can view all" ON exports
  FOR SELECT USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

CREATE POLICY "Users can view their own payment history or admins can view all" ON payment_history
  FOR SELECT USING (
    auth.uid() = user_id OR 
    is_admin(auth.uid())
  );

-- Admin-only policies
CREATE POLICY "Only admins can manage feature flags" ON feature_flags
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can view admin access log" ON admin_access_log
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can manage admin overrides" ON admin_overrides
  FOR ALL USING (is_admin(auth.uid()));

-- Enable RLS on new tables
ALTER TABLE admin_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_overrides ENABLE ROW LEVEL SECURITY;

-- Insert default feature flags
INSERT INTO feature_flags (name, enabled, description, admin_only) VALUES
  ('unlimited_exports', false, 'Allow unlimited exports regardless of plan', true),
  ('beta_features', false, 'Access to beta features', false),
  ('advanced_ai', false, 'Access to advanced AI models', false),
  ('priority_support', false, 'Priority customer support', false),
  ('custom_branding', false, 'Custom branding options', false)
ON CONFLICT (name) DO NOTHING;

-- IMPORTANT: Set james@martialmarketing.org as admin
-- This needs to be run after the user exists in the system
DO $$
DECLARE
  james_id uuid;
BEGIN
  -- Get the user ID for james@martialmarketing.org
  SELECT id INTO james_id FROM auth.users WHERE email = 'james@martialmarketing.org';
  
  IF james_id IS NOT NULL THEN
    -- Update profile to admin
    UPDATE profiles 
    SET 
      role = 'superadmin',
      is_admin = true,
      permissions = jsonb_build_object(
        'access_all_features', true,
        'bypass_limits', true,
        'manage_users', true,
        'view_analytics', true,
        'manage_billing', true,
        'export_data', true
      ),
      admin_notes = 'Primary administrator - full system access',
      upgraded_at = now()
    WHERE id = james_id;
    
    -- Add admin overrides for unlimited access
    INSERT INTO admin_overrides (user_id, override_type, override_value, reason, created_by)
    VALUES 
      (james_id, 'subscription', '{"plan": "unlimited", "features": "all"}'::jsonb, 'Admin access', james_id),
      (james_id, 'limits', '{"blueprints": -1, "exports": -1, "storage": -1}'::jsonb, 'Admin access', james_id),
      (james_id, 'features', '{"all": true}'::jsonb, 'Admin access', james_id)
    ON CONFLICT (user_id, override_type) DO UPDATE
    SET override_value = EXCLUDED.override_value,
        reason = EXCLUDED.reason;
    
    -- Log the admin promotion
    INSERT INTO admin_access_log (admin_id, action, resource, resource_id, metadata)
    VALUES (james_id, 'user_promoted_to_admin', 'profiles', james_id::text, 
            jsonb_build_object('email', 'james@martialmarketing.org', 'role', 'superadmin'));
    
    RAISE NOTICE 'Successfully set james@martialmarketing.org as superadmin';
  ELSE
    RAISE NOTICE 'User james@martialmarketing.org not found. Please ensure user is registered first.';
  END IF;
END
$$;

-- Create function to manually set admin (for future use)
CREATE OR REPLACE FUNCTION set_user_as_admin(user_email text, admin_role text DEFAULT 'admin')
RETURNS void AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Verify caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;
  
  -- Get target user ID
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_email;
  END IF;
  
  -- Update profile
  UPDATE profiles
  SET 
    role = admin_role,
    is_admin = true,
    upgraded_at = now()
  WHERE id = target_user_id;
  
  -- Log action
  PERFORM log_admin_action('user_promoted_to_admin', 'profiles', target_user_id::text, 
                          jsonb_build_object('email', user_email, 'role', admin_role));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_admin_access_log_admin_id ON admin_access_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_log_created_at ON admin_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_admin_overrides_user_id ON admin_overrides(user_id);