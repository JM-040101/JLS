'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import GoogleAuthButton from '@/components/auth/google-auth-button'
import { branding } from '@/branding.config'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities?.length === 0) {
          setSuccess(true)
        } else {
          // Auto-confirmed, redirect to onboarding
          router.push('/dashboard?welcome=true')
          router.refresh()
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: branding.colors.background }}>
        <div className="w-full max-w-md">
          <div className="rounded-lg p-8 text-center" style={{
            background: branding.colors.surface,
            border: `1px solid ${branding.colors.divider}`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
          }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
              background: `${branding.colors.success}22`,
              border: `2px solid ${branding.colors.success}`
            }}>
              <CheckCircle className="w-8 h-8" style={{ color: branding.colors.success }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: branding.colors.textHeading }}>
              Check Your Email
            </h2>
            <p className="mb-6" style={{ color: branding.colors.text }}>
              We've sent a confirmation link to <strong>{email}</strong>.
              Please check your email to activate your account.
            </p>
            <Link
              href="/auth/sign-in"
              className="inline-block px-6 py-3 rounded-lg font-medium transition-all"
              style={{
                background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                color: branding.colors.background,
                boxShadow: `0 0 20px ${branding.colors.accentGlow}`
              }}
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
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
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: branding.colors.textHeading }}>
              Create Your Account
            </h1>
            <p style={{ color: branding.colors.text }}>
              Start building your SaaS blueprint today
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

          {/* Sign Up Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-1" style={{ color: branding.colors.text }}>
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: branding.colors.textMuted }} />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
                  style={{
                    background: branding.colors.background,
                    borderColor: branding.colors.divider,
                    color: branding.colors.text
                  }}
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>
            </div>

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
                  minLength={8}
                />
              </div>
              <p className="mt-1 text-xs" style={{ color: branding.colors.textMuted }}>
                Must be at least 8 characters
              </p>
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded"
                style={{ accentColor: branding.colors.accent }}
              />
              <label htmlFor="terms" className="ml-2 text-sm" style={{ color: branding.colors.text }}>
                I agree to the{' '}
                <Link href="/terms" className="transition-colors" style={{ color: branding.colors.accent }}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="transition-colors" style={{ color: branding.colors.accent }}>
                  Privacy Policy
                </Link>
              </label>
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
              {loading ? 'Creating account...' : 'Create Account'}
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

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm" style={{ color: branding.colors.text }}>
            Already have an account?{' '}
            <Link
              href="/auth/sign-in"
              className="font-medium transition-colors"
              style={{ color: branding.colors.accent }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}