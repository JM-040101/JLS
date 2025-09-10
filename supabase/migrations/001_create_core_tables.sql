-- Migration: 001_create_core_tables
-- Description: Create core tables for SaaS Blueprint Generator
-- Author: System
-- Date: 2024

-- ============================================
-- 1. PROFILES TABLE (extends Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  subscription_status TEXT DEFAULT 'inactive' 
    CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on subscription status for quick filtering
CREATE INDEX idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- Add comment for documentation
COMMENT ON TABLE profiles IS 'User profiles extending Supabase Auth with subscription data';
COMMENT ON COLUMN profiles.subscription_status IS 'Current subscription status from Stripe';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for payment processing';

-- ============================================
-- 2. WORKFLOW SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  app_description TEXT NOT NULL CHECK (char_length(app_description) >= 10 AND char_length(app_description) <= 500),
  app_name TEXT,
  target_audience TEXT,
  status TEXT DEFAULT 'in_progress' 
    CHECK (status IN ('in_progress', 'completed', 'archived')),
  completed_phases INTEGER DEFAULT 0 
    CHECK (completed_phases >= 0 AND completed_phases <= 12),
  current_phase INTEGER DEFAULT 1
    CHECK (current_phase >= 1 AND current_phase <= 12),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Ensure current_phase is always >= completed_phases
  CONSTRAINT valid_phase_progression CHECK (current_phase >= completed_phases)
);

-- Create indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_metadata ON sessions USING GIN (metadata);

-- Add comments
COMMENT ON TABLE sessions IS 'Workflow sessions for blueprint generation';
COMMENT ON COLUMN sessions.metadata IS 'Additional session data like AI model versions, settings';

-- ============================================
-- 3. PHASE ANSWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1 AND phase_number <= 12),
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL CHECK (char_length(answer_text) >= 1 AND char_length(answer_text) <= 2000),
  answer_type TEXT NOT NULL 
    CHECK (answer_type IN ('text', 'textarea', 'select', 'multiselect', 'boolean')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique answers per question in a session
  UNIQUE(session_id, phase_number, question_id)
);

-- Create indexes
CREATE INDEX idx_answers_session_id ON answers(session_id);
CREATE INDEX idx_answers_phase ON answers(session_id, phase_number);
CREATE INDEX idx_answers_question ON answers(question_id);

-- Add comments
COMMENT ON TABLE answers IS 'User answers for each phase question';
COMMENT ON COLUMN answers.metadata IS 'Additional answer data like validation results, AI suggestions';

-- ============================================
-- 4. GENERATED OUTPUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_content TEXT NOT NULL,
  file_type TEXT NOT NULL 
    CHECK (file_type IN ('md', 'json', 'txt', 'prompt', 'yaml', 'ts', 'js')),
  file_size INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL 
    CHECK (category IN ('readme', 'module', 'prompt', 'config', 'documentation')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  version INTEGER DEFAULT 1,
  
  -- Ensure unique file paths per session
  UNIQUE(session_id, file_path)
);

-- Create indexes
CREATE INDEX idx_outputs_session_id ON outputs(session_id);
CREATE INDEX idx_outputs_category ON outputs(category);
CREATE INDEX idx_outputs_file_type ON outputs(file_type);

-- Add comments
COMMENT ON TABLE outputs IS 'Generated blueprint files and documentation';
COMMENT ON COLUMN outputs.category IS 'Type of generated file for organization';

-- ============================================
-- 5. PHASE TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS phase_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_number INTEGER NOT NULL UNIQUE CHECK (phase_number >= 1 AND phase_number <= 12),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_time INTEGER NOT NULL DEFAULT 15, -- in minutes
  questions JSONB NOT NULL DEFAULT '[]',
  help_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index
CREATE INDEX idx_phase_templates_number ON phase_templates(phase_number);

-- Add comments
COMMENT ON TABLE phase_templates IS 'Template questions and structure for each workflow phase';
COMMENT ON COLUMN phase_templates.questions IS 'Array of question objects with id, type, label, options, etc.';

-- ============================================
-- 6. EXPORT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL 
    CHECK (export_type IN ('zip', 'github', 'gitlab', 'download')),
  file_url TEXT,
  file_size INTEGER,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Index for cleanup of expired exports
  CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Create indexes
CREATE INDEX idx_export_history_session ON export_history(session_id);
CREATE INDEX idx_export_history_user ON export_history(user_id);
CREATE INDEX idx_export_history_expires ON export_history(expires_at) WHERE expires_at IS NOT NULL;

-- Add comments
COMMENT ON TABLE export_history IS 'Track blueprint exports and downloads';

-- ============================================
-- 7. AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- Add comments
COMMENT ON TABLE audit_log IS 'Audit trail for all system actions';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- Function to automatically update session progress
CREATE OR REPLACE FUNCTION update_session_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update completed_phases count when new answer is added
    UPDATE sessions 
    SET completed_phases = (
        SELECT COUNT(DISTINCT phase_number) 
        FROM answers 
        WHERE session_id = NEW.session_id
    ),
    current_phase = NEW.phase_number + 1
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ language plpgsql;

-- Function to validate subscription before session creation
CREATE OR REPLACE FUNCTION check_subscription_before_session()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has active subscription
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = NEW.user_id 
        AND subscription_status = 'active'
    ) THEN
        RAISE EXCEPTION 'Active subscription required to create new blueprint session';
    END IF;
    
    -- Check concurrent session limit (max 3)
    IF (
        SELECT COUNT(*) FROM sessions 
        WHERE user_id = NEW.user_id 
        AND status = 'in_progress'
    ) >= 3 THEN
        RAISE EXCEPTION 'Maximum of 3 concurrent blueprint sessions allowed';
    END IF;
    
    RETURN NEW;
END;
$$ language plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at 
    BEFORE UPDATE ON answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phase_templates_updated_at 
    BEFORE UPDATE ON phase_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Session progress trigger
CREATE TRIGGER update_session_on_answer 
    AFTER INSERT ON answers
    FOR EACH ROW EXECUTE FUNCTION update_session_progress();

-- Subscription validation trigger
CREATE TRIGGER validate_subscription_on_session 
    BEFORE INSERT ON sessions
    FOR EACH ROW EXECUTE FUNCTION check_subscription_before_session();