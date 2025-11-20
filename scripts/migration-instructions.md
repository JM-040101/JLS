# 🚀 Running the Subscription Tiers Migration

## Quick Start (5 minutes)

### Step 1: Open Supabase SQL Editor

Click this link to open your project's SQL Editor:
**👉 [Open SQL Editor](https://app.supabase.com/project/rtycsgxcsedvdbhehcjs/sql/new)**

### Step 2: Copy the Migration SQL

The migration file is located at:
```
supabase/migrations/010_add_subscription_tiers.sql
```

1. Open the file in your IDE (it should already be open)
2. Select all content (`Cmd+A` or `Ctrl+A`)
3. Copy (`Cmd+C` or `Ctrl+C`)

### Step 3: Paste and Run

1. Paste the SQL into the Supabase SQL Editor (`Cmd+V` or `Ctrl+V`)
2. Click the **"Run"** button (or press `Cmd+Enter`)
3. Wait for the success message

### Step 4: Verify the Migration

Run this verification query in a new SQL Editor tab:

```sql
-- Check if columns were added
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN (
  'subscription_tier',
  'active_projects_limit',
  'features_enabled',
  'stripe_price_id',
  'tier_upgraded_at',
  'tier_downgraded_at',
  'previous_tier'
)
ORDER BY column_name;

-- Check if functions were created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'set_tier_limits',
  'check_project_limit_before_session',
  'user_has_feature'
);

-- Check if new table was created
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'subscription_tier_mapping'
) as tier_mapping_exists;

-- Check user counts by tier
SELECT
  subscription_tier,
  COUNT(*) as user_count,
  AVG(active_projects_limit) as avg_project_limit
FROM profiles
GROUP BY subscription_tier
ORDER BY subscription_tier;
```

## Expected Results

After running the migration, you should see:

### New Columns in `profiles` table:
- ✅ `subscription_tier` (TEXT) - Default: 'free'
- ✅ `active_projects_limit` (INTEGER) - Default: 1
- ✅ `features_enabled` (JSONB) - Default: {}
- ✅ `stripe_price_id` (TEXT)
- ✅ `tier_upgraded_at` (TIMESTAMPTZ)
- ✅ `tier_downgraded_at` (TIMESTAMPTZ)
- ✅ `previous_tier` (TEXT)

### New Table:
- ✅ `subscription_tier_mapping` - Maps Stripe Price IDs to tiers

### New Functions:
- ✅ `set_tier_limits()` - Auto-sets limits when tier changes
- ✅ `check_project_limit_before_session()` - Validates project limits
- ✅ `user_has_feature()` - Checks feature access

### New Triggers:
- ✅ `set_tier_limits_on_change` - Fires when tier is updated
- ✅ `validate_project_limit_on_session` - Fires when creating sessions

## Troubleshooting

### Error: "column already exists"
This is fine! It means the migration was partially run before. The `IF NOT EXISTS` clauses will skip existing columns.

### Error: "function already exists"
Use `CREATE OR REPLACE FUNCTION` - the migration already handles this.

### Error: "trigger already exists"
The migration drops existing triggers before recreating them.

## What This Enables

After the migration completes, your app will support:

- ✅ 5 subscription tiers (Free, Essentials, Premium, Pro Studio, Enterprise)
- ✅ Project limits per tier (1, 5, 15, unlimited, unlimited)
- ✅ Export limits per tier (3, 25, unlimited, unlimited, unlimited)
- ✅ Feature flags system
- ✅ Automatic limit enforcement
- ✅ Stripe integration with tier mapping
- ✅ Tier analytics and tracking

## Next Steps

After migration:

1. ✅ Add Stripe Price IDs to `.env.local`
2. ✅ Update your pricing page to use `MultiTierPricingSection`
3. ✅ Test creating projects at each tier limit
4. ✅ Test the upgrade flow
5. ✅ Configure Stripe products and prices

---

Need help? The migration file contains detailed comments explaining each step.
