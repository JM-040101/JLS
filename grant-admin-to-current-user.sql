-- Grant admin access to the currently logged in user
-- This script makes ANY registered user an admin
-- Run this in Supabase SQL Editor

-- Option 1: Grant admin to a specific email
-- Replace 'YOUR_EMAIL_HERE' with the actual email of the logged in user
DO $$
DECLARE
  target_user_id uuid;
  target_email text := 'YOUR_EMAIL_HERE'; -- CHANGE THIS!
BEGIN
  -- Get user ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User not found: %', target_email;
    RAISE NOTICE 'Available users:';
    FOR target_email IN SELECT email FROM auth.users LOOP
      RAISE NOTICE '  - %', target_email;
    END LOOP;
    RETURN;
  END IF;

  RAISE NOTICE 'Granting admin access to: % (ID: %)', target_email, target_user_id;

  -- Create/update profile with superadmin privileges
  INSERT INTO public.profiles (
    id, email, role, is_admin, permissions, admin_notes, upgraded_at, created_at, updated_at
  ) VALUES (
    target_user_id,
    target_email,
    'superadmin',
    true,
    jsonb_build_object(
      'access_all_features', true,
      'bypass_limits', true,
      'manage_users', true,
      'view_analytics', true,
      'manage_billing', true,
      'export_data', true,
      'access_admin_panel', true,
      'modify_system_settings', true
    ),
    'Superadmin - full system access',
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'superadmin',
    is_admin = true,
    permissions = jsonb_build_object(
      'access_all_features', true,
      'bypass_limits', true,
      'manage_users', true,
      'view_analytics', true,
      'manage_billing', true,
      'export_data', true,
      'access_admin_panel', true,
      'modify_system_settings', true
    ),
    admin_notes = 'Superadmin - full system access',
    upgraded_at = NOW(),
    updated_at = NOW();

  -- Add unlimited overrides
  INSERT INTO public.admin_overrides (user_id, override_type, override_value, reason, created_by)
  VALUES
    (target_user_id, 'subscription', '{"plan": "unlimited", "tier": "superadmin"}'::jsonb, 'Admin access', target_user_id),
    (target_user_id, 'limits', '{"blueprints": -1, "exports": -1, "storage": -1}'::jsonb, 'Admin unlimited', target_user_id),
    (target_user_id, 'features', '{"all": true}'::jsonb, 'Admin all features', target_user_id)
  ON CONFLICT (user_id, override_type) DO UPDATE
  SET override_value = EXCLUDED.override_value;

  RAISE NOTICE '✓ SUCCESS! % is now a superadmin!', target_email;
  RAISE NOTICE 'Admin privileges granted:';
  RAISE NOTICE '  ✓ Unlimited blueprints and exports';
  RAISE NOTICE '  ✓ All features unlocked';
  RAISE NOTICE '  ✓ Admin panel access at /admin';
  RAISE NOTICE '  ✓ No payment required';
END
$$;

-- Option 2: List all registered users (use this first to find the email)
SELECT
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Option 3: Grant admin to james@martialmarketing.org specifically
-- Just copy this section if you know James is registered
DO $$
DECLARE
  james_id uuid;
BEGIN
  SELECT id INTO james_id FROM auth.users WHERE email = 'james@martialmarketing.org';

  IF james_id IS NOT NULL THEN
    -- Update profile
    INSERT INTO public.profiles (
      id, email, role, is_admin, permissions, admin_notes, upgraded_at, created_at, updated_at
    ) VALUES (
      james_id, 'james@martialmarketing.org', 'superadmin', true,
      '{"access_all_features": true, "bypass_limits": true, "manage_users": true, "view_analytics": true, "manage_billing": true, "export_data": true, "access_admin_panel": true, "modify_system_settings": true}'::jsonb,
      'Primary administrator', NOW(), NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'superadmin',
      is_admin = true,
      permissions = '{"access_all_features": true, "bypass_limits": true, "manage_users": true, "view_analytics": true, "manage_billing": true, "export_data": true, "access_admin_panel": true, "modify_system_settings": true}'::jsonb,
      admin_notes = 'Primary administrator',
      upgraded_at = NOW();

    -- Add overrides
    INSERT INTO public.admin_overrides (user_id, override_type, override_value, reason, created_by)
    VALUES
      (james_id, 'subscription', '{"plan": "unlimited"}'::jsonb, 'Admin', james_id),
      (james_id, 'limits', '{"blueprints": -1, "exports": -1}'::jsonb, 'Admin', james_id),
      (james_id, 'features', '{"all": true}'::jsonb, 'Admin', james_id)
    ON CONFLICT (user_id, override_type) DO UPDATE SET override_value = EXCLUDED.override_value;

    RAISE NOTICE '✓ james@martialmarketing.org is now a superadmin!';
  ELSE
    RAISE NOTICE '✗ james@martialmarketing.org not found in database';
  END IF;
END
$$;

-- Verify the setup
SELECT
  p.email,
  p.role,
  p.is_admin,
  p.permissions,
  (SELECT json_agg(json_build_object('type', ao.override_type, 'value', ao.override_value))
   FROM admin_overrides ao WHERE ao.user_id = p.id) as overrides
FROM profiles p
WHERE p.is_admin = true;
