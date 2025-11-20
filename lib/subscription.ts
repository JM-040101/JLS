import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { AuthUser } from '@/lib/auth'
import {
  type SubscriptionTier,
  getTierConfig,
  getTierProjectLimit,
  getTierExportLimit,
  tierHasFeature
} from '@/lib/pricing.config'

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due'

export interface SubscriptionCheck {
  hasAccess: boolean
  status: SubscriptionStatus
  tier: SubscriptionTier
  message?: string
  gracePeriodEnds?: string
}

export interface UserSubscription {
  tier: SubscriptionTier
  status: SubscriptionStatus
  projectLimit: number
  exportLimit: number
  features: Record<string, boolean>
  isAdmin: boolean
}

/**
 * Get user's subscription info including tier and features
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = createSupabaseServerClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status, active_projects_limit, features_enabled, role, is_admin')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return null
  }

  const tier = (profile.subscription_tier || 'free') as SubscriptionTier
  const isAdmin = profile.is_admin === true || profile.role === 'admin' || profile.role === 'superadmin'

  // Admins get enterprise-level access
  if (isAdmin) {
    return {
      tier: 'enterprise',
      status: 'active',
      projectLimit: 999999,
      exportLimit: 999999,
      features: {
        advancedPrompts: true,
        codeExamples: true,
        prioritySupport: true,
        unlimitedExports: true,
        apiAccess: true,
        teamCollaboration: true,
        whiteLabel: true,
        dedicatedSupport: true,
        customIntegrations: true,
        sla: true,
      },
      isAdmin: true,
    }
  }

  return {
    tier,
    status: profile.subscription_status as SubscriptionStatus,
    projectLimit: profile.active_projects_limit || getTierProjectLimit(tier),
    exportLimit: getTierExportLimit(tier),
    features: profile.features_enabled || {},
    isAdmin: false,
  }
}

/**
 * Check if user has access to premium features
 */
export async function checkSubscriptionAccess(userId: string): Promise<SubscriptionCheck> {
  const supabase = createSupabaseServerClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_tier, subscription_id, updated_at, role, is_admin')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return {
      hasAccess: false,
      status: 'inactive',
      tier: 'free',
      message: 'No subscription found'
    }
  }

  const tier = (profile.subscription_tier || 'free') as SubscriptionTier

  // Admin users have unlimited access to all features
  if (profile.is_admin === true || profile.role === 'admin' || profile.role === 'superadmin') {
    return {
      hasAccess: true,
      status: 'active',
      tier: 'enterprise'
    }
  }

  // Free tier - limited access
  if (tier === 'free') {
    return {
      hasAccess: true,
      status: 'inactive',
      tier: 'free',
      message: 'Free tier - upgrade for more features'
    }
  }

  // Active subscription - full access based on tier
  if (profile.subscription_status === 'active') {
    return {
      hasAccess: true,
      status: 'active',
      tier
    }
  }

  // Past due - check grace period (3 days)
  if (profile.subscription_status === 'past_due') {
    const gracePeriodEnd = new Date(profile.updated_at)
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3)

    const now = new Date()
    const inGracePeriod = now < gracePeriodEnd

    return {
      hasAccess: inGracePeriod,
      status: 'past_due',
      tier,
      message: inGracePeriod
        ? `Payment failed. Please update your payment method by ${gracePeriodEnd.toLocaleDateString()}`
        : 'Grace period expired. Please update your payment method to regain access',
      gracePeriodEnds: gracePeriodEnd.toISOString()
    }
  }

  // Cancelled or inactive - downgrade to free
  return {
    hasAccess: true,
    status: profile.subscription_status as SubscriptionStatus,
    tier: 'free',
    message: profile.subscription_status === 'cancelled'
      ? 'Your subscription has been cancelled. You now have free tier access.'
      : 'Free tier access'
  }
}

/**
 * Validate user can create new workflow sessions based on tier limits
 */
export async function canCreateSession(userId: string): Promise<{
  allowed: boolean
  reason?: string
  currentCount?: number
  limit?: number
}> {
  const subscription = await getUserSubscription(userId)

  if (!subscription) {
    return {
      allowed: false,
      reason: 'No subscription found'
    }
  }

  // Admins bypass session limits
  if (subscription.isAdmin) {
    return { allowed: true }
  }

  // Check current active projects
  const supabase = createSupabaseServerClient()
  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'in_progress')

  const currentCount = count || 0
  const limit = subscription.projectLimit

  if (currentCount >= limit) {
    const tierConfig = getTierConfig(subscription.tier)
    return {
      allowed: false,
      reason: `You have reached your ${tierConfig.displayName} tier limit of ${limit} active project${limit === 1 ? '' : 's'}. Upgrade your plan or complete existing projects to create more.`,
      currentCount,
      limit
    }
  }

  return {
    allowed: true,
    currentCount,
    limit
  }
}

