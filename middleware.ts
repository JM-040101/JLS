import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const currentPath = req.nextUrl.pathname

  // Skip middleware for static assets and public routes
  if (
    currentPath.startsWith('/_next') ||
    currentPath.startsWith('/api') ||
    currentPath === '/favicon.ico' ||
    currentPath === '/' ||
    currentPath === '/pricing' ||
    currentPath === '/solutions'
  ) {
    return res
  }

  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - with timeout
  const sessionPromise = supabase.auth.getSession()
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Session timeout')), 5000)
  )

  let session
  try {
    const result = await Promise.race([sessionPromise, timeoutPromise]) as any
    session = result?.data?.session
  } catch (error) {
    console.error('Middleware session check timeout:', error)
    return res // Continue without session check on timeout
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/workflow', '/export', '/profile', '/settings', '/billing']
  const authRoutes = ['/auth/sign-in', '/auth/sign-up']

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

  // Note: Removed subscription check from middleware - moved to page-level for better performance
  // Subscription validation now happens in the workflow pages themselves

  return res
}

// Apply middleware only to specific routes that need auth
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/workflow/:path*',
    '/export/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/billing/:path*',
    '/auth/sign-in',
    '/auth/sign-up',
  ],
}