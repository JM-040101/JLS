-- Migration: 002_enable_rls_policies
-- Description: Enable Row Level Security and create policies for multi-tenant data isolation
-- Author: System
-- Date: 2024

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile (except subscription fields)
CREATE POLICY "profiles_update_own" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
    -- Prevent users from modifying subscription fields directly
    auth.uid() = id AND
    (OLD.subscription_status = NEW.subscription_status OR auth.jwt() -> 'app_metadata' ->> 'role' = 'service_role') AND
    (OLD.subscription_id = NEW.subscription_id OR auth.jwt() -> 'app_metadata' ->> 'role' = 'service_role') AND
    (OLD.stripe_customer_id = NEW.stripe_customer_id OR auth.jwt() -> 'app_metadata' ->> 'role' = 'service_role')
);

-- Service role can insert profiles (for new user registration)
CREATE POLICY "profiles_insert_auth" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ============================================
-- SESSIONS TABLE POLICIES
-- ============================================

-- Users can view their own sessions
CREATE POLICY "sessions_select_own" 
ON sessions FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own sessions (subscription check handled by trigger)
CREATE POLICY "sessions_insert_own" 
ON sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "sessions_update_own" 
ON sessions FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete/archive their own sessions
CREATE POLICY "sessions_delete_own" 
ON sessions FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================
-- ANSWERS TABLE POLICIES
-- ============================================

-- Users can view answers for their sessions
CREATE POLICY "answers_select_own" 
ON answers FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = answers.session_id 
        AND sessions.user_id = auth.uid()
    )
);

-- Users can insert answers for their sessions
CREATE POLICY "answers_insert_own" 
ON answers FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = answers.session_id 
        AND sessions.user_id = auth.uid()
        AND sessions.status = 'in_progress'
    )
);

-- Users can update answers for their in-progress sessions
CREATE POLICY "answers_update_own" 
ON answers FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = answers.session_id 
        AND sessions.user_id = auth.uid()
        AND sessions.status = 'in_progress'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = answers.session_id 
        AND sessions.user_id = auth.uid()
        AND sessions.status = 'in_progress'
    )
);

-- Users can delete answers from their in-progress sessions
CREATE POLICY "answers_delete_own" 
ON answers FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = answers.session_id 
        AND sessions.user_id = auth.uid()
        AND sessions.status = 'in_progress'
    )
);

-- ============================================
-- OUTPUTS TABLE POLICIES
-- ============================================

-- Users can view outputs for their sessions
CREATE POLICY "outputs_select_own" 
ON outputs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = outputs.session_id 
        AND sessions.user_id = auth.uid()
    )
);

-- System can create outputs for user sessions (via service role)
CREATE POLICY "outputs_insert_system" 
ON outputs FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = outputs.session_id 
        AND (
            sessions.user_id = auth.uid() OR 
            auth.jwt() -> 'app_metadata' ->> 'role' = 'service_role'
        )
    )
);

-- System can update outputs (for versioning)
CREATE POLICY "outputs_update_system" 
ON outputs FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = outputs.session_id 
        AND (
            sessions.user_id = auth.uid() OR 
            auth.jwt() -> 'app_metadata' ->> 'role' = 'service_role'
        )
    )
);

-- Users can delete their own outputs
CREATE POLICY "outputs_delete_own" 
ON outputs FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = outputs.session_id 
        AND sessions.user_id = auth.uid()
    )
);

-- ============================================
-- PHASE_TEMPLATES TABLE POLICIES
-- ============================================

-- Everyone can read phase templates (public data)
CREATE POLICY "phase_templates_select_all" 
ON phase_templates FOR SELECT 
USING (true);

-- Only service role can modify templates
CREATE POLICY "phase_templates_insert_admin" 
ON phase_templates FOR INSERT 
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'service_role');

CREATE POLICY "phase_templates_update_admin" 
ON phase_templates FOR UPDATE 
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'service_role');

CREATE POLICY "phase_templates_delete_admin" 
ON phase_templates FOR DELETE 
USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'service_role');

-- ============================================
-- EXPORT_HISTORY TABLE POLICIES
-- ============================================

-- Users can view their own export history
CREATE POLICY "export_history_select_own" 
ON export_history FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create export records for their sessions
CREATE POLICY "export_history_insert_own" 
ON export_history FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = export_history.session_id 
        AND sessions.user_id = auth.uid()
    )
);

-- Users cannot update export history (immutable)
-- No UPDATE policy

-- System can delete expired exports
CREATE POLICY "export_history_delete_expired" 
ON export_history FOR DELETE 
USING (
    auth.uid() = user_id OR 
    (expires_at IS NOT NULL AND expires_at < NOW())
);

-- ============================================
-- AUDIT_LOG TABLE POLICIES
-- ============================================

-- Users can view their own audit logs
CREATE POLICY "audit_log_select_own" 
ON audit_log FOR SELECT 
USING (auth.uid() = user_id);

-- System creates audit logs (service role only)
CREATE POLICY "audit_log_insert_system" 
ON audit_log FOR INSERT 
WITH CHECK (
    auth.uid() = user_id OR 
    auth.jwt() -> 'app_metadata' ->> 'role' = 'service_role'
);

-- Audit logs are immutable - no UPDATE or DELETE policies

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Function to check if user owns a session
CREATE OR REPLACE FUNCTION user_owns_session(session_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM sessions 
        WHERE id = session_uuid 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION user_has_active_subscription()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND subscription_status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's session count
CREATE OR REPLACE FUNCTION get_user_session_count(status_filter TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    session_count INTEGER;
BEGIN
    IF status_filter IS NULL THEN
        SELECT COUNT(*) INTO session_count
        FROM sessions 
        WHERE user_id = auth.uid();
    ELSE
        SELECT COUNT(*) INTO session_count
        FROM sessions 
        WHERE user_id = auth.uid() 
        AND status = status_filter;
    END IF;
    
    RETURN COALESCE(session_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on all sequences to authenticated users
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant basic permissions to authenticated users
GRANT SELECT ON phase_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON answers TO authenticated;
GRANT SELECT ON outputs TO authenticated;
GRANT SELECT, INSERT ON export_history TO authenticated;
GRANT SELECT ON audit_log TO authenticated;

-- Grant permissions to service role (for system operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;