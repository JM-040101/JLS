import { requireAuth } from '@/lib/auth'
import { getUserSessions } from '@/lib/auth'
import { getSubscriptionDetails } from '@/lib/subscription'
import { branding } from '@/branding.config'
import DotGrid from '@/components/backgrounds/DotGrid'
import GradientOrbs from '@/components/dashboard/GradientOrbs'
import DashboardPageClient from '@/components/dashboard/DashboardPageClient'

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

      {/* Dashboard Page Client Component */}
      <DashboardPageClient
        user={user}
        sessions={sessions}
        completedThisWeek={completedThisWeek}
        completionRate={completionRate}
        totalBlueprints={subscriptionDetails?.statistics.totalBlueprints || 0}
      />
    </div>
  )
}
