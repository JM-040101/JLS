-- Export Tracking Tables

-- Main exports table
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  size INT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  
  -- Indexes
  INDEX idx_exports_session_id (session_id),
  INDEX idx_exports_user_id (user_id),
  INDEX idx_exports_created_at (created_at),
  INDEX idx_exports_expires_at (expires_at)
);

-- Export version tracking
CREATE TABLE IF NOT EXISTS export_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  size INT NOT NULL,
  url TEXT,
  changelog TEXT,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint on session + version
  UNIQUE(session_id, version),
  
  -- Indexes
  INDEX idx_export_versions_session_id (session_id),
  INDEX idx_export_versions_exported_at (exported_at)
);

-- Export logs for analytics
CREATE TABLE IF NOT EXISTS export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  version TEXT,
  size INT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Indexes
  INDEX idx_export_logs_user_id (user_id),
  INDEX idx_export_logs_status (status),
  INDEX idx_export_logs_created_at (created_at)
);

-- Export quotas per user/tier
CREATE TABLE IF NOT EXISTS export_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  monthly_exports_limit INT NOT NULL DEFAULT 10,
  monthly_exports_used INT NOT NULL DEFAULT 0,
  storage_limit_mb INT NOT NULL DEFAULT 500,
  storage_used_mb INT NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_quotas ENABLE ROW LEVEL SECURITY;

-- Exports policies
CREATE POLICY "Users can view own exports"
  ON exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exports"
  ON exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exports"
  ON exports FOR DELETE
  USING (auth.uid() = user_id);

-- Export versions policies
CREATE POLICY "Users can view own export versions"
  ON export_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create export versions"
  ON export_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Export logs policies
CREATE POLICY "Users can view own export logs"
  ON export_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert export logs"
  ON export_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Export quotas policies
CREATE POLICY "Users can view own quotas"
  ON export_quotas FOR SELECT
  USING (auth.uid() = user_id);

-- Functions

-- Function to check and update export quota
CREATE OR REPLACE FUNCTION check_export_quota(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_quota RECORD;
  v_can_export BOOLEAN;
BEGIN
  -- Get or create quota record
  INSERT INTO export_quotas (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current quota
  SELECT * INTO v_quota
  FROM export_quotas
  WHERE user_id = p_user_id;
  
  -- Reset monthly counts if needed
  IF v_quota.reset_at <= now() THEN
    UPDATE export_quotas
    SET 
      monthly_exports_used = 0,
      reset_at = date_trunc('month', now()) + interval '1 month',
      updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Refresh quota
    SELECT * INTO v_quota
    FROM export_quotas
    WHERE user_id = p_user_id;
  END IF;
  
  -- Check if user can export
  v_can_export := v_quota.monthly_exports_used < v_quota.monthly_exports_limit
                  AND v_quota.storage_used_mb < v_quota.storage_limit_mb;
  
  -- If can export, increment counter
  IF v_can_export THEN
    UPDATE export_quotas
    SET 
      monthly_exports_used = monthly_exports_used + 1,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN v_can_export;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_export_storage(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_total_size BIGINT;
BEGIN
  -- Calculate total storage used
  SELECT COALESCE(SUM(size), 0) INTO v_total_size
  FROM exports
  WHERE user_id = p_user_id
  AND (expires_at IS NULL OR expires_at > now());
  
  -- Update quota
  UPDATE export_quotas
  SET 
    storage_used_mb = v_total_size / 1048576, -- Convert bytes to MB
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired exports
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS INT AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  -- Delete expired exports
  WITH deleted AS (
    DELETE FROM exports
    WHERE expires_at < now()
    RETURNING user_id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  
  -- Update storage for affected users
  UPDATE export_quotas q
  SET storage_used_mb = (
    SELECT COALESCE(SUM(size) / 1048576, 0)
    FROM exports e
    WHERE e.user_id = q.user_id
    AND (e.expires_at IS NULL OR e.expires_at > now())
  ),
  updated_at = now()
  WHERE EXISTS (
    SELECT 1 FROM deleted d WHERE d.user_id = q.user_id
  );
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers

-- Trigger to update storage on export insert/delete
CREATE OR REPLACE FUNCTION trigger_update_export_storage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_export_storage(NEW.user_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_export_storage(OLD.user_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_storage_on_export_change
AFTER INSERT OR DELETE ON exports
FOR EACH ROW
EXECUTE FUNCTION trigger_update_export_storage();

-- Trigger to set expiration date on insert
CREATE OR REPLACE FUNCTION trigger_set_export_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    -- Set default expiration to 30 days
    NEW.expires_at := now() + interval '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_export_expiration
BEFORE INSERT ON exports
FOR EACH ROW
EXECUTE FUNCTION trigger_set_export_expiration();

-- Initial quota setup for existing users
INSERT INTO export_quotas (user_id, tier)
SELECT id, 'free'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;