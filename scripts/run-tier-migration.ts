#!/usr/bin/env tsx
/**
 * Run Subscription Tiers Migration
 * This script applies the 010_add_subscription_tiers.sql migration
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function runMigration() {
  console.log('\n🚀 Subscription Tiers Migration\n')

  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✗' : '✗')
    console.error('\n💡 Make sure .env.local is properly configured')
    process.exit(1)
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })

  console.log('✓ Connected to Supabase')
  console.log(`✓ Project: ${supabaseUrl}\n`)

  // Read migration file
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '010_add_subscription_tiers.sql')
  const migrationSQL = readFileSync(migrationPath, 'utf-8')

  console.log('📄 Migration file loaded')
  console.log(`📊 Size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`)

  console.log('⚠️  IMPORTANT:')
  console.log('This migration cannot be executed via the Supabase JS client.')
  console.log('You must run it in the Supabase SQL Editor.\n')

  console.log('📋 Instructions:')
  console.log('1. Open: https://app.supabase.com/project/rtycsgxcsedvdbhehcjs/sql/new')
  console.log('2. Copy the migration SQL from: supabase/migrations/010_add_subscription_tiers.sql')
  console.log('3. Paste into SQL Editor')
  console.log('4. Click "Run" or press Cmd+Enter\n')

  console.log('✨ Or copy this command to open the file:')
  console.log('   code supabase/migrations/010_add_subscription_tiers.sql\n')

  console.log('After running, verify with this query:')
  console.log('---')
  console.log(`SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('subscription_tier', 'active_projects_limit', 'features_enabled');`)
  console.log('---\n')
}

runMigration().catch(console.error)
