# Admin Setup Guide for james@martialmarketing.org

## 🎯 Objective
Grant james@martialmarketing.org full superadmin privileges with unlimited access to all features.

---

## 📋 Prerequisites

1. **Supabase project is set up** with migrations applied
2. **Environment variables configured** in `.env.local`
3. **Application is running** on localhost:3000

---

## 🚀 Setup Methods

### Method 1: Automatic API Setup (Recommended)

#### Step 1: Check Current Status
```bash
curl http://localhost:3000/api/admin/setup-james
```

**Response if not registered:**
```json
{
  "exists": false,
  "isAdmin": false,
  "message": "james@martialmarketing.org is not registered yet"
}
```

#### Step 2: Register James
1. Go to http://localhost:3000/auth/sign-up
2. Register with email: `james@martialmarketing.org`
3. Complete email verification (if enabled)

#### Step 3: Grant Admin Access
```bash
curl -X POST http://localhost:3000/api/admin/setup-james
```

**Expected Response:**
```json
{
  "success": true,
  "message": "james@martialmarketing.org has been upgraded to superadmin",
  "userId": "uuid-here"
}
```

#### Step 4: Verify Admin Access
```bash
curl http://localhost:3000/api/admin/setup-james
```

**Expected Response:**
```json
{
  "exists": true,
  "isAdmin": true,
  "role": "superadmin",
  "permissions": {
    "access_all_features": true,
    "bypass_limits": true,
    "manage_users": true,
    ...
  },
  "message": "james@martialmarketing.org is a superadmin"
}
```

---

### Method 2: Direct SQL (If API Fails)

#### Step 1: Access Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project: `rtycsgxcsedvdbhehcjs`
3. Navigate to: **SQL Editor**

#### Step 2: Run Admin Setup Script
Copy and paste the contents of `/scripts/make-james-admin.sql` into the SQL Editor and execute.

The script will:
- ✅ Find James's user account
- ✅ Create/update profile with superadmin role
- ✅ Add unlimited access overrides
- ✅ Grant all permissions
- ✅ Log the admin setup

#### Step 3: Verify in Database
```sql
-- Check profile
SELECT id, email, role, is_admin, permissions
FROM profiles
WHERE email = 'james@martialmarketing.org';

-- Check overrides
SELECT override_type, override_value
FROM admin_overrides ao
JOIN profiles p ON ao.user_id = p.id
WHERE p.email = 'james@martialmarketing.org';
```

---

### Method 3: Node.js Script

#### Run Setup Script
```bash
npx tsx scripts/setup-admin.ts
```

**Note:** Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

---

## 🎁 Admin Privileges Granted

Once setup is complete, james@martialmarketing.org will have:

### Access Rights
- ✅ **Admin Panel**: Access at `/admin`
- ✅ **User Management**: View and manage all users
- ✅ **System Settings**: Configure feature flags
- ✅ **Database Access**: Direct database queries
- ✅ **Analytics**: Full metrics dashboard
- ✅ **Security Logs**: Audit trail viewing

### No Limits
- ✅ **Unlimited Blueprints**: No monthly quotas
- ✅ **Unlimited Exports**: Generate infinite exports
- ✅ **Unlimited Storage**: No storage restrictions
- ✅ **Unlimited AI Calls**: No API call limits
- ✅ **No Payment Required**: Bypass all payment flows

### Permissions
```json
{
  "access_all_features": true,
  "bypass_limits": true,
  "manage_users": true,
  "view_analytics": true,
  "manage_billing": true,
  "export_data": true,
  "access_admin_panel": true,
  "modify_system_settings": true,
  "bypass_payment": true
}
```

---

## 🔍 Verification Checklist

After setup, verify these work:

### 1. Login Works
- [ ] Can login with james@martialmarketing.org
- [ ] No errors on dashboard

### 2. Admin Panel Access
- [ ] Visit http://localhost:3000/admin
- [ ] Should see admin dashboard (not redirected)
- [ ] Stats display correctly

### 3. Unlimited Access
- [ ] Can create multiple blueprints
- [ ] No payment prompts
- [ ] No limit warnings

### 4. Admin Features
- [ ] User management visible
- [ ] System settings accessible
- [ ] All features unlocked

---

## 🐛 Troubleshooting

### Issue: "Service role key not configured"
**Solution:** Add to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```
Get it from: Supabase Dashboard → Settings → API → service_role key

### Issue: "User not found"
**Solution:**
1. Ensure James has registered at `/auth/sign-up`
2. Check email verification is complete
3. Verify user exists in Supabase Auth

### Issue: Admin panel redirects to dashboard
**Solution:**
1. Clear browser cache
2. Re-run admin setup script
3. Check database for `is_admin = true`

### Issue: Still seeing payment prompts
**Solution:**
Check admin_overrides table:
```sql
SELECT * FROM admin_overrides
WHERE user_id = (
  SELECT id FROM profiles
  WHERE email = 'james@martialmarketing.org'
);
```

Should show overrides for: subscription, limits, features

---

## 📞 Quick Command Reference

```bash
# Check status
curl http://localhost:3000/api/admin/setup-james

# Grant admin (after registration)
curl -X POST http://localhost:3000/api/admin/setup-james

# Run migration
supabase db push

# Run Node script
npx tsx scripts/setup-admin.ts
```

---

## ⚡ Quick Start (TL;DR)

1. **Register**: Go to http://localhost:3000/auth/sign-up
2. **Make Admin**: Run `curl -X POST http://localhost:3000/api/admin/setup-james`
3. **Access Panel**: Visit http://localhost:3000/admin
4. **Done!** ✨

---

## 🔒 Security Notes

- Admin access is logged in `admin_access_log` table
- All admin actions are audited
- Only superadmins can promote other users
- Service role key should never be committed to git
- Rotate keys if exposed

---

## 📚 Related Files

- **Migration**: `/supabase/migrations/007_add_admin_system.sql`
- **SQL Script**: `/scripts/make-james-admin.sql`
- **Node Script**: `/scripts/setup-admin.ts`
- **API Route**: `/app/api/admin/setup-james/route.ts`
- **Admin Panel**: `/app/admin/page.tsx`
- **Admin Library**: `/lib/auth/admin.ts`

---

**Last Updated**: October 2025
**Maintainer**: System Administrator
