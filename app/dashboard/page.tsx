import { requireAuth } from '@/lib/auth'
import { getUserSessions } from '@/lib/auth'
import { getSubscriptionDetails } from '@/lib/subscription'
import { branding } from '@/branding.config'
import DotGrid from '@/components/backgrounds/DotGrid'
import Sidebar from '@/components/dashboard/Sidebar'
import GradientOrbs from '@/components/dashboard/GradientOrbs'
import HeroBentoCard from '@/components/dashboard/HeroBentoCard'
import StatsTower from '@/components/dashboard/StatsTower'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'
import BlueprintCard from '@/components/dashboard/BlueprintCard'

export default async function DashboardPage() {
  const user = await requireAuth()
  const sessions = await getUserSessions()
  const subscriptionDetails = await getSubscriptionDetails(user.id)

  const inProgressSessions = sessions.filter(s => s.status === 'in_progress')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  // Calculate stats for hero card
  const completedThisWeek = completedSessions.filter(s => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(s.updated_at) > weekAgo
  }).length

  const completionRate = sessions.length > 0
    ? Math.round((completedSessions.length / sessions.length) * 100)
    : 0

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

      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="relative z-10 ml-[260px]">
        <div className="max-w-[1400px] mx-auto px-12 py-12">
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-8">
            {/* Hero Bento Card - 8 columns */}
            <div className="col-span-12 lg:col-span-8">
              <HeroBentoCard
                userName={user.full_name || 'Builder'}
                totalBlueprints={subscriptionDetails?.statistics.totalBlueprints || 0}
                completedThisWeek={completedThisWeek}
                completionRate={completionRate}
              />
            </div>

            {/* Stats Tower - 4 columns */}
            <div className="col-span-12 lg:col-span-4">
              <StatsTower
                totalBlueprints={subscriptionDetails?.statistics.totalBlueprints || 0}
                inProgress={inProgressSessions.length}
                completed={completedSessions.length}
                memberSince={subscriptionDetails?.memberSince || 'N/A'}
              />
            </div>

            {/* Quick Actions - 6 columns */}
            <div className="col-span-12 md:col-span-6">
              <QuickActions />
            </div>

            {/* Recent Activity - 6 columns */}
            <div className="col-span-12 md:col-span-6">
              <RecentActivity />
            </div>

            {/* Your Blueprints Header */}
            <div className="col-span-12">
              <h2
                className="text-2xl font-bold mb-0"
                style={{
                  color: branding.colors.textHeading,
                  fontFamily: branding.fonts.heading,
                }}
              >
                Your Blueprints
              </h2>
            </div>

            {/* Blueprint Cards - Bento Grid */}
            {sessions.length === 0 ? (
              <div className="col-span-12">
                <div
                  className="rounded-3xl p-16 text-center"
                  style={{
                    background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))`,
                    backdropFilter: 'blur(24px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(150%)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="max-w-md mx-auto">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                      style={{
                        background: `${branding.colors.accent}20`,
                      }}
                    >
                      <svg
                        className="w-10 h-10"
                        style={{ color: branding.colors.accent }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-3" style={{ color: branding.colors.textHeading }}>
                      No blueprints yet
                    </h3>
                    <p className="text-base mb-6" style={{ color: branding.colors.textMuted }}>
                      Start your first SaaS blueprint and transform your idea into reality
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {sessions.map((session, index) => (
                  <BlueprintCard
                    key={session.id}
                    id={session.id}
                    title={session.app_description}
                    status={session.status as 'in_progress' | 'completed' | 'archived'}
                    completedPhases={session.completed_phases}
                    createdAt={session.created_at}
                    isWide={index === 0 || index % 3 === 0}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
