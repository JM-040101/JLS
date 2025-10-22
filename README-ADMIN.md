# Admin System Quick Reference

## 🎯 Make james@martialmarketing.org an Admin

### Fastest Method:
```bash
./setup-james-admin.sh
```

This script will:
1. Check if James is registered
2. Grant superadmin privileges if registered
3. Display admin panel URL

---

## 📋 Current Status

james@martialmarketing.org is currently: **NOT REGISTERED**

### To Set Up Admin Access:

1. **Register James**:
   - Go to http://localhost:3000/auth/sign-up
   - Register with: `james@martialmarketing.org`
   - Complete any email verification

2. **Grant Admin Access** (choose one):

   **Option A - Quick Script:**
   ```bash
   ./setup-james-admin.sh
   ```

   **Option B - Manual API:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/setup-james
   ```

   **Option C - SQL Direct:**
   - Open Supabase SQL Editor
   - Run: `scripts/make-james-admin.sql`

3. **Verify**:
   ```bash
   curl http://localhost:3000/api/admin/setup-james
   ```

4. **Access Admin Panel**:
   - Visit: http://localhost:3000/admin

---

## ✨ What James Gets

### Unlimited Access
- ∞ Blueprints per month
- ∞ Exports generated
- ∞ Storage space
- ∞ AI API calls
- ∞ Team members

### Admin Powers
- Full admin panel access
- Manage all users
- Configure system settings
- View analytics
- Access security logs
- Manage payments
- No payment required

### Permissions
- `access_all_features`
- `bypass_limits`
- `manage_users`
- `view_analytics`
- `manage_billing`
- `export_data`
- `access_admin_panel`
- `modify_system_settings`

---

## 🔍 Verify Admin Status

```bash
# Check via API
curl http://localhost:3000/api/admin/setup-james | jq

# Expected output when admin:
{
  "exists": true,
  "isAdmin": true,
  "role": "superadmin",
  "permissions": { ... },
  "message": "james@martialmarketing.org is a superadmin"
}
```

---

## 📚 Documentation

- **Detailed Guide**: `ADMIN_SETUP_GUIDE.md`
- **SQL Script**: `scripts/make-james-admin.sql`
- **Node Script**: `scripts/setup-admin.ts`
- **Quick Script**: `setup-james-admin.sh`

---

## 🚨 Important Notes

1. **User must register first** before granting admin access
2. **Service role key** required in `.env.local` for API method
3. **Admin actions are logged** in `admin_access_log` table
4. **One-time setup** - only needs to be done once

---

**Quick Command**: `./setup-james-admin.sh`
