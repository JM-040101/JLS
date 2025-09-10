import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    )
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(
          new URL(`/auth/sign-in?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        )
      }

      // Get the session to check if it's a new user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single()

        // Create profile if it doesn't exist (new user)
        if (!profile) {
          await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name || 
                        null,
            })
        }

        // Redirect to dashboard with welcome flag for new users
        const isNewUser = !profile
        return NextResponse.redirect(
          new URL(isNewUser ? '/dashboard?welcome=true' : '/dashboard', requestUrl.origin)
        )
      }
    } catch (err) {
      console.error('Unexpected error in auth callback:', err)
      return NextResponse.redirect(
        new URL('/auth/sign-in?error=An unexpected error occurred', requestUrl.origin)
      )
    }
  }

  // No code provided, redirect to sign-in
  return NextResponse.redirect(new URL('/auth/sign-in', requestUrl.origin))
}