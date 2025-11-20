'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { branding } from '@/branding.config'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
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
              Check Your Email
            </h1>
            <p className="mb-6" style={{ color: branding.colors.text }}>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm mb-6" style={{ color: branding.colors.textMuted }}>
              If you don't see the email, check your spam folder.
            </p>
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center text-sm transition-colors"
              style={{ color: branding.colors.accent }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
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
              Reset Your Password
            </h1>
            <p style={{ color: branding.colors.text }}>
              Enter your email address and we'll send you a link to reset your password.
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
