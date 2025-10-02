import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const TEST_USER_EMAIL = 'test@example.com'
const TEST_USER_PASSWORD = 'Test123456!'

async function globalSetup() {
  console.log('🚀 Running global test setup...')
  
  // Create test data directory
  const testDataDir = path.join(process.cwd(), 'tests/e2e/test-data')
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true })
  }

  // Initialize Supabase client for test setup
  const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase credentials not found, skipping database setup')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Clean up existing test data
  console.log('🧹 Cleaning up existing test data...')
  try {
    // Delete test user if exists
    const { data: existingUser } = await supabase.auth.admin?.getUserByEmail(TEST_USER_EMAIL)
    if (existingUser?.user) {
      await supabase.auth.admin?.deleteUser(existingUser.user.id)
    }

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
  } catch (error) {
    console.log('Note: Some cleanup operations may have failed (expected on first run)')
  }

  // Create test user for authenticated tests
  console.log('👤 Creating test user...')
  try {
    const { data, error } = await supabase.auth.signUp({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      options: {
        data: {
          full_name: 'Test User',
        },
      },
    })

    if (!error && data.user) {
      // Store auth session for reuse in tests
      const authState = {
        userId: data.user.id,
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
      }
      
      fs.writeFileSync(
        path.join(testDataDir, 'auth.json'),
        JSON.stringify(authState, null, 2)
      )
      
      console.log('✅ Test user created successfully')
    } else if (error?.message?.includes('already registered')) {
      console.log('ℹ️  Test user already exists')
    }
  } catch (error) {
    console.error('Failed to create test user:', error)
  }

  // Set up API mocks configuration
  const mockConfig = {
    gpt5: {
      enabled: true,
      responses: generateMockGPTResponses(),
    },
    claude: {
      enabled: true,
      responses: generateMockClaudeResponses(),
    },
    stripe: {
      enabled: true,
      testMode: true,
      webhookSecret: 'whsec_test_secret',
    },
  }
  
  fs.writeFileSync(
    path.join(testDataDir, 'mock-config.json'),
    JSON.stringify(mockConfig, null, 2)
  )

  console.log('✅ Global setup complete\n')
}

function generateMockGPTResponses() {
  const phases = [
    'Problem Definition',
    'Target Audience',
    'Core Features',
    'User Journey',
    'Technical Stack',
    'Data Model',
    'API Design',
    'Security & Compliance',
    'Monetization Strategy',
    'Launch Plan',
    'Growth Strategy',
    'Success Metrics',
  ]

  return phases.reduce((acc, phase, index) => {
    acc[`phase_${index + 1}`] = {
      question: `What is your approach for ${phase}?`,
      followUp: `Can you elaborate on your ${phase.toLowerCase()}?`,
      validation: 'Your answer has been recorded.',
    }
    return acc
  }, {})
}

function generateMockClaudeResponses() {
  return {
    planGeneration: {
      modules: [
        { name: 'auth', size: 45000 },
        { name: 'api', size: 48000 },
        { name: 'database', size: 42000 },
        { name: 'ui', size: 47000 },
        { name: 'payments', size: 44000 },
      ],
      prompts: [
        'setup-authentication',
        'create-api-endpoints',
        'configure-database',
        'build-ui-components',
        'integrate-payments',
      ],
    },
  }
}

export default globalSetup