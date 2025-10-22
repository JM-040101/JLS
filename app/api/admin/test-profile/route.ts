import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get profile for test user
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'samcarr1232@gmail.com')
      .single()

    if (error) {
      return NextResponse.json({
        error: error.message,
        profile: null
      })
    }

    return NextResponse.json({
      success: true,
      profile: profile
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Server error',
      message: error.message
    }, { status: 500 })
  }
}
