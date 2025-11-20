import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Sign out from Supabase
    await supabase.auth.signOut()

    // Return JSON success instead of redirect
    // Client will handle the redirect
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Sign out error:', error)
    // Still return success to allow client-side redirect
    return NextResponse.json({ success: true }, { status: 200 })
  }
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    await supabase.auth.signOut()
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Sign out error:', error)
    return NextResponse.json({ success: true }, { status: 200 })
  }
}