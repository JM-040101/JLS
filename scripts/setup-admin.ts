#!/usr/bin/env node

/**
 * Script to set up james@martialmarketing.org as admin
 * Run this script after the database migration
 * 
 * Usage: npx tsx scripts/setup-admin.ts
 */

const ADMIN_EMAIL = 'james@martialmarketing.org'
const API_ENDPOINT = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function setupAdmin() {
  console.log('\n🔧 Setting up admin account for:', ADMIN_EMAIL)
  console.log('API Endpoint:', API_ENDPOINT)
  console.log('----------------------------------------\n')

  try {
    // First check current status
    console.log('📍 Checking current admin status...')
    const checkResponse = await fetch(`${API_ENDPOINT}/api/admin/setup-james`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (checkResponse.ok) {
      const checkData = await checkResponse.json()
      console.log('Current status:', checkData.message)
      
      if (checkData.isAdmin) {
        console.log('✅ Already an admin with role:', checkData.role)
        console.log('Permissions:', JSON.stringify(checkData.permissions, null, 2))
        return
      }
    }

    // Setup admin
    console.log('\n🚀 Setting up admin privileges...')
    const setupResponse = await fetch(`${API_ENDPOINT}/api/admin/setup-james`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const setupData = await setupResponse.json()

    if (!setupResponse.ok) {
      console.error('❌ Error:', setupData.error)
      if (setupData.details) {
        console.error('Details:', setupData.details)
      }
      process.exit(1)
    }

    console.log('✅', setupData.message)
    console.log('User ID:', setupData.userId)
    
    if (setupData.instructions) {
      console.log('\n📧 Next steps:', setupData.instructions)
    }

    console.log('\n🎉 Admin setup complete!')
    console.log('\nAdmin features enabled:')
    console.log('  ✓ Unlimited blueprints')
    console.log('  ✓ Unlimited exports')
    console.log('  ✓ All premium features')
    console.log('  ✓ Admin panel access')
    console.log('  ✓ User management')
    console.log('  ✓ System settings')
    console.log('  ✓ Analytics dashboard')
    console.log('  ✓ No payment required')
    
  } catch (error: any) {
    console.error('\n❌ Failed to setup admin:')
    console.error(error.message)
    process.exit(1)
  }
}

// Run the setup
setupAdmin().then(() => {
  console.log('\n✨ Done!\n')
  process.exit(0)
}).catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})