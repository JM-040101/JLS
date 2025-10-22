-- Migration: 008_admin_bypass_session_limits
-- Description: Allow admin users to bypass subscription and session limit checks
-- Author: System
-- Date: 2025

-- Update the check_subscription_before_session function to allow admin bypass
CREATE OR REPLACE FUNCTION check_subscription_before_session()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
    is_admin_user BOOLEAN;
BEGIN
    -- Get user profile with admin status
    SELECT subscription_status, role, is_admin
    INTO user_profile
    FROM profiles
    WHERE id = NEW.user_id;

    -- Check if user is admin
    is_admin_user := (
        user_profile.is_admin = true OR
        user_profile.role = 'admin' OR
        user_profile.role = 'superadmin'
    );

    -- Admin users bypass all checks
    IF is_admin_user THEN
        RETURN NEW;
    END IF;

    -- Check if regular user has active subscription
    IF user_profile.subscription_status != 'active' THEN
        RAISE EXCEPTION 'Active subscription required to create new blueprint session';
    END IF;

    -- Check concurrent session limit (max 3) for regular users
    IF (
        SELECT COUNT(*) FROM sessions
        WHERE user_id = NEW.user_id
        AND status = 'in_progress'
    ) >= 3 THEN
        RAISE EXCEPTION 'Maximum of 3 concurrent blueprint sessions allowed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION check_subscription_before_session IS 'Validates subscription and session limits, but allows admin users to bypass all checks';
