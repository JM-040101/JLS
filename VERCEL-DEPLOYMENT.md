# 🚀 Vercel Deployment Guide

## ✅ Dependency Issues Fixed

The following issues have been resolved:
- ✅ Zod version conflict between @anthropic-ai/sdk and openai
- ✅ npm ERESOLVE errors
- ✅ Node.js engine compatibility
- ✅ Legacy peer dependencies handling

---

## 📋 Deployment Steps

### 1. Set Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

#### Required Variables:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rtycsgxcsedvdbhehcjs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Stripe (use test keys for now)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional
NODE_ENV=production
```

### 2. Trigger Deployment

After pushing the latest commit:
```bash
git push origin main
```

Or manually trigger in Vercel Dashboard:
1. Go to Deployments
2. Click "Redeploy"
3. Select latest commit

### 3. Monitor Build

Watch the build logs in Vercel. Expected output:
```
✓ Installing dependencies with legacy-peer-deps
✓ Compiling...
✓ Building Next.js application
✓ Deployment complete
```

---

## 🔧 What Was Fixed

### 1. Dependency Conflicts
**Problem:**
```
npm error ERESOLVE could not resolve
npm error While resolving: @anthropic-ai/sdk@0.63.0
npm error Found: zod@3.25.76
```

**Solution:**
- Downgraded `zod` from `3.25.76` to `3.23.8`
- Added `overrides` in package.json
- Created `.npmrc` with `legacy-peer-deps=true`

### 2. Node.js Version
**Problem:**
```
Warning: Detected "engines": { "node": ">=18.0.0" }
that will automatically upgrade when a new major Node.js Version is released
```

**Solution:**
- Set specific Node.js version: `>=18.17.0`
- Added `NODE_VERSION: 20.x` in vercel.json

### 3. Missing Dependencies
**Added:**
- `date-fns@^3.0.0` (used in invoice generation)

---

## 🎯 Vercel Configuration

Created `vercel.json` with:
- Custom install command with legacy-peer-deps
- Node.js 20.x runtime
- API function memory/timeout limits
- Environment variable references
- Regional deployment (Washington DC)

---

## 🐛 Troubleshooting

### Build Still Fails?

#### Check 1: Environment Variables
Ensure ALL required env vars are set in Vercel:
```bash
vercel env ls
```

#### Check 2: Clear Build Cache
In Vercel Dashboard:
1. Settings → General
2. Scroll to "Build & Development Settings"
3. Click "Clear Build Cache"
4. Redeploy

#### Check 3: Node Version
Verify Node.js version in build logs:
```
Node.js version: 20.x
```

#### Check 4: Install Command
Should see in logs:
```
npm install --legacy-peer-deps
```

### Common Errors

**Error: "Module not found: Can't resolve 'date-fns'"**
Solution: date-fns now added to package.json ✅

**Error: "Zod version mismatch"**
Solution: zod@3.23.8 with overrides now set ✅

**Error: "SUPABASE_SERVICE_ROLE_KEY is not defined"**
Solution: Add to Vercel environment variables

---

## 🔐 Security Notes

### Environment Variables
- Never commit `.env` files
- Rotate exposed Supabase keys (from previous commit)
- Use Vercel's encrypted environment variables
- Set different keys for production vs preview

### Webhook Setup
After deployment:
1. Get Vercel URL: `https://your-app.vercel.app`
2. Add webhook endpoint in Stripe: `https://your-app.vercel.app/api/stripe/webhook`
3. Copy webhook secret to Vercel env vars

---

## 📊 Deployment Checklist

Before going live:

### Database
- [ ] Run all migrations in Supabase
- [ ] Enable RLS policies
- [ ] Create admin user (james@martialmarketing.org)
- [ ] Test database connections

### APIs
- [ ] Add Stripe API keys (production)
- [ ] Add OpenAI API key (production)
- [ ] Add Anthropic API key (production)
- [ ] Configure Stripe webhooks
- [ ] Test API endpoints

### Configuration
- [ ] Set NEXT_PUBLIC_APP_URL to Vercel domain
- [ ] Update CORS settings in Supabase
- [ ] Configure allowed callback URLs
- [ ] Set up custom domain (optional)

### Testing
- [ ] Test authentication flow
- [ ] Test workflow creation
- [ ] Test payment checkout
- [ ] Test admin panel access
- [ ] Test export generation

---

## 🚦 Deployment Status

### Current Fix Status
✅ Dependency conflicts resolved
✅ .npmrc configured
✅ vercel.json created
✅ package.json updated
✅ Node version specified

### Ready to Deploy
The app is now ready for Vercel deployment. Push to main and it should build successfully.

---

## 📞 Quick Commands

```bash
# Push changes
git push origin main

# Check Vercel logs
vercel logs

# Set environment variable
vercel env add VARIABLE_NAME

# List environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

---

## 🎉 Success Indicators

Deployment succeeded when you see:
```
✓ Build completed
✓ Deployment completed
✓ Project deployed to: https://your-app.vercel.app
```

Then verify:
1. Visit: https://your-app.vercel.app
2. Sign up/login works
3. Dashboard loads
4. Admin panel accessible (after granting admin)

---

**Last Updated:** October 2025
**Deployment Region:** Washington, D.C. (iad1)
