# ✅ Vercel Deployment Checklist

## 🚀 Ready to Deploy!

All dependency issues are fixed. Follow this checklist:

---

## Step 1: Environment Variables (5 minutes)

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

### Add These Variables:

| Variable Name | Where to Get It | Required |
|--------------|-----------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | ✅ Yes |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g., https://your-app.vercel.app) | ✅ Yes |
| `STRIPE_PUBLISHABLE_KEY` | Stripe → API keys | ⚠️ For payments |
| `STRIPE_SECRET_KEY` | Stripe → API keys | ⚠️ For payments |
| `STRIPE_WEBHOOK_SECRET` | After creating webhook | ⚠️ For payments |
| `STRIPE_PRICE_ID_MONTHLY` | Stripe → Products | ⚠️ For payments |
| `STRIPE_PRICE_ID_ANNUAL` | Stripe → Products | ⚠️ For payments |
| `OPENAI_API_KEY` | OpenAI Platform | ⚠️ For AI |
| `ANTHROPIC_API_KEY` | Anthropic Console | ⚠️ For AI |

**Quick Values (Supabase):**
- URL: `https://rtycsgxcsedvdbhehcjs.supabase.co`
- Get anon and service keys from your Supabase dashboard

**For each variable:**
1. Click "Add New"
2. Enter Name
3. Enter Value
4. Select ALL environments (Production, Preview, Development)
5. Click Save

📖 **Detailed guide:** See `VERCEL-ENV-SETUP.md`

---

## Step 2: Trigger Deployment (2 minutes)

### Option A: Automatic (Recommended)
Latest commit is already pushed - Vercel should auto-deploy

### Option B: Manual
1. Go to **Vercel Dashboard → Your Project → Deployments**
2. Click **Redeploy** on latest deployment
3. ✅ Uncheck "Use existing Build Cache"
4. Click **Redeploy**

---

## Step 3: Monitor Build (3 minutes)

Watch the build logs. You should see:

```
✓ Installing dependencies...
✓ Running "npm install --legacy-peer-deps"
✓ Installed dependencies
✓ Building Next.js application
✓ Compiled successfully
✓ Deployment ready
```

**If build fails:** See troubleshooting below

---

## Step 4: Verify Deployment (2 minutes)

1. Click the deployment URL (e.g., `https://your-app.vercel.app`)
2. Check these work:
   - [ ] Landing page loads
   - [ ] Sign up page accessible (`/auth/sign-up`)
   - [ ] Sign in page accessible (`/auth/sign-in`)

---

## Step 5: Database Setup (5 minutes)

### Run Migrations in Supabase:

1. Go to Supabase → SQL Editor
2. Run each migration file in order:
   - `001_create_core_tables.sql`
   - `002_enable_rls_policies.sql`
   - `003_seed_phase_templates.sql`
   - `004_create_ai_tables.sql`
   - `005_create_export_tables.sql`
   - `006_create_payment_tables.sql`
   - `007_add_admin_system.sql`

Or use Supabase CLI:
```bash
supabase db push
```

---

## Step 6: Configure Supabase Auth (3 minutes)

1. Go to Supabase → Authentication → URL Configuration
2. Add your Vercel URL to:
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:**
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/**`

---

## Step 7: Set Up Stripe Webhook (Optional - 3 minutes)

Only if you want payments:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://your-app.vercel.app/api/stripe/webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy **Signing secret**
7. Add to Vercel: `STRIPE_WEBHOOK_SECRET`
8. Redeploy

---

## Step 8: Create Admin User (2 minutes)

### Register James:
1. Go to `https://your-app.vercel.app/auth/sign-up`
2. Register with: `james@martialmarketing.org`

### Grant Admin Access:
1. Go to Supabase → SQL Editor
2. Run this (see `FIX-ADMIN-ACCESS.md` for details):

```sql
DO $$
DECLARE
  james_id uuid;
BEGIN
  SELECT id INTO james_id FROM auth.users WHERE email = 'james@martialmarketing.org';

  INSERT INTO public.profiles (id, email, role, is_admin, permissions, upgraded_at, created_at, updated_at)
  VALUES (
    james_id, 'james@martialmarketing.org', 'superadmin', true,
    '{"access_all_features": true, "bypass_limits": true, "manage_users": true}'::jsonb,
    NOW(), NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET role = 'superadmin', is_admin = true, upgraded_at = NOW();

  INSERT INTO public.admin_overrides (user_id, override_type, override_value, reason, created_by)
  VALUES
    (james_id, 'subscription', '{"plan": "unlimited"}'::jsonb, 'Admin', james_id),
    (james_id, 'limits', '{"blueprints": -1, "exports": -1}'::jsonb, 'Admin', james_id),
    (james_id, 'features', '{"all": true}'::jsonb, 'Admin', james_id)
  ON CONFLICT (user_id, override_type) DO UPDATE SET override_value = EXCLUDED.override_value;
END
$$;
```

3. Log out and back in
4. Visit `https://your-app.vercel.app/admin`

---

## Step 9: Final Verification (3 minutes)

Test the full app:

### Authentication
- [ ] Sign up new user
- [ ] Sign in existing user
- [ ] Sign out works

### Dashboard
- [ ] Dashboard loads
- [ ] User menu displays
- [ ] Can start new blueprint

### Workflow (Optional - requires AI keys)
- [ ] Create new workflow
- [ ] Progress through phases
- [ ] Auto-save works

### Admin Panel
- [ ] Admin can access `/admin`
- [ ] Dashboard shows stats
- [ ] Admin features visible

### Payments (Optional - requires Stripe setup)
- [ ] Pricing page displays
- [ ] Checkout flow works
- [ ] Subscription management accessible

---

## 🎉 Success!

If all checks pass, your app is live at:
**https://your-app.vercel.app**

---

## 🚨 Troubleshooting

### Build Fails with Dependency Error
**Check:**
- `.npmrc` file exists in repo
- `vercel.json` has `installCommand: "npm install --legacy-peer-deps"`
- `package.json` has `zod@3.23.8`

**Fix:** All these are in latest commit. Redeploy should work.

### "Environment variable not defined"
**Fix:** Add missing variable in Vercel Dashboard → Settings → Environment Variables

### Database errors
**Fix:** Ensure all migrations are run in Supabase SQL Editor

### Auth callback fails
**Fix:** Add Vercel URL to Supabase redirect URLs

### Stripe webhook not working
**Fix:**
1. Create webhook in Stripe
2. Point to: `https://your-app.vercel.app/api/stripe/webhook`
3. Copy signing secret
4. Add as `STRIPE_WEBHOOK_SECRET` in Vercel
5. Redeploy

### Admin panel redirects to dashboard
**Fix:** Run admin SQL script in Supabase (Step 8)

---

## 📚 Reference Documentation

- `VERCEL-DEPLOYMENT.md` - Detailed deployment guide
- `VERCEL-ENV-SETUP.md` - Environment variables setup
- `FIX-ADMIN-ACCESS.md` - Admin access troubleshooting
- `README-ADMIN.md` - Admin system quick reference
- `ADMIN_SETUP_GUIDE.md` - Complete admin documentation

---

## ⏱️ Total Time Estimate

- **Minimum** (just deployment): ~15 minutes
- **Full setup** (with all features): ~30 minutes

---

**Last Updated:** October 2025
**Status:** ✅ Ready to Deploy