/**
 * Check if user can export based on tier limits
 */
export async function canExport(userId: string): Promise<{
  allowed: boolean
  reason?: string
  currentCount?: number
  limit?: number
}> {
  const subscription = await getUserSubscription(userId)

  if (!subscription) {
    return {
      allowed: false,
      reason: 'No subscription found'
    }
  }

  // Admins and unlimited tiers bypass export limits
  if (subscription.isAdmin || subscription.exportLimit >= 999999) {
    return { allowed: true }
  }

  // Check exports this month
  const supabase = createSupabaseServerClient()
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('exports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const currentCount = count || 0
  const limit = subscription.exportLimit

  if (currentCount >= limit) {
    const tierConfig = getTierConfig(subscription.tier)
    return {
      allowed: false,
      reason: `You have reached your ${tierConfig.displayName} tier limit of ${limit} export${limit === 1 ? '' : 's'} this month. Upgrade to get unlimited exports.`,
      currentCount,
      limit
    }
  }

  return {
    allowed: true,
    currentCount,
    limit
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeature(userId: string, featureName: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId)

  if (!subscription) {
    return false
  }

  // Admins have all features
  if (subscription.isAdmin) {
    return true
  }

  return subscription.features[featureName] === true
}

/**
 * Get subscription details for display
 */
export async function getSubscriptionDetails(userId: string) {
  const supabase = createSupabaseServerClient()
  const subscription = await getUserSubscription(userId)

  if (!subscription) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_id, subscription_tier, created_at, updated_at, is_admin, role')
    .eq('id', userId)
    .single()

  if (!profile) {
    return null
  }

  const tierConfig = getTierConfig(subscription.tier)

  // Calculate usage statistics
  const { count: totalSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: activeSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'in_progress')

  const { count: completedSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')

  // Get exports count this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: exportsThisMonth } = await supabase
    .from('exports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const { count: exportsTotal } = await supabase
    .from('exports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  return {
    tier: subscription.tier,
    tierDisplayName: tierConfig.displayName,
    status: profile.subscription_status,
    subscriptionId: profile.subscription_id,
    memberSince,
    nextBillingDate: null, // TODO: Add when Stripe integration is complete
    limits: {
      activeProjects: subscription.projectLimit,
      exportsPerMonth: subscription.exportLimit,
    },
    usage: {
      activeProjects: activeSessions || 0,
      exportsThisMonth: exportsThisMonth || 0,
    },
    statistics: {
      totalBlueprints: totalSessions || 0,
      completedBlueprints: completedSessions || 0,
      inProgressBlueprints: activeSessions || 0,
      exportsGenerated: exportsTotal || 0
    },
    features: subscription.features
  }
}

/**
 * Update subscription status and tier (called from webhook)
 */
export async function updateSubscriptionStatus(
  customerId: string,
  status: SubscriptionStatus,
  subscriptionId?: string,
  priceId?: string
) {
  const supabase = createSupabaseServerClient()

  // Determine tier from price ID if provided
  const tier = priceId ? getTierFromPriceId(priceId) : null

  const updateData: any = {
    subscription_status: status,
    subscription_id: subscriptionId,
    updated_at: new Date().toISOString()
  }

  // Update tier if we have a valid price ID mapping
  if (tier) {
    updateData.subscription_tier = tier
    updateData.stripe_price_id = priceId

    // Track tier changes
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('stripe_customer_id', customerId)
      .single()

    if (currentProfile && currentProfile.subscription_tier !== tier) {
      updateData.previous_tier = currentProfile.subscription_tier
      const tierOrder: SubscriptionTier[] = ['free', 'essentials', 'premium', 'pro_studio', 'enterprise']
      const isUpgrade = tierOrder.indexOf(tier) > tierOrder.indexOf(currentProfile.subscription_tier)
      if (isUpgrade) {
        updateData.tier_upgraded_at = new Date().toISOString()
      } else {
        updateData.tier_downgraded_at = new Date().toISOString()
      }
    }
  }

  // Handle cancellation - downgrade to free tier
  if (status === 'cancelled' || status === 'inactive') {
    updateData.subscription_tier = 'free'
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Failed to update subscription status:', error)
    throw error
  }

  return true
}

/**
 * Get tier from Stripe Price ID
 */
function getTierFromPriceId(priceId: string): SubscriptionTier | null {
  // Import at function level to avoid circular dependency issues
  const { getTierFromPriceId: getTier } = require('@/lib/pricing.config')
  return getTier(priceId)
}