'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Lock, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { branding } from '@/branding.config'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
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
              background: `${branding.colors.success}20`,
            }}>
              <CheckCircle className="w-8 h-8" style={{ color: branding.colors.success }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: branding.colors.textHeading }}>
              Password Reset Successful
            </h1>
            <p className="mb-6" style={{ color: branding.colors.text }}>
              Your password has been updated successfully. Redirecting to dashboard...
            </p>
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
          <div className="mb-8">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center text-sm mb-4 transition-colors"
              style={{ color: branding.colors.accent }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Link>
            <h1 className="text-2xl font-bold mb-2" style={{ color: branding.colors.textHeading }}>
              Create New Password
            </h1>
            <p style={{ color: branding.colors.text }}>
              Enter your new password below.
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

          {/* Reset Form */}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: branding.colors.text }}>
                New Password
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
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1" style={{ color: branding.colors.text }}>
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: branding.colors.textMuted }} />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors"
                  style={{
                    background: branding.colors.background,
                    borderColor: branding.colors.divider,
                    color: branding.colors.text
                  }}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: branding.colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: branding.colors.accent }}></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
