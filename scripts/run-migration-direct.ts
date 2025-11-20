#!/usr/bin/env tsx
/**
 * Run Subscription Tiers Migration Directly
 * Uses Supabase service role to execute SQL
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = 'https://rtycsgxcsedvdbhehcjs.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0eWNzZ3hjc2VkdmRiaGVoY2pzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAwOTk4NCwiZXhwIjoyMDcyNTg1OTg0fQ.XXc81KY7yGoM90JcKwXUaMhNoS-vJQwvdKBiHRvyPyQ'

async function runMigration() {
  console.log('\n🚀 Running Subscription Tiers Migration\n')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  })

  console.log('✓ Connected to Supabase')
  console.log('✓ Project: rtycsgxcsedvdbhehcjs\n')

  // Define migration steps that can be run individually
  const steps = [
    {
      name: 'Add subscription_tier column',
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'essentials', 'premium', 'pro_studio', 'enterprise'));`
    },
    {
      name: 'Add active_projects_limit column',
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_projects_limit INTEGER DEFAULT 1;`
    },
    {
      name: 'Add features_enabled column',
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS features_enabled JSONB DEFAULT '{}';`
    },
    {
      name: 'Add stripe_price_id column',
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;`
    },
    {
      name: 'Add tier analytics columns',
      sql: `ALTER TABLE profiles
            ADD COLUMN IF NOT EXISTS tier_upgraded_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS tier_downgraded_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS previous_tier TEXT;`
    },
    {
      name: 'Create index on subscription_tier',
      sql: `CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);`
    },
    {
      name: 'Create index on stripe_price_id',
      sql: `CREATE INDEX IF NOT EXISTS idx_profiles_stripe_price ON profiles(stripe_price_id);`
    },
    {
      name: 'Update existing active users to premium tier',
      sql: `UPDATE profiles
            SET subscription_tier = 'premium',
                active_projects_limit = 15,
                features_enabled = '{"priority_support": true, "advanced_prompts": true, "code_examples": true, "unlimited_exports": true}'::jsonb
            WHERE subscription_status = 'active'
            AND (subscription_tier IS NULL OR subscription_tier = 'free');`
    },
    {
      name: 'Set free tier defaults',
      sql: `UPDATE profiles
            SET active_projects_limit = 1,
                features_enabled = '{}'::jsonb
            WHERE subscription_tier = 'free' OR subscription_tier IS NULL;`
    }
  ]

  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  console.log('📝 Running migration steps...\n')

  for (const step of steps) {
    try {
      process.stdout.write(`⏳ ${step.name}... `)

      const { error } = await supabase.rpc('exec_sql', { sql: step.sql })

      if (error) {
        throw error
      }

      console.log('✅')
      successCount++
    } catch (error: any) {
      console.log('❌')
      errors.push(`${step.name}: ${error.message}`)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`Migration Results:`)
  console.log(`✅ Successful: ${successCount}/${steps.length}`)
  console.log(`❌ Failed: ${errorCount}/${steps.length}`)
  console.log('='.repeat(60) + '\n')

  if (errorCount > 0) {
    console.log('⚠️  Some steps failed (this is expected - exec_sql may not exist):\n')
    errors.forEach(err => console.log(`   • ${err}`))
    console.log('\n💡 Solution: Run the migration manually in Supabase SQL Editor:')
    console.log('   https://app.supabase.com/project/rtycsgxcsedvdbhehcjs/sql/new\n')
    console.log('📄 Migration file to copy:')
    console.log('   supabase/migrations/010_add_subscription_tiers.sql\n')
  } else {
    console.log('🎉 Basic columns added successfully!')
    console.log('\n⚠️  Still need to add manually in SQL Editor:')
    console.log('   • set_tier_limits() function')
    console.log('   • check_project_limit_before_session() function')
    console.log('   • user_has_feature() function')
    console.log('   • subscription_tier_mapping table')
    console.log('   • Triggers for automatic enforcement\n')
    console.log('💡 Copy and run the full migration file:')
    console.log('   supabase/migrations/010_add_subscription_tiers.sql\n')
  }

  // Try to verify what was created
  console.log('🔍 Verifying columns...\n')

  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_tier, active_projects_limit, features_enabled')
    .limit(1)

  if (!error && data) {
    console.log('✅ Columns exist and are accessible!')
    console.log('   Sample row:', data[0] || 'No profiles yet')
  } else {
    console.log('⚠️  Could not verify columns:', error?.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('Next steps:')
  console.log('1. Run full migration in SQL Editor (if not done)')
  console.log('2. Verify with: SELECT * FROM profiles LIMIT 1;')
  console.log('3. Configure Stripe Price IDs in .env.local')
  console.log('4. Update pricing page to use MultiTierPricingSection')
  console.log('='.repeat(60) + '\n')
}

runMigration().catch(console.error)
