import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get request body
    const body = await request.json()
    const { email, role = 'superadmin' } = body

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // Update the user's profile to make them an admin
    const { data: profiles, error: updateError } = await supabase
      .from('profiles')
      .update({
        role: role,
        is_admin: true,
        permissions: {
          manage_users: true,
          view_analytics: true,
          manage_settings: true,
          access_database: true,
          view_logs: true,
          manage_payments: true,
          unlimited_blueprints: true,
          unlimited_exports: true
        }
      })
      .eq('email', email)
      .select('id, email, role, is_admin, permissions')

    const profile = profiles?.[0]

    if (updateError) {
      return NextResponse.json({
        error: 'Failed to promote user',
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} promoted to ${role}`,
      profile: profile
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Server error',
      message: error.message
    }, { status: 500 })
  }
}
