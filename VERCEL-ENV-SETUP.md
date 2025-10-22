# 🔐 Vercel Environment Variables Setup

## Quick Setup Guide

Go to your Vercel project: **Settings → Environment Variables**

---

## 📋 Required Variables (Copy & Paste)

### 1. Supabase Configuration

```bash
# Variable Name: NEXT_PUBLIC_SUPABASE_URL
# Value: https://rtycsgxcsedvdbhehcjs.supabase.co
# Environments: Production, Preview, Development

# Variable Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
# Value: [GET FROM SUPABASE DASHBOARD]
# Environments: Production, Preview, Development
# Location: Supabase → Settings → API → anon/public key

# Variable Name: SUPABASE_SERVICE_ROLE_KEY
# Value: [GET FROM SUPABASE DASHBOARD]
# Environments: Production, Preview, Development
# Location: Supabase → Settings → API → service_role key (secret!)
```

---

### 2. Application Configuration

```bash
# Variable Name: NEXT_PUBLIC_APP_URL
# Value: https://your-app-name.vercel.app
# Environments: Production, Preview, Development
# Note: Change to your actual Vercel URL after first deployment
```

---

### 3. Stripe Configuration

```bash
# Variable Name: STRIPE_PUBLISHABLE_KEY
# Value: pk_test_... (or pk_live_... for production)
# Environments: Production, Preview, Development
# Location: Stripe Dashboard → Developers → API keys

# Variable Name: STRIPE_SECRET_KEY
# Value: sk_test_... (or sk_live_... for production)
# Environments: Production, Preview, Development
# Location: Stripe Dashboard → Developers → API keys (secret!)

# Variable Name: STRIPE_WEBHOOK_SECRET
# Value: whsec_... (create after deployment)
# Environments: Production
# Location: Stripe Dashboard → Developers → Webhooks
# Note: Create webhook pointing to: https://your-app.vercel.app/api/stripe/webhook

# Variable Name: STRIPE_PRICE_ID_MONTHLY
# Value: price_...
# Environments: Production, Preview, Development
# Location: Stripe Dashboard → Products → Your Product → Pricing

# Variable Name: STRIPE_PRICE_ID_ANNUAL
# Value: price_...
# Environments: Production, Preview, Development
# Location: Stripe Dashboard → Products → Your Product → Pricing
```

---

### 4. AI API Keys

```bash
# Variable Name: OPENAI_API_KEY
# Value: sk-...
# Environments: Production, Preview, Development
# Location: OpenAI Dashboard → API Keys
# Note: For GPT-5 workflow engine

# Variable Name: ANTHROPIC_API_KEY
# Value: sk-ant-...
# Environments: Production, Preview, Development
# Location: Anthropic Console → API Keys
# Note: For Claude plan processing
```

---

### 5. Optional Variables

```bash
# Variable Name: NODE_ENV
# Value: production
# Environments: Production

# Variable Name: DATABASE_URL
# Value: [Supabase connection string]
# Environments: Production, Preview, Development
# Location: Supabase → Settings → Database → Connection string
# Note: Only needed for direct database access
```

---

## 🎯 Step-by-Step Setup

### Step 1: Access Vercel Settings
1. Go to https://vercel.com
2. Select your project
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add Each Variable
For each variable above:
1. Click **Add New**
2. Enter **Name** (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. Enter **Value** (the actual key/URL)
4. Select **Environments**:
   - ✅ Production (always check)
   - ✅ Preview (recommended)
   - ✅ Development (optional)
5. Click **Save**

### Step 3: Verify
After adding all variables:
1. Go to **Deployments**
2. Click **Redeploy** on latest deployment
3. Select **Use existing Build Cache** (uncheck)
4. Click **Redeploy**

---

## 🔍 Getting Your Keys

### Supabase Keys
1. Go to https://app.supabase.com
2. Select project: `rtycsgxcsedvdbhehcjs`
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### Stripe Keys
1. Go to https://dashboard.stripe.com
2. Go to **Developers** → **API keys**
3. For testing:
   - **Publishable key** → `STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`
4. For products:
   - Go to **Products**
   - Create or select product
   - Copy **Price ID** from pricing section

### OpenAI Key
1. Go to https://platform.openai.com
2. Go to **API keys**
3. Create new key → `OPENAI_API_KEY`

### Anthropic Key
1. Go to https://console.anthropic.com
2. Go to **API Keys**
3. Create new key → `ANTHROPIC_API_KEY`

---

## ⚠️ IMPORTANT Security Notes

### 🔴 NEVER commit these to Git:
- ❌ Service role keys
- ❌ Stripe secret keys
- ❌ API keys

### ✅ Safe to commit:
- ✅ Public/anon keys (NEXT_PUBLIC_*)
- ✅ URLs
- ✅ .env.example files (with placeholder values)

### 🔒 Rotate Keys If:
- Keys were committed to Git
- Keys were exposed in logs
- Team member left
- Suspicious activity detected

---

## 🎨 Environment Variable Checklist

Copy this checklist and check off as you add each:

### Core Configuration
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`

### Stripe Integration
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET` (after webhook setup)
- [ ] `STRIPE_PRICE_ID_MONTHLY`
- [ ] `STRIPE_PRICE_ID_ANNUAL`

### AI Services
- [ ] `OPENAI_API_KEY`
- [ ] `ANTHROPIC_API_KEY`

### Optional
- [ ] `NODE_ENV`
- [ ] `DATABASE_URL`

---

## 🚨 Troubleshooting

### Error: "NEXT_PUBLIC_SUPABASE_URL is undefined"
**Solution:** Ensure environment variable is added to **Production** environment in Vercel

### Error: "Invalid API key"
**Solutions:**
1. Check key is copied completely (no spaces)
2. Verify key is from correct environment (test vs live)
3. Regenerate key if necessary

### Error: Webhook not working
**Solutions:**
1. Ensure webhook URL is correct: `https://your-app.vercel.app/api/stripe/webhook`
2. Copy webhook secret from Stripe
3. Add `STRIPE_WEBHOOK_SECRET` to Vercel
4. Redeploy

### Changes not taking effect
**Solution:**
1. Go to Deployments
2. Click **Redeploy**
3. Uncheck "Use existing Build Cache"
4. Environment variables only update on new deployments

---

## 📝 Quick Copy Template

For easy copying to Vercel (replace values with your actual keys):

```
NEXT_PUBLIC_SUPABASE_URL=https://rtycsgxcsedvdbhehcjs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=production
```

---

## 🎉 Verification

After setting all variables and redeploying:

1. **Check build logs**:
   - No "undefined" errors
   - Build completes successfully

2. **Test the app**:
   - Visit your Vercel URL
   - Sign up/login works
   - Dashboard loads
   - No console errors

3. **Verify API connections**:
   - Supabase queries work
   - Stripe checkout loads
   - AI features respond

---

**Need Help?**
See full deployment guide: `VERCEL-DEPLOYMENT.md`
