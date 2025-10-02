# 🚨 Fix Admin Access for Current User

## Problem
User can log in and access dashboard but NOT the admin panel at `/admin`.

---

## ✅ Quick Fix (3 Steps)

### Step 1: Find Your Email
Open your Supabase Dashboard:
1. Go to https://app.supabase.com
2. Select project: `rtycsgxcsedvdbhehcjs`
3. Go to **Authentication** → **Users**
4. Find your email address (the one you logged in with)

### Step 2: Run SQL Script
1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Choose one of these options:

#### Option A: If you're james@martialmarketing.org
```sql
-- Just run this directly
DO $$
DECLARE
  james_id uuid;
BEGIN
  SELECT id INTO james_id FROM auth.users WHERE email = 'james@martialmarketing.org';

  IF james_id IS NOT NULL THEN
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
      permissions = '{"access_all_features": true, "bypass_limits": true, "manage_users": true}'::jsonb,
      upgraded_at = NOW();

    INSERT INTO public.admin_overrides (user_id, override_type, override_value, reason, created_by)
    VALUES
      (james_id, 'subscription', '{"plan": "unlimited"}'::jsonb, 'Admin', james_id),
      (james_id, 'limits', '{"blueprints": -1, "exports": -1}'::jsonb, 'Admin', james_id),
      (james_id, 'features', '{"all": true}'::jsonb, 'Admin', james_id)
    ON CONFLICT (user_id, override_type) DO UPDATE SET override_value = EXCLUDED.override_value;

    RAISE NOTICE 'SUCCESS! james@martialmarketing.org is now a superadmin!';
  ELSE
    RAISE NOTICE 'ERROR: User not found';
  END IF;
END
$$;
```

#### Option B: Different Email
1. First, list all users:
```sql
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;
```

2. Copy your email from the results

3. Run this (replace YOUR_EMAIL_HERE):
```sql
DO $$
DECLARE
  target_user_id uuid;
  target_email text := 'YOUR_EMAIL_HERE'; -- Put your email here!
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', target_email;
  END IF;

  INSERT INTO public.profiles (
    id, email, role, is_admin, permissions, upgraded_at, created_at, updated_at
  ) VALUES (
    target_user_id, target_email, 'superadmin', true,
    '{"access_all_features": true, "bypass_limits": true, "manage_users": true, "view_analytics": true, "manage_billing": true, "export_data": true, "access_admin_panel": true}'::jsonb,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'superadmin',
    is_admin = true,
    permissions = '{"access_all_features": true, "bypass_limits": true, "manage_users": true}'::jsonb,
    upgraded_at = NOW();

  INSERT INTO public.admin_overrides (user_id, override_type, override_value, reason, created_by)
  VALUES
    (target_user_id, 'subscription', '{"plan": "unlimited"}'::jsonb, 'Admin', target_user_id),
    (target_user_id, 'limits', '{"blueprints": -1, "exports": -1}'::jsonb, 'Admin', target_user_id),
    (target_user_id, 'features', '{"all": true}'::jsonb, 'Admin', target_user_id)
  ON CONFLICT (user_id, override_type) DO UPDATE SET override_value = EXCLUDED.override_value;

  RAISE NOTICE 'SUCCESS! % is now a superadmin!', target_email;
END
$$;
```

### Step 3: Verify & Access
1. **Log out** from the app
2. **Log back in**
3. Go to: **http://localhost:3000/admin**
4. You should now see the admin dashboard!

---

## 🔍 Verify It Worked

Run this in Supabase SQL Editor:
```sql
SELECT
  p.email,
  p.role,
  p.is_admin,
  p.permissions
FROM profiles p
WHERE p.email = 'your@email.com'; -- Replace with your email
```

**Expected result:**
- `role`: "superadmin"
- `is_admin`: true
- `permissions`: Should show all access permissions

---

## ❌ Troubleshooting

### Problem: "User not found"
**Solution:** The email in the SQL doesn't match your registered email
- Go to Supabase → Authentication → Users
- Copy the EXACT email (case-sensitive)
- Use that in the SQL script

### Problem: Still can't access /admin
**Solutions:**
1. **Clear browser cache**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Log out and back in**: Sessions need to refresh
3. **Check database**: Run the verify query above
4. **Check console**: Open browser DevTools (F12) and look for errors

### Problem: SQL error about missing tables
**Solution:** Run migrations first:
```bash
# In your terminal
cd /workspaces/JLS
supabase db push
```

Or manually run: `supabase/migrations/007_add_admin_system.sql`

---

## 🎯 What Admin Access Gives You

Once the SQL runs successfully, you'll have:

✅ **Admin Panel**: Full dashboard at `/admin`
✅ **Unlimited Everything**: No limits on blueprints, exports, storage
✅ **User Management**: Control all users
✅ **System Settings**: Configure features
✅ **No Payment**: Bypass all subscription requirements
✅ **All Features**: Every premium feature unlocked

---

## 📞 Quick Reference

**Admin Panel URL**: http://localhost:3000/admin
**Supabase Dashboard**: https://app.supabase.com
**SQL Editor Path**: Supabase → SQL Editor → New Query

---

## 🔐 Security Note

Admin access is permanent once granted. The script:
- Makes you a superadmin in the database
- Adds unlimited access overrides
- Logs the action in `admin_access_log`
- Cannot be undone except by manual database changes

---

**Need Help?**
Check the full SQL script: `grant-admin-to-current-user.sql`
