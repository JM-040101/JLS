// Subscription Management Utilities

import { stripe, SUBSCRIPTION_STATUS, GRACE_PERIOD_DAYS } from './config'
import { createSupabaseServerClient } from '../supabase-server'
import type { SubscriptionStatus } from './config'
import { getTierFromPriceId } from '@/lib/pricing.config'
import type { SubscriptionTier } from '@/lib/pricing.config'

export interface Subscription {
  id: string
  userId: string
  customerId: string
  subscriptionId: string
  priceId: string
  status: SubscriptionStatus
  tier?: SubscriptionTier
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAt?: Date
  canceledAt?: Date
  trialEnd?: Date
  metadata?: Record<string, any>
}

export class SubscriptionManager {
  // Create or update subscription record
  async upsertSubscription(data: {
    userId: string
    customerId: string
    subscriptionId: string
    priceId: string
    status: SubscriptionStatus
    currentPeriodStart: Date
    currentPeriodEnd: Date
    cancelAt?: Date
    canceledAt?: Date
    trialEnd?: Date
  }): Promise<Subscription> {
    const supabase = createSupabaseServerClient()

    // Determine tier from price ID
    const tier = getTierFromPriceId(data.priceId)

    // Update subscription record in subscriptions table
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: data.userId,
        stripe_customer_id: data.customerId,
        stripe_subscription_id: data.subscriptionId,
        stripe_price_id: data.priceId,
        status: data.status,
        current_period_start: data.currentPeriodStart.toISOString(),
        current_period_end: data.currentPeriodEnd.toISOString(),
        cancel_at: data.cancelAt?.toISOString(),
        canceled_at: data.canceledAt?.toISOString(),
        trial_end: data.trialEnd?.toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to upsert subscription: ${error.message}`)
    }

    // Update profiles table with tier info
    await this.updateProfileTier(data.userId, data.customerId, data.priceId, tier, data.status)

    return this.formatSubscription(subscription)
  }

  // Update profile with tier information
  private async updateProfileTier(
    userId: string,
    customerId: string,
    priceId: string,
    tier: SubscriptionTier | null,
    status: SubscriptionStatus
  ): Promise<void> {
    const supabase = createSupabaseServerClient()

    const updateData: any = {
      stripe_customer_id: customerId,
      stripe_price_id: priceId,
      subscription_status: status,
      updated_at: new Date().toISOString()
    }

    // Set tier if we have one
    if (tier) {
      updateData.subscription_tier = tier

      // Track tier changes
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
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

    // Handle cancellation - downgrade to free
    if (status === 'canceled' || status === 'incomplete_expired') {
      updateData.subscription_tier = 'free'
    }

    await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
  }

  // Get subscription by user ID
  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    const supabase = createSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return this.formatSubscription(data)
  }

  // Get subscription by Stripe customer ID
  async getSubscriptionByCustomerId(customerId: string): Promise<Subscription | null> {
    const supabase = createSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single()

    if (error || !data) {
      return null
    }

    return this.formatSubscription(data)
  }

  // Check if subscription is active (including grace period)
  async isSubscriptionActive(userId: string): Promise<boolean> {
    const subscription = await this.getSubscriptionByUserId(userId)
    
    if (!subscription) {
      return false
    }

    // Check for active statuses
    if ([SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIALING].includes(subscription.status as any)) {
      return true
    }

    // Check for grace period on past_due
    if (subscription.status === SUBSCRIPTION_STATUS.PAST_DUE) {
      const gracePeriodEnd = new Date(subscription.currentPeriodEnd)
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS)
      return new Date() < gracePeriodEnd
    }

    return false
  }

  // Cancel subscription at period end
  async cancelSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.getSubscriptionByUserId(userId)
    
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    // Cancel in Stripe
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.subscriptionId,
      {
        cancel_at_period_end: true
      }
    )

    // Update local record
    return this.upsertSubscription({
      userId,
      customerId: subscription.customerId,
      subscriptionId: subscription.subscriptionId,
      priceId: subscription.priceId,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAt: stripeSubscription.cancel_at ? new Date(stripeSubscription.cancel_at * 1000) : undefined,
      canceledAt: new Date()
    })
  }

  // Reactivate cancelled subscription
  async reactivateSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.getSubscriptionByUserId(userId)
    
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    // Reactivate in Stripe
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.subscriptionId,
      {
        cancel_at_period_end: false
      }
    )

    // Update local record
    return this.upsertSubscription({
      userId,
      customerId: subscription.customerId,
      subscriptionId: subscription.subscriptionId,
      priceId: subscription.priceId,
      status: stripeSubscription.status as SubscriptionStatus,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAt: undefined,
      canceledAt: undefined
    })
  }

  // Update payment method
  async updatePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const subscription = await this.getSubscriptionByUserId(userId)
    
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: subscription.customerId
    })

    // Set as default payment method
    await stripe.customers.update(subscription.customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })

    // Update subscription default payment method
    await stripe.subscriptions.update(subscription.subscriptionId, {
      default_payment_method: paymentMethodId
    })
  }

  // Get customer portal URL
  async getCustomerPortalUrl(userId: string, returnUrl: string): Promise<string> {
    const subscription = await this.getSubscriptionByUserId(userId)
    
    if (!subscription) {
      throw new Error('Subscription not found')
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.customerId,
      return_url: returnUrl
    })

    return session.url
  }

  // Check subscription limits
  async checkSubscriptionLimits(userId: string): Promise<{
    canCreateBlueprint: boolean
    sessionsRemaining: number
    sessionsLimit: number
  }> {
    const isActive = await this.isSubscriptionActive(userId)
    
    if (!isActive) {
      return {
        canCreateBlueprint: false,
        sessionsRemaining: 0,
        sessionsLimit: 0
      }
    }

    // Get current month's session count
    const supabase = createSupabaseServerClient()
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: sessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    const sessionCount = sessions?.length || 0
    const sessionLimit = 100 // Pro tier gets 100 sessions per month

    return {
      canCreateBlueprint: sessionCount < sessionLimit,
      sessionsRemaining: Math.max(0, sessionLimit - sessionCount),
      sessionsLimit: sessionLimit
    }
  }

  // Get subscription usage
  async getSubscriptionUsage(userId: string): Promise<{
    sessionsThisMonth: number
    exportsThisMonth: number
    storageUsedMB: number
    lastActivityDate?: Date
  }> {
    const supabase = createSupabaseServerClient()
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Get sessions count
    const { data: sessions } = await supabase
      .from('sessions')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    // Get exports count
    const { data: exports } = await supabase
      .from('exports')
      .select('size')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    // Calculate storage
    const storageUsedMB = (exports?.reduce((sum, e) => sum + (e.size || 0), 0) || 0) / (1024 * 1024)

    return {
      sessionsThisMonth: sessions?.length || 0,
      exportsThisMonth: exports?.length || 0,
      storageUsedMB: Math.round(storageUsedMB * 100) / 100,
      lastActivityDate: sessions?.[0]?.created_at ? new Date(sessions[0].created_at) : undefined
    }
  }

  // Create Stripe customer
  async createStripeCustomer(userId: string, email: string, metadata?: Record<string, string>): Promise<string> {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
        ...metadata
      }
    })

    // Store customer ID
    const supabase = createSupabaseServerClient()
    await supabase
      .from('profiles')
      .update({
        stripe_customer_id: customer.id
      })
      .eq('id', userId)

    return customer.id
  }

  // Get or create Stripe customer
  async getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
    const supabase = createSupabaseServerClient()
    
    // Check if customer already exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profile?.stripe_customer_id) {
      return profile.stripe_customer_id
    }

    // Create new customer
    return this.createStripeCustomer(userId, email)
  }

  // Format subscription data
  private formatSubscription(data: any): Subscription {
    return {
      id: data.id,
      userId: data.user_id,
      customerId: data.stripe_customer_id,
      subscriptionId: data.stripe_subscription_id,
      priceId: data.stripe_price_id,
      status: data.status as SubscriptionStatus,
      currentPeriodStart: new Date(data.current_period_start),
      currentPeriodEnd: new Date(data.current_period_end),
      cancelAt: data.cancel_at ? new Date(data.cancel_at) : undefined,
      canceledAt: data.canceled_at ? new Date(data.canceled_at) : undefined,
      trialEnd: data.trial_end ? new Date(data.trial_end) : undefined,
      metadata: data.metadata
    }
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager()