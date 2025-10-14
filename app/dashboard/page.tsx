import { requireAuth } from '@/lib/auth'
import { getUserSessions } from '@/lib/auth'
import { getSubscriptionDetails, checkSubscriptionAccess } from '@/lib/subscription'
import Link from 'next/link'
import { Plus, FileText, Clock, CheckCircle, Archive, TrendingUp } from 'lucide-react'
import UserMenu from '@/components/auth/user-menu'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { branding } from '@/branding.config'
import DotGrid from '@/components/backgrounds/DotGrid'

export default async function DashboardPage() {
  const user = await requireAuth()
  const sessions = await getUserSessions()
  const subscriptionDetails = await getSubscriptionDetails(user.id)

  const inProgressSessions = sessions.filter(s => s.status === 'in_progress')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  // Check if user has Pro access (subscription or admin)
  const subscriptionCheck = await checkSubscriptionAccess(user.id)
  const hasProAccess = subscriptionCheck.hasAccess

  // Check if user is admin to show special message
  const supabase = createSupabaseServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_admin, subscription_status')
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

      {/* Content Layer */}
      <div className="relative z-10">
      {/* Header */}
      <header
        className="border-b"
        style={{
          backgroundColor: branding.colors.primary,
          borderColor: branding.colors.divider
        }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: branding.colors.accent }}
            >
              <FileText className="w-5 h-5" style={{ color: branding.colors.background }} />
            </div>
            <span
              className="text-xl font-bold"
              style={{
                color: branding.colors.textHeading,
                fontFamily: branding.fonts.heading
              }}
            >
              SaaS Blueprint
            </span>
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              color: branding.colors.textHeading,
              fontFamily: branding.fonts.heading
            }}
          >
            Welcome back, {user.full_name || 'Builder'}!
          </h1>
          <p style={{ color: branding.colors.text }}>
            Manage your SaaS blueprints and continue building your next big idea.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div
            className="rounded-lg border p-4 transition-all hover:shadow-lg"
            style={{
              backgroundColor: branding.colors.surface,
              borderColor: branding.colors.divider
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                  Total Blueprints
                </p>
                <p className="text-2xl font-bold" style={{ color: branding.colors.textHeading }}>
                  {subscriptionDetails?.statistics.totalBlueprints || 0}
                </p>
              </div>
              <FileText className="w-8 h-8" style={{ color: branding.colors.accent }} />
            </div>
          </div>

          <div
            className="rounded-lg border p-4 transition-all hover:shadow-lg"
            style={{
              backgroundColor: branding.colors.surface,
              borderColor: branding.colors.divider
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                  In Progress
                </p>
                <p className="text-2xl font-bold" style={{ color: branding.colors.textHeading }}>
                  {inProgressSessions.length}
                </p>
              </div>
              <Clock className="w-8 h-8" style={{ color: branding.colors.warning }} />
            </div>
          </div>

          <div
            className="rounded-lg border p-4 transition-all hover:shadow-lg"
            style={{
              backgroundColor: branding.colors.surface,
              borderColor: branding.colors.divider
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                  Completed
                </p>
                <p className="text-2xl font-bold" style={{ color: branding.colors.textHeading }}>
                  {completedSessions.length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8" style={{ color: branding.colors.success }} />
            </div>
          </div>

          <div
            className="rounded-lg border p-4 transition-all hover:shadow-lg"
            style={{
              backgroundColor: branding.colors.surface,
              borderColor: branding.colors.divider
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                  Member Since
                </p>
                <p className="text-lg font-bold" style={{ color: branding.colors.textHeading }}>
                  {subscriptionDetails?.memberSince || 'N/A'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8" style={{ color: branding.colors.info }} />
            </div>
          </div>
        </div>

        {/* Action Button */}
        {hasProAccess ? (
          <div className="mb-8">
            <Link
              href="/workflow/new"
              className="inline-flex items-center text-lg px-6 py-3 rounded-lg font-medium transition-all"
              style={{
                background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                color: branding.colors.background,
                boxShadow: `0 0 20px ${branding.colors.accentGlow}`
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Blueprint
            </Link>
            {isAdmin && profile?.subscription_status !== 'active' && (
              <p className="text-sm mt-2" style={{ color: branding.colors.textMuted }}>
                ✨ Admin access - unlimited blueprints
              </p>
            )}
          </div>
        ) : (
          <div
            className="mb-8 p-4 border rounded-lg"
            style={{
              backgroundColor: `${branding.colors.warning}22`,
              borderColor: branding.colors.warning
            }}
          >
            <p className="mb-2" style={{ color: branding.colors.text }}>
              Upgrade to Pro to create unlimited blueprints
            </p>
            <Link
              href="/pricing"
              className="inline-block px-4 py-2 rounded-lg font-medium transition-all"
              style={{
                background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                color: branding.colors.background,
                boxShadow: `0 0 20px ${branding.colors.accentGlow}`
              }}
            >
              View Plans
            </Link>
          </div>
        )}

        {/* Sessions List */}
        <div>
          <h2
            className="text-xl font-bold mb-4"
            style={{
              color: branding.colors.textHeading,
              fontFamily: branding.fonts.heading
            }}
          >
            Your Blueprints
          </h2>

          {sessions.length === 0 ? (
            <div
              className="rounded-lg border p-12 text-center"
              style={{
                backgroundColor: branding.colors.surface,
                borderColor: branding.colors.divider
              }}
            >
              <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: branding.colors.textMuted }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: branding.colors.textHeading }}>
                No blueprints yet
              </h3>
              <p className="mb-4" style={{ color: branding.colors.text }}>
                Start your first SaaS blueprint and transform your idea into reality
              </p>
              {hasProAccess && (
                <Link
                  href="/workflow/new"
                  className="inline-block px-4 py-2 rounded-lg font-medium transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                    color: branding.colors.background,
                    boxShadow: `0 0 20px ${branding.colors.accentGlow}`
                  }}
                >
                  Create Your First Blueprint
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border p-6 hover:shadow-lg transition-all"
                  style={{
                    backgroundColor: branding.colors.surface,
                    borderColor: branding.colors.divider
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1" style={{ color: branding.colors.textHeading }}>
                        {session.app_description}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm" style={{ color: branding.colors.textMuted }}>
                        <span className="flex items-center">
                          {session.status === 'in_progress' && (
                            <>
                              <Clock className="w-4 h-4 mr-1" style={{ color: branding.colors.warning }} />
                              In Progress
                            </>
                          )}
                          {session.status === 'completed' && (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" style={{ color: branding.colors.success }} />
                              Completed
                            </>
                          )}
                          {session.status === 'archived' && (
                            <>
                              <Archive className="w-4 h-4 mr-1" style={{ color: branding.colors.textMuted }} />
                              Archived
                            </>
                          )}
                        </span>
                        <span>
                          Phase {session.completed_phases}/12
                        </span>
                        <span>
                          Created {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {session.status === 'in_progress' && (
                        <Link
                          href={`/workflow/${session.id}`}
                          className="text-sm px-4 py-2 rounded-lg font-medium transition-all"
                          style={{
                            background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                            color: branding.colors.background
                          }}
                        >
                          Continue
                        </Link>
                      )}
                      {session.status === 'completed' && (
                        <Link
                          href={`/preview-plan/${session.id}`}
                          className="text-sm px-4 py-2 rounded-lg font-medium transition-all border"
                          style={{
                            backgroundColor: branding.colors.secondary,
                            color: branding.colors.text,
                            borderColor: branding.colors.divider
                          }}
                        >
                          View Plan
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: branding.colors.primary }}
                    >
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(session.completed_phases / 12) * 100}%`,
                          background: `linear-gradient(90deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                          boxShadow: `0 0 10px ${branding.colors.accentGlow}`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}