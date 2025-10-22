import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        isAdmin: false
      }, { status: 401 })
    }

    // Check profile directly
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, is_admin, permissions, admin_notes')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({
        error: 'Profile not found',
        profileError: profileError.message,
        isAdmin: false
      }, { status: 404 })
    }

    // Check using database function
    const { data: functionResult, error: functionError } = await supabase
      .rpc('is_admin', { user_id: user.id })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile: profile,
      isAdminFromFunction: functionResult,
      isAdminFromProfile: profile.is_admin === true || profile.role === 'admin' || profile.role === 'superadmin'
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Server error',
      message: error.message,
      isAdmin: false
    }, { status: 500 })
  }
}
