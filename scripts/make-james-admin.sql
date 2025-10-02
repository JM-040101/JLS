-- Script to make james@martialmarketing.org a superadmin
-- Run this in your Supabase SQL Editor after the user registers

-- Step 1: Find James's user ID (run this first to check if user exists)
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'james@martialmarketing.org';

-- Step 2: Once you have the user ID, replace 'USER_ID_HERE' with the actual ID and run:
DO $$
DECLARE
  james_id uuid;
BEGIN
  -- Get James's ID
  SELECT id INTO james_id 
  FROM auth.users 
  WHERE email = 'james@martialmarketing.org';
  
  IF james_id IS NULL THEN
    RAISE NOTICE 'User james@martialmarketing.org not found. Please ensure the user registers first.';
    RETURN;
  END IF;
  
  -- Create or update profile with superadmin privileges
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_admin,
    permissions,
    admin_notes,
    upgraded_at,
    created_at,
    updated_at
  ) VALUES (
    james_id,
    'james@martialmarketing.org',
    'James (Admin)',
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
      'modify_system_settings', true,
      'bypass_payment', true
    ),
    'Primary system administrator - full access granted',
    NOW(),
    NOW(),
    NOW()
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
      'modify_system_settings', true,
      'bypass_payment', true
    ),
    admin_notes = 'Primary system administrator - full access granted',
    upgraded_at = NOW(),
    updated_at = NOW();
  
  -- Add subscription override (unlimited access)
  INSERT INTO public.admin_overrides (
    user_id,
    override_type,
    override_value,
    reason,
    created_by,
    created_at
  ) VALUES (
    james_id,
    'subscription',
    jsonb_build_object(
      'plan', 'unlimited',
      'tier', 'superadmin',
      'features', 'all',
      'status', 'active',
      'bypass_payment', true
    ),
    'Superadmin privileges - unlimited access',
    james_id,
    NOW()
  ) ON CONFLICT (user_id, override_type) DO UPDATE SET
    override_value = EXCLUDED.override_value,
    reason = EXCLUDED.reason;
  
  -- Add limits override (no limits)
  INSERT INTO public.admin_overrides (
    user_id,
    override_type,
    override_value,
    reason,
    created_by,
    created_at
  ) VALUES (
    james_id,
    'limits',
    jsonb_build_object(
      'blueprints', -1,
      'exports', -1,
      'storage', -1,
      'ai_calls', -1,
      'team_members', -1,
      'api_requests', -1
    ),
    'Superadmin - no limits',
    james_id,
    NOW()
  ) ON CONFLICT (user_id, override_type) DO UPDATE SET
    override_value = EXCLUDED.override_value,
    reason = EXCLUDED.reason;
  
  -- Add features override (all features enabled)
  INSERT INTO public.admin_overrides (
    user_id,
    override_type,
    override_value,
    reason,
    created_by,
    created_at
  ) VALUES (
    james_id,
    'features',
    jsonb_build_object(
      'all_features', true,
      'beta_access', true,
      'experimental', true,
      'admin_tools', true,
      'developer_mode', true,
      'priority_support', true,
      'custom_branding', true
    ),
    'Superadmin - all features enabled',
    james_id,
    NOW()
  ) ON CONFLICT (user_id, override_type) DO UPDATE SET
    override_value = EXCLUDED.override_value,
    reason = EXCLUDED.reason;
  
  -- Log the admin setup
  INSERT INTO public.admin_access_log (
    admin_id,
    action,
    resource,
    resource_id,
    metadata,
    created_at
  ) VALUES (
    james_id,
    'user_promoted_to_superadmin',
    'profiles',
    james_id::text,
    jsonb_build_object(
      'email', 'james@martialmarketing.org',
      'role', 'superadmin',
      'method', 'sql_script'
    ),
    NOW()
  );
  
  RAISE NOTICE 'SUCCESS: james@martialmarketing.org has been granted superadmin privileges!';
  RAISE NOTICE 'User ID: %', james_id;
  RAISE NOTICE 'Privileges granted:';
  RAISE NOTICE '  - Unlimited blueprints and exports';
  RAISE NOTICE '  - All premium features enabled';
  RAISE NOTICE '  - Admin panel access';
  RAISE NOTICE '  - User management capabilities';
  RAISE NOTICE '  - System settings control';
  RAISE NOTICE '  - No payment required';
  RAISE NOTICE '  - Priority support';
  
END
$$;

-- Step 3: Verify the setup (run this to confirm)
SELECT 
  p.id,
  p.email,
  p.role,
  p.is_admin,
  p.permissions,
  p.admin_notes,
  p.upgraded_at
FROM public.profiles p
WHERE p.email = 'james@martialmarketing.org';

-- Check overrides
SELECT 
  ao.override_type,
  ao.override_value,
  ao.reason
FROM public.admin_overrides ao
JOIN public.profiles p ON ao.user_id = p.id
WHERE p.email = 'james@martialmarketing.org';