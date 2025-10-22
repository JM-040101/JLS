import { requireAuth } from '@/lib/auth'
import { getSubscriptionDetails } from '@/lib/subscription'
import { branding } from '@/branding.config'
import DotGrid from '@/components/backgrounds/DotGrid'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import GradientOrbs from '@/components/dashboard/GradientOrbs'
import SettingsClient from './SettingsClient'

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
        <SettingsClient user={user} subscriptionDetails={subscriptionDetails} />
      </DashboardLayout>
    </div>
  )
}
