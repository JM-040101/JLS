'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react'
import GoogleAuthButton from '@/components/auth/google-auth-button'
import { branding } from '@/branding.config'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const supabase = createClientComponentClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.session) {
        router.push(redirect)
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: branding.colors.background }}>
      <div className="w-full max-w-md">
        <div className="rounded-lg p-8" style={{
          background: branding.colors.surface,
          border: `1px solid ${branding.colors.divider}`,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4" style={{
              background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
              boxShadow: `0 0 20px ${branding.colors.accentGlow}`
            }}>
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: branding.colors.textHeading }}>
              Welcome Back
            </h1>
            <p style={{ color: branding.colors.text }}>
              Sign in to continue building your SaaS blueprint
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg flex items-start" style={{
              background: `${branding.colors.error}15`,
              border: `1px solid ${branding.colors.error}`
            }}>
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: branding.colors.error }} />
              <p className="text-sm" style={{ color: branding.colors.error }}>{error}</p>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: branding.colors.text }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: branding.colors.textMuted }} />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
                  style={{
                    background: branding.colors.background,
                    borderColor: branding.colors.divider,
                    color: branding.colors.text
                  }}
                  placeholder="you@example.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: branding.colors.text }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: branding.colors.textMuted }} />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
                  style={{
                    background: branding.colors.background,
                    borderColor: branding.colors.divider,
                    color: branding.colors.text
                  }}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/auth/forgot-password"
                className="text-sm transition-colors"
                style={{ color: branding.colors.accent }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-medium transition-all"
              style={{
                background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                color: branding.colors.background,
                boxShadow: `0 0 20px ${branding.colors.accentGlow}`
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: branding.colors.divider }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2" style={{
                background: branding.colors.surface,
                color: branding.colors.textMuted
              }}>Or continue with</span>
            </div>
          </div>

          {/* Social Auth */}
          <GoogleAuthButton />

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm" style={{ color: branding.colors.text }}>
            Don't have an account?{' '}
            <Link
              href="/auth/sign-up"
              className="font-medium transition-colors"
              style={{ color: branding.colors.accent }}
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: branding.colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: branding.colors.accent }}></div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}