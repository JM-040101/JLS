import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/workflow', '/export', '/profile']
  const authRoutes = ['/auth/sign-in', '/auth/sign-up']
  const currentPath = req.nextUrl.pathname

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    currentPath.startsWith(route)
  )

  // Check if current path is auth route
  const isAuthRoute = authRoutes.some(route => 
    currentPath.startsWith(route)
  )

  // Redirect to sign-in if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/sign-in', req.url)
    redirectUrl.searchParams.set('redirect', currentPath)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth routes with active session
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Check subscription for workflow routes
  if (currentPath.startsWith('/workflow') && session) {
    // Fetch user profile to check subscription and admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, role, is_admin')
      .eq('id', session.user.id)
      .single()

    // Check if user is admin - admins bypass subscription requirement
    const isAdmin = profile?.is_admin === true || profile?.role === 'admin' || profile?.role === 'superadmin'

    // Redirect to pricing if no active subscription AND not an admin
    if (!isAdmin && (!profile || profile.subscription_status !== 'active')) {
      return NextResponse.redirect(new URL('/pricing', req.url))
    }
  }

  return res
}

// Apply middleware to specific routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}