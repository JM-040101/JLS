/**
 * Apply subscription tiers migration
 * Run: npx tsx scripts/apply-tier-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

async function applyMigration() {
  console.log('🚀 Starting migration: Add Subscription Tiers\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL')
    console.error('   SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '010_add_subscription_tiers.sql')
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

  console.log('📄 Migration file loaded')
  console.log('📊 SQL Length:', migrationSQL.length, 'characters\n')

  console.log('⚠️  IMPORTANT: This script requires the pg_net extension or direct SQL access.')
  console.log('📝 Please run this migration manually in the Supabase SQL Editor:\n')
  console.log('1. Go to: https://app.supabase.com/project/rtycsgxcsedvdbhehcjs/sql')
  console.log('2. Click "New Query"')
  console.log('3. Copy the contents of: supabase/migrations/010_add_subscription_tiers.sql')
  console.log('4. Paste and click "Run"\n')

  console.log('✅ After running, the following will be added to your database:')
  console.log('   • subscription_tier column in profiles table')
  console.log('   • active_projects_limit column in profiles table')
  console.log('   • features_enabled JSONB column in profiles table')
  console.log('   • subscription_tier_mapping table')
  console.log('   • Automated triggers for tier limits')
  console.log('   • Helper functions for feature checks\n')

  console.log('💡 Quick link:')
  console.log('   https://app.supabase.com/project/rtycsgxcsedvdbhehcjs/sql/new\n')
}

applyMigration().catch(console.error)
