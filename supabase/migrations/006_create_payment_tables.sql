-- Payment and Subscription Tables

-- Subscriptions table (already created but adding missing columns)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT UNIQUE,
  customer_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'gbp',
  status TEXT NOT NULL CHECK (status IN ('paid', 'failed', 'pending', 'refunded')),
  description TEXT,
  invoice_url TEXT,
  invoice_pdf TEXT,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Indexes
  INDEX idx_payment_history_user_id (user_id),
  INDEX idx_payment_history_customer_id (customer_id),
  INDEX idx_payment_history_status (status),
  INDEX idx_payment_history_created_at (created_at)
);

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Indexes
  INDEX idx_webhook_events_type (type),
  INDEX idx_webhook_events_processed (processed),
  INDEX idx_webhook_events_created_at (created_at)
);

-- Webhook errors table
CREATE TABLE IF NOT EXISTS webhook_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL,
  type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Indexes
  INDEX idx_webhook_errors_event_id (stripe_event_id),
  INDEX idx_webhook_errors_created_at (created_at)
);

-- Checkout sessions table
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE NOT NULL,
  price_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  -- Indexes
  INDEX idx_checkout_sessions_user_id (user_id),
  INDEX idx_checkout_sessions_status (status),
  INDEX idx_checkout_sessions_created_at (created_at)
);

-- Tax information table
CREATE TABLE IF NOT EXISTS tax_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  tax_id TEXT,
  tax_id_type TEXT CHECK (tax_id_type IN ('eu_vat', 'gb_vat', 'ch_vat', 'no_vat', 'au_abn', 'nz_gst', 'in_gst', 'ca_bn', 'sg_gst', 'ae_trn')),
  country_code TEXT,
  company_name TEXT,
  company_address JSONB,
  validated BOOLEAN DEFAULT false,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Billing addresses table
CREATE TABLE IF NOT EXISTS billing_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Indexes
  INDEX idx_billing_addresses_user_id (user_id),
  INDEX idx_billing_addresses_default (is_default)
);

-- Add Stripe customer ID to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- RLS Policies
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_addresses ENABLE ROW LEVEL SECURITY;

-- Payment history policies
CREATE POLICY "Users can view own payment history"
  ON payment_history FOR SELECT
  USING (auth.uid() = user_id);

-- Webhook events policies (admin only)
CREATE POLICY "Only service role can manage webhook events"
  ON webhook_events FOR ALL
  USING (auth.role() = 'service_role');

-- Webhook errors policies (admin only)
CREATE POLICY "Only service role can manage webhook errors"
  ON webhook_errors FOR ALL
  USING (auth.role() = 'service_role');

-- Checkout sessions policies
CREATE POLICY "Users can view own checkout sessions"
  ON checkout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create checkout sessions"
  ON checkout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Tax information policies
CREATE POLICY "Users can view own tax information"
  ON tax_information FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tax information"
  ON tax_information FOR ALL
  USING (auth.uid() = user_id);

-- Billing addresses policies
CREATE POLICY "Users can view own billing addresses"
  ON billing_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own billing addresses"
  ON billing_addresses FOR ALL
  USING (auth.uid() = user_id);

-- Functions

-- Function to check subscription status
CREATE OR REPLACE FUNCTION check_subscription_status(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_grace_period_end TIMESTAMPTZ;
BEGIN
  -- Get subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id;
  
  -- No subscription
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check active statuses
  IF v_subscription.status IN ('active', 'trialing') THEN
    RETURN true;
  END IF;
  
  -- Check grace period for past_due
  IF v_subscription.status = 'past_due' THEN
    v_grace_period_end := v_subscription.current_period_end + INTERVAL '3 days';
    RETURN now() < v_grace_period_end;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscription tier
CREATE OR REPLACE FUNCTION get_subscription_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
  AND status IN ('active', 'trialing', 'past_due');
  
  IF NOT FOUND THEN
    RETURN 'free';
  END IF;
  
  -- Determine tier based on price ID
  IF v_subscription.stripe_price_id LIKE '%annual%' THEN
    RETURN 'pro_annual';
  ELSIF v_subscription.stripe_price_id LIKE '%monthly%' THEN
    RETURN 'pro_monthly';
  ELSE
    RETURN 'pro';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update profile subscription status
CREATE OR REPLACE FUNCTION update_profile_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile subscription status
  UPDATE profiles
  SET 
    subscription_status = CASE
      WHEN NEW.status IN ('active', 'trialing') THEN 'active'
      WHEN NEW.status = 'past_due' THEN 'past_due'
      ELSE 'inactive'
    END,
    updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_status_trigger
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_profile_subscription_status();

-- Trigger to ensure only one default billing address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Set all other addresses for this user to non-default
    UPDATE billing_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_address_trigger
BEFORE INSERT OR UPDATE ON billing_addresses
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_address();