import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

async function globalTeardown() {
  console.log('\n🧹 Running global test teardown...')
  
  const testDataDir = path.join(process.cwd(), 'tests/e2e/test-data')
  
  // Clean up test data files
  if (fs.existsSync(testDataDir)) {
    console.log('📁 Removing test data directory...')
    fs.rmSync(testDataDir, { recursive: true, force: true })
  }

  // Clean up test database records if configured
  if (process.env.CLEANUP_TEST_DATABASE === 'true') {
    const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.TEST_SUPABASE_SERVICE_KEY // Need service key for cleanup
    
    if (supabaseUrl && supabaseKey) {
      console.log('🗑️  Cleaning up test database records...')
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      try {
        // Clean up test sessions
        await supabase
          .from('sessions')
          .delete()
          .ilike('project_name', 'test-%')
        
        // Clean up test exports
        await supabase
          .from('exports')
          .delete()
          .ilike('project_name', 'test-%')
        
        // Clean up test payment records
        await supabase
          .from('checkout_sessions')
          .delete()
          .eq('status', 'test')
        
        console.log('✅ Test database cleaned')
      } catch (error) {
        console.error('Failed to clean test database:', error)
      }
    }
  }
  
  console.log('✅ Global teardown complete')
}

export default globalTeardown