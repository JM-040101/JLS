import { requireAuth } from '@/lib/auth'
import { getSubscriptionDetails } from '@/lib/subscription'
import { branding } from '@/branding.config'
import DotGrid from '@/components/backgrounds/DotGrid'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import GradientOrbs from '@/components/dashboard/GradientOrbs'

export default async function SettingsPage() {
  const user = await requireAuth()
  const subscriptionDetails = await getSubscriptionDetails(user.id)

  return (
    <div className="min-h-screen relative" style={{ background: branding.colors.background }}>
      {/* Dot Grid Background */}
      <div className="fixed inset-0 z-0">
        <DotGrid
          dotSize={3}
          gap={25}
          baseColor={branding.colors.divider}
          activeColor={branding.colors.accent}
          proximity={120}
          shockRadius={200}
          shockStrength={3}
        />
      </div>

      {/* Gradient Orbs */}
      <GradientOrbs />

      {/* Dashboard Layout */}
      <DashboardLayout user={user}>
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

                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: branding.colors.textMuted }}
                    >
                      Full Name
                    </label>
                    <div
                      className="px-4 py-3 rounded-xl"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: branding.colors.textHeading,
                      }}
                    >
                      {user.full_name || 'Not set'}
                    </div>
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

                  {subscriptionDetails?.nextBillingDate && (
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: branding.colors.textMuted }}
                      >
                        Next Billing Date
                      </label>
                      <div
                        className="px-4 py-3 rounded-xl"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: branding.colors.textHeading,
                        }}
                      >
                        {new Date(subscriptionDetails.nextBillingDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
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
      </DashboardLayout>
    </div>
  )
}
