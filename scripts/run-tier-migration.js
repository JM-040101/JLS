/**
 * Run the subscription tiers migration
 * This script executes the migration SQL directly on Supabase
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function runMigration() {
  console.log('🚀 Starting Subscription Tiers Migration\n')

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('✓ Supabase client initialized')
  console.log('✓ Project URL:', supabaseUrl)
  console.log('')

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '010_add_subscription_tiers.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  console.log('📄 Migration Steps:')
  console.log('   1. Add subscription_tier columns to profiles')
  console.log('   2. Update existing users with default tiers')
  console.log('   3. Create tier limit functions')
  console.log('   4. Update session validation')
  console.log('   5. Create tier mapping table')
  console.log('   6. Add analytics columns')
  console.log('')

  // Execute migration in parts for better error handling
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
      name: 'Create index on subscription_tier',
      sql: `CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);`
    },
    {
      name: 'Update existing active subscribers to premium',
      sql: `UPDATE profiles SET subscription_tier = 'premium', active_projects_limit = 15, features_enabled = '{"priority_support": true, "advanced_prompts": true, "code_examples": true, "unlimited_exports": true}'::jsonb WHERE subscription_status = 'active' AND subscription_tier = 'free';`
    },
    {
      name: 'Update free tier users',
      sql: `UPDATE profiles SET active_projects_limit = 1, features_enabled = '{}'::jsonb WHERE subscription_tier = 'free';`
    },
    {
      name: 'Add stripe_price_id column',
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;`
    },
    {
      name: 'Create index on stripe_price_id',
      sql: `CREATE INDEX IF NOT EXISTS idx_profiles_stripe_price ON profiles(stripe_price_id);`
    },
    {
      name: 'Add tier analytics columns',
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier_upgraded_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS tier_downgraded_at TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS previous_tier TEXT;`
    }
  ]

  let successCount = 0
  let errorCount = 0

  for (const step of steps) {
    try {
      process.stdout.write(`⏳ ${step.name}... `)

      const { error } = await supabase.rpc('exec_sql', { query: step.sql })

      if (error) {
        throw error
      }

      console.log('✅')
      successCount++
    } catch (error) {
      console.log('❌')
      console.error(`   Error: ${error.message}`)
      errorCount++
    }
  }

  console.log('')
  console.log('═'.repeat(60))
  console.log(`Migration Summary:`)
  console.log(`✅ Successful: ${successCount}/${steps.length}`)
  console.log(`❌ Failed: ${errorCount}/${steps.length}`)
  console.log('═'.repeat(60))
  console.log('')

  if (errorCount > 0) {
    console.log('⚠️  Some steps failed.')
    console.log('💡 You may need to run the remaining SQL manually in Supabase SQL Editor:')
    console.log('   https://app.supabase.com/project/rtycsgxcsedvdbhehcjs/sql/new')
    console.log('')
    console.log('The complete migration file is at:')
    console.log('   supabase/migrations/010_add_subscription_tiers.sql')
  } else {
    console.log('🎉 Migration completed successfully!')
    console.log('')
    console.log('⚠️  NOTE: Complex functions and triggers need to be added manually.')
    console.log('Please run the full migration in the Supabase SQL Editor to complete:')
    console.log('   1. set_tier_limits() function')
    console.log('   2. check_project_limit_before_session() function')
    console.log('   3. user_has_feature() function')
    console.log('   4. subscription_tier_mapping table')
    console.log('   5. Associated triggers')
  }

  console.log('')
  console.log('Next steps:')
  console.log('   1. Verify columns in Supabase Dashboard > Database > Tables > profiles')
  console.log('   2. Run remaining functions in SQL Editor if needed')
  console.log('   3. Test creating a new session to verify limits work')
  console.log('')
}

runMigration().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
