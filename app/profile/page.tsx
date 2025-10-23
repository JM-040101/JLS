import { requireAuth } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { branding } from '@/branding.config'
import DotGrid from '@/components/backgrounds/DotGrid'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import GradientOrbs from '@/components/dashboard/GradientOrbs'
import { Mail, Calendar, Shield } from 'lucide-react'
import Link from 'next/link'

export default async function ProfilePage() {
  const user = await requireAuth()
  const supabase = createSupabaseServerClient()

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_admin === true || profile?.role === 'admin' || profile?.role === 'superadmin'

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
              Profile
            </h1>
            <p style={{ color: branding.colors.textMuted }}>
              View and manage your account information
            </p>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Profile Card */}
            <div className="col-span-12 lg:col-span-8">
              <div
                className="rounded-3xl p-8"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Avatar Section */}
                <div className="flex items-center space-x-4 mb-8">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                      color: branding.colors.background,
                      boxShadow: `0 0 20px rgba(6, 182, 212, 0.4)`,
                    }}
                  >
                    {(profile?.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-bold"
                      style={{
                        color: branding.colors.textHeading,
                        fontFamily: branding.fonts.heading,
                      }}
                    >
                      {profile?.full_name || 'User'}
                    </h2>
                    {isAdmin && (
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mt-2"
                        style={{
                          background: 'rgba(168, 85, 247, 0.2)',
                          border: '1px solid rgba(168, 85, 247, 0.4)',
                          color: '#a855f7',
                        }}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {profile?.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="space-y-6">
                  {/* Email */}
                  <div className="flex items-start space-x-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                      }}
                    >
                      <Mail className="w-5 h-5" style={{ color: branding.colors.accent }} />
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: branding.colors.textMuted }}
                      >
                        Email Address
                      </p>
                      <p
                        className="text-base"
                        style={{ color: branding.colors.textHeading }}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-start space-x-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                      }}
                    >
                      <Calendar className="w-5 h-5" style={{ color: branding.colors.accent }} />
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: branding.colors.textMuted }}
                      >
                        Member Since
                      </p>
                      <p
                        className="text-base"
                        style={{ color: branding.colors.textHeading }}
                      >
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="flex items-start space-x-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.2)',
                      }}
                    >
                      <Shield className="w-5 h-5" style={{ color: branding.colors.accent }} />
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: branding.colors.textMuted }}
                      >
                        Account Status
                      </p>
                      <p
                        className="text-base font-semibold"
                        style={{
                          color: profile?.subscription_status === 'active' || isAdmin ? '#10b981' : '#f59e0b'
                        }}
                      >
                        {profile?.subscription_status === 'active' || isAdmin ? 'Active Pro' : 'Free Tier'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Link
                    href="/dashboard/settings"
                    className="inline-block px-6 py-3 rounded-xl font-medium transition-all hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                      color: branding.colors.background,
                      boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
                    }}
                  >
                    Edit Profile Settings
                  </Link>
                </div>
              </div>
            </div>

            {/* Admin Panel Card */}
            {isAdmin && (
              <div className="col-span-12 lg:col-span-4">
                <div
                  className="rounded-3xl p-8"
                  style={{
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                  }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="w-6 h-6" style={{ color: '#a855f7' }} />
                    <h3
                      className="text-xl font-bold"
                      style={{ color: '#a855f7' }}
                    >
                      Admin Access
                    </h3>
                  </div>
                  <p
                    className="text-sm mb-6"
                    style={{ color: 'rgba(168, 85, 247, 0.8)' }}
                  >
                    You have administrative privileges on this account.
                  </p>
                  <Link
                    href="/admin"
                    className="block text-center px-6 py-3 rounded-xl font-medium transition-all hover:scale-[1.02]"
                    style={{
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#a855f7',
                    }}
                  >
                    Go to Admin Panel
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </div>
  )
}
