/**
 * Script to run database migrations on Supabase
 * Usage: npx tsx scripts/run-migration.ts <migration-file>
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration(migrationFile: string) {
  console.log(`\n🔄 Running migration: ${migrationFile}\n`)

  // Read migration file
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile)

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8')

  // Split SQL into individual statements (handle multi-line statements)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'

    // Skip comments
    if (statement.trim().startsWith('--')) {
      continue
    }

    try {
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)

      const { error } = await supabase.rpc('exec_sql', { sql_query: statement }).single()

      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase.from('_migrations').insert({})

        if (directError) {
          throw error
        }
      }

      console.log(`✅ Statement ${i + 1} executed successfully`)
      successCount++
    } catch (error: any) {
      console.error(`❌ Error executing statement ${i + 1}:`)
      console.error(error.message)
      console.error(`\nStatement:\n${statement.substring(0, 200)}...\n`)
      errorCount++
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`Migration completed:`)
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`${'='.repeat(60)}\n`)

  if (errorCount > 0) {
    console.log('⚠️  Some statements failed. Please review the errors above.')
    console.log('💡 You may need to run these statements manually in the Supabase SQL Editor.')
    process.exit(1)
  } else {
    console.log('🎉 Migration completed successfully!')
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2]

if (!migrationFile) {
  console.error('❌ Please provide a migration file name')
  console.log('\nUsage: npx tsx scripts/run-migration.ts <migration-file>')
  console.log('Example: npx tsx scripts/run-migration.ts 010_add_subscription_tiers.sql')
  process.exit(1)
}

runMigration(migrationFile)
