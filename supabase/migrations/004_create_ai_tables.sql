-- AI Metrics and Cache Tables

-- AI metrics table for cost tracking and usage analytics
CREATE TABLE IF NOT EXISTS ai_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  phase_number INT,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  latency INT NOT NULL, -- milliseconds
  success BOOLEAN NOT NULL DEFAULT true,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Indexes for performance
  INDEX idx_ai_metrics_user_id (user_id),
  INDEX idx_ai_metrics_session_id (session_id),
  INDEX idx_ai_metrics_created_at (created_at)
);

-- AI response cache table
CREATE TABLE IF NOT EXISTS ai_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  hits INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Index for cleanup queries
  INDEX idx_ai_cache_expires_at (expires_at)
);

-- Rate limiting table (backup for when Redis isn't available)
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_type TEXT NOT NULL, -- 'minute', 'hour', 'day'
  window_start TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  PRIMARY KEY (user_id, window_type),
  INDEX idx_rate_limits_window_start (window_start)
);

-- Subscription tiers for rate limiting
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE ai_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- AI metrics policies (users can only see their own metrics)
CREATE POLICY "Users can view own AI metrics"
  ON ai_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI metrics"
  ON ai_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cache policies (cache is shared but read-only for users)
CREATE POLICY "Anyone can read cache"
  ON ai_cache FOR SELECT
  USING (true);

-- System-only write access for cache
CREATE POLICY "System can manage cache"
  ON ai_cache FOR ALL
  USING (auth.role() = 'service_role');

-- Rate limit policies
CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
  ON rate_limits FOR ALL
  USING (auth.role() = 'service_role');

-- Subscription policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset rate limits
CREATE OR REPLACE FUNCTION reset_rate_limits()
RETURNS void AS $$
BEGIN
  -- Reset minute windows older than 1 minute
  DELETE FROM rate_limits 
  WHERE window_type = 'minute' 
  AND window_start < now() - INTERVAL '1 minute';
  
  -- Reset hour windows older than 1 hour
  DELETE FROM rate_limits 
  WHERE window_type = 'hour' 
  AND window_start < now() - INTERVAL '1 hour';
  
  -- Reset day windows older than 1 day
  DELETE FROM rate_limits 
  WHERE window_type = 'day' 
  AND window_start < now() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current usage
CREATE OR REPLACE FUNCTION get_user_usage(p_user_id UUID, p_period TEXT)
RETURNS TABLE (
  total_cost DECIMAL,
  total_tokens BIGINT,
  request_count BIGINT,
  success_rate DECIMAL
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Determine start date based on period
  IF p_period = 'day' THEN
    v_start_date := date_trunc('day', now());
  ELSIF p_period = 'month' THEN
    v_start_date := date_trunc('month', now());
  ELSE
    v_start_date := now() - INTERVAL '1 day';
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(m.cost), 0)::DECIMAL as total_cost,
    COALESCE(SUM(m.input_tokens + m.output_tokens), 0)::BIGINT as total_tokens,
    COUNT(*)::BIGINT as request_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE m.success = true)::DECIMAL / COUNT(*)::DECIMAL * 100)
      ELSE 0
    END as success_rate
  FROM ai_metrics m
  WHERE m.user_id = p_user_id
  AND m.created_at >= v_start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup jobs (requires pg_cron extension)
-- These would be set up in Supabase dashboard or via cron job
-- SELECT cron.schedule('cleanup-ai-cache', '0 * * * *', 'SELECT cleanup_expired_cache();');
-- SELECT cron.schedule('reset-rate-limits', '*/5 * * * *', 'SELECT reset_rate_limits();');