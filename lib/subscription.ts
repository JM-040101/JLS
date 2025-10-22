import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { AuthUser } from '@/lib/auth'

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due'

export interface SubscriptionCheck {
  hasAccess: boolean
  status: SubscriptionStatus
  message?: string
  gracePeriodEnds?: string
}

/**
 * Check if user has access to premium features
 */
export async function checkSubscriptionAccess(userId: string): Promise<SubscriptionCheck> {
  const supabase = createSupabaseServerClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_id, updated_at, role, is_admin')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return {
      hasAccess: false,
      status: 'inactive',
      message: 'No subscription found'
    }
  }

  // Admin users have unlimited access to all features
  if (profile.is_admin === true || profile.role === 'admin' || profile.role === 'superadmin') {
    return {
      hasAccess: true,
      status: 'active'
    }
  }

  // Active subscription - full access
  if (profile.subscription_status === 'active') {
    return {
      hasAccess: true,
      status: 'active'
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
      message: inGracePeriod 
        ? `Payment failed. Please update your payment method by ${gracePeriodEnd.toLocaleDateString()}`
        : 'Grace period expired. Please update your payment method to regain access',
      gracePeriodEnds: gracePeriodEnd.toISOString()
    }
  }

  // Cancelled or inactive
  return {
    hasAccess: false,
    status: profile.subscription_status as SubscriptionStatus,
    message: profile.subscription_status === 'cancelled' 
      ? 'Your subscription has been cancelled'
      : 'Please subscribe to access premium features'
  }
}

/**
 * Validate user can create new workflow sessions
 */
export async function canCreateSession(userId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const subscriptionCheck = await checkSubscriptionAccess(userId)

  if (!subscriptionCheck.hasAccess) {
    return {
      allowed: false,
      reason: subscriptionCheck.message || 'Active subscription required'
    }
  }

  // Check if user is admin - admins have unlimited sessions
  const supabase = createSupabaseServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_admin')
    .eq('id', userId)
    .single()

  const isAdmin = profile?.is_admin === true || profile?.role === 'admin' || profile?.role === 'superadmin'

  // Admins bypass session limits
  if (isAdmin) {
    return { allowed: true }
  }

  // Check session limits for non-admin users
  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'in_progress')

  // Limit in-progress sessions (e.g., max 3 concurrent)
  const maxConcurrentSessions = 3
  if (count && count >= maxConcurrentSessions) {
    return {
      allowed: false,
      reason: `You have reached the maximum of ${maxConcurrentSessions} active blueprints. Please complete or archive existing blueprints first.`
    }
  }

  return { allowed: true }
}

/**
 * Get subscription details for display
 */
export async function getSubscriptionDetails(userId: string) {
  const supabase = createSupabaseServerClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_id, created_at, updated_at, is_admin, role')
    .eq('id', userId)
    .single()

  if (!profile) {
    return null
  }

  // Determine plan based on subscription status and admin role
  const isAdmin = profile.is_admin === true || profile.role === 'admin' || profile.role === 'superadmin'
  const plan = isAdmin ? 'Admin' : (profile.subscription_status === 'active' ? 'Pro' : 'Free')

  // Calculate usage statistics
  const { count: totalSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: completedSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')

  // Get exports count
  const { count: exportsCount } = await supabase
    .from('exports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Calculate API calls this month (using sessions as proxy)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: apiCallsThisMonth } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })

  return {
    plan,
    status: profile.subscription_status,
    subscriptionId: profile.subscription_id,
    memberSince,
    nextBillingDate: null, // TODO: Add when Stripe integration is complete
    statistics: {
      totalBlueprints: totalSessions || 0,
      completedBlueprints: completedSessions || 0,
      inProgressBlueprints: (totalSessions || 0) - (completedSessions || 0),
      apiCallsThisMonth: apiCallsThisMonth || 0,
      exportsGenerated: exportsCount || 0
    }
  }
}

/**
 * Update subscription status (called from webhook)
 */
export async function updateSubscriptionStatus(
  customerId: string,
  status: SubscriptionStatus,
  subscriptionId?: string
) {
  const supabase = createSupabaseServerClient()
  
  // Find user by stripe customer ID (you might need to add this field to profiles)
  // For now, we'll update by subscription_id
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: status,
      subscription_id: subscriptionId,
      updated_at: new Date().toISOString()
    })
    .eq('subscription_id', customerId)

  if (error) {
    console.error('Failed to update subscription status:', error)
    throw error
  }

  return true
}