'use client'

import { useState, useTransition } from 'react'
import { branding } from '@/branding.config'
import { updateUserName, updatePassword } from './actions'
import type { AuthUser } from '@/lib/auth'

interface SettingsClientProps {
  user: AuthUser
  subscriptionDetails: any
}

export default function SettingsClient({ user, subscriptionDetails }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [isEditingName, setIsEditingName] = useState(false)
  const [fullName, setFullName] = useState(user.full_name || '')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleNameSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateUserName(formData)
      if (result.success) {
        setMessage({ type: 'success', text: 'Name updated successfully' })
        setIsEditingName(false)
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update name' })
      }
    })
  }

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordMessage(null)

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updatePassword(formData)
      if (result.success) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully' })
        setShowPasswordChange(false)
        e.currentTarget.reset()
        setTimeout(() => setPasswordMessage(null), 3000)
      } else {
        setPasswordMessage({ type: 'error', text: result.error || 'Failed to update password' })
      }
    })
  }

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{
            color: branding.colors.textHeading,
            fontFamily: branding.fonts.heading,
          }}
        >
          Settings
        </h1>
        <p style={{ color: branding.colors.textMuted }}>
          Manage your account and subscription preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Account Information */}
        <div className="col-span-12 lg:col-span-6">
          <div
            className="rounded-3xl p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h2
              className="text-2xl font-bold mb-6"
              style={{
                color: branding.colors.textHeading,
                fontFamily: branding.fonts.heading,
              }}
            >
              Account Information
            </h2>

            {message && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: message.type === 'success'
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  border: message.type === 'success'
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(239, 68, 68, 0.3)',
                  color: message.type === 'success' ? '#10b981' : '#ef4444',
                }}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: branding.colors.textMuted }}
                >
                  Full Name
                </label>
                {isEditingName ? (
                  <form onSubmit={handleNameSubmit} className="space-y-2">
                    <input
                      type="text"
                      name="full_name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isPending}
                      className="w-full px-4 py-3 rounded-xl"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: branding.colors.textHeading,
                        outline: 'none',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = `1px solid ${branding.colors.accent}`;
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                          color: branding.colors.background,
                        }}
                      >
                        {isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingName(false)
                          setFullName(user.full_name || '')
                          setMessage(null)
                        }}
                        disabled={isPending}
                        className="px-4 py-2 rounded-xl text-sm font-medium"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: branding.colors.textMuted,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 px-4 py-3 rounded-xl"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: branding.colors.textHeading,
                      }}
                    >
                      {user.full_name || 'Not set'}
                    </div>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="ml-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: branding.colors.accent,
                      }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: branding.colors.textMuted }}
                >
                  Email
                </label>
                <div
                  className="px-4 py-3 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: branding.colors.textHeading,
                  }}
                >
                  {user.email}
                </div>
              </div>

              {/* Password Change Section */}
              <div className="pt-4">
                {!showPasswordChange ? (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: branding.colors.accent,
                    }}
                  >
                    Change Password
                  </button>
                ) : (
                  <div className="space-y-4">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: branding.colors.textHeading }}
                    >
                      Change Password
                    </h3>

                    {passwordMessage && (
                      <div
                        className="px-4 py-3 rounded-xl text-sm"
                        style={{
                          background: passwordMessage.type === 'success'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                          border: passwordMessage.type === 'success'
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : '1px solid rgba(239, 68, 68, 0.3)',
                          color: passwordMessage.type === 'success' ? '#10b981' : '#ef4444',
                        }}
                      >
                        {passwordMessage.text}
                      </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-3">
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: branding.colors.textMuted }}
                        >
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="current_password"
                          required
                          disabled={isPending}
                          className="w-full px-4 py-3 rounded-xl"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: branding.colors.textHeading,
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: branding.colors.textMuted }}
                        >
                          New Password
                        </label>
                        <input
                          type="password"
                          name="new_password"
                          required
                          disabled={isPending}
                          className="w-full px-4 py-3 rounded-xl"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: branding.colors.textHeading,
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: branding.colors.textMuted }}
                        >
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirm_password"
                          required
                          disabled={isPending}
                          className="w-full px-4 py-3 rounded-xl"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: branding.colors.textHeading,
                            outline: 'none',
                          }}
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={isPending}
                          className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                          style={{
                            background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                            color: branding.colors.background,
                          }}
                        >
                          {isPending ? 'Updating...' : 'Update Password'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordChange(false)
                            setPasswordMessage(null)
                          }}
                          disabled={isPending}
                          className="px-4 py-2 rounded-xl text-sm font-medium"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: branding.colors.textMuted,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="col-span-12 lg:col-span-6">
          <div
            className="rounded-3xl p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h2
              className="text-2xl font-bold mb-6"
              style={{
                color: branding.colors.textHeading,
                fontFamily: branding.fonts.heading,
              }}
            >
              Subscription
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: branding.colors.textMuted }}
                >
                  Plan
                </label>
                <div
                  className="px-4 py-3 rounded-xl flex items-center justify-between"
                  style={{
                    background: `linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(20, 184, 166, 0.1))`,
                    border: `1px solid ${branding.colors.accent}40`,
                    color: branding.colors.textHeading,
                  }}
                >
                  <span className="font-semibold">
                    {subscriptionDetails?.plan || 'Free'}
                  </span>
                  {subscriptionDetails?.plan === 'Pro' && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                        color: branding.colors.background,
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: branding.colors.textMuted }}
                >
                  Status
                </label>
                <div
                  className="px-4 py-3 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: branding.colors.textHeading,
                  }}
                >
                  {subscriptionDetails?.status || 'Active'}
                </div>
              </div>

              {subscriptionDetails?.memberSince && (
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: branding.colors.textMuted }}
                  >
                    Member Since
                  </label>
                  <div
                    className="px-4 py-3 rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: branding.colors.textHeading,
                    }}
                  >
                    {subscriptionDetails.memberSince}
                  </div>
                </div>
              )}

              {/* Manage Subscription Button */}
              <div className="pt-4">
                {subscriptionDetails?.plan === 'Free' ? (
                  <a
                    href="/pricing"
                    className="block w-full px-6 py-3 rounded-xl text-center font-medium transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                      color: branding.colors.background,
                    }}
                  >
                    Upgrade to Pro
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      // TODO: Implement Stripe customer portal redirect
                      alert('Stripe customer portal integration coming soon')
                    }}
                    className="w-full px-6 py-3 rounded-xl font-medium transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: branding.colors.accent,
                    }}
                  >
                    Manage Subscription
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="col-span-12">
          <div
            className="rounded-3xl p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h2
              className="text-2xl font-bold mb-6"
              style={{
                color: branding.colors.textHeading,
                fontFamily: branding.fonts.heading,
              }}
            >
              Usage Statistics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div
                  className="text-4xl font-bold mb-2"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {subscriptionDetails?.statistics.totalBlueprints || 0}
                </div>
                <div style={{ color: branding.colors.textMuted }}>
                  Total Blueprints
                </div>
              </div>

              <div className="text-center">
                <div
                  className="text-4xl font-bold mb-2"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {subscriptionDetails?.statistics.apiCallsThisMonth || 0}
                </div>
                <div style={{ color: branding.colors.textMuted }}>
                  API Calls This Month
                </div>
              </div>

              <div className="text-center">
                <div
                  className="text-4xl font-bold mb-2"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {subscriptionDetails?.statistics.exportsGenerated || 0}
                </div>
                <div style={{ color: branding.colors.textMuted }}>
                  Exports Generated
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
