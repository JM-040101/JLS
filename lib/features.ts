/**
 * Feature Flag System
 * Centralized feature access control based on subscription tiers
 */

import { getUserSubscription, hasFeature } from '@/lib/subscription'
import type { SubscriptionTier } from '@/lib/pricing.config'

export type FeatureName =
  | 'advanced_prompts'
  | 'code_examples'
  | 'priority_support'
  | 'unlimited_exports'
  | 'api_access'
  | 'team_collaboration'
  | 'white_label'
  | 'dedicated_support'
  | 'custom_integrations'
  | 'sla'

export interface FeatureAccess {
  enabled: boolean
  reason?: string
  upgradeRequired?: SubscriptionTier
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(
  userId: string,
  featureName: FeatureName
): Promise<FeatureAccess> {
  const subscription = await getUserSubscription(userId)

  if (!subscription) {
    return {
      enabled: false,
      reason: 'No active subscription',
      upgradeRequired: 'essentials',
    }
  }

  // Admins have all features
  if (subscription.isAdmin) {
    return { enabled: true }
  }

  // Check if feature is included in user's tier
  const hasAccess = await hasFeature(userId, featureName)

  if (hasAccess) {
    return { enabled: true }
  }

  // Determine which tier includes this feature
  const upgradeRequired = getMinimumTierForFeature(featureName)

  return {
    enabled: false,
    reason: `This feature requires ${upgradeRequired} tier or higher`,
    upgradeRequired,
  }
}

/**
 * Get minimum tier required for a feature
 */
function getMinimumTierForFeature(featureName: FeatureName): SubscriptionTier {
  const featureMap: Record<FeatureName, SubscriptionTier> = {
    advanced_prompts: 'essentials',
    code_examples: 'premium',
    priority_support: 'premium',
    unlimited_exports: 'premium',
    api_access: 'pro_studio',
    team_collaboration: 'pro_studio',
    white_label: 'pro_studio',
    dedicated_support: 'enterprise',
    custom_integrations: 'enterprise',
    sla: 'enterprise',
  }

  return featureMap[featureName] || 'premium'
}

/**
 * Batch check multiple features
 */
export async function checkMultipleFeatures(
  userId: string,
  featureNames: FeatureName[]
): Promise<Record<FeatureName, FeatureAccess>> {
  const results: Record<string, FeatureAccess> = {}

  await Promise.all(
    featureNames.map(async (featureName) => {
      results[featureName] = await checkFeatureAccess(userId, featureName)
    })
  )

  return results as Record<FeatureName, FeatureAccess>
}

/**
 * Get all features enabled for a user
 */
export async function getUserFeatures(userId: string): Promise<{
  tier: SubscriptionTier
  enabledFeatures: FeatureName[]
  disabledFeatures: FeatureName[]
}> {
  const subscription = await getUserSubscription(userId)

  if (!subscription) {
    return {
      tier: 'free',
      enabledFeatures: [],
      disabledFeatures: [
        'advanced_prompts',
        'code_examples',
        'priority_support',
        'unlimited_exports',
        'api_access',
        'team_collaboration',
        'white_label',
        'dedicated_support',
        'custom_integrations',
        'sla',
      ],
    }
  }

  const allFeatures: FeatureName[] = [
    'advanced_prompts',
    'code_examples',
    'priority_support',
    'unlimited_exports',
    'api_access',
    'team_collaboration',
    'white_label',
    'dedicated_support',
    'custom_integrations',
    'sla',
  ]

  const enabledFeatures: FeatureName[] = []
  const disabledFeatures: FeatureName[] = []

  for (const feature of allFeatures) {
    const access = await checkFeatureAccess(userId, feature)
    if (access.enabled) {
      enabledFeatures.push(feature)
    } else {
      disabledFeatures.push(feature)
    }
  }

  return {
    tier: subscription.tier,
    enabledFeatures,
    disabledFeatures,
  }
}

/**
 * Feature gates for common actions
 */
export const FeatureGates = {
  /**
   * Check if user can access advanced Claude Code prompts
   */
  canUseAdvancedPrompts: (userId: string) =>
    checkFeatureAccess(userId, 'advanced_prompts'),

  /**
   * Check if user can include code examples in exports
   */
  canIncludeCodeExamples: (userId: string) =>
    checkFeatureAccess(userId, 'code_examples'),

  /**
   * Check if user has priority support access
   */
  hasPrioritySupport: (userId: string) =>
    checkFeatureAccess(userId, 'priority_support'),

  /**
   * Check if user has unlimited exports
   */
  hasUnlimitedExports: (userId: string) =>
    checkFeatureAccess(userId, 'unlimited_exports'),

  /**
   * Check if user can access API
   */
  canAccessAPI: (userId: string) =>
    checkFeatureAccess(userId, 'api_access'),

  /**
   * Check if user can use team collaboration features
   */
  canUseTeamFeatures: (userId: string) =>
    checkFeatureAccess(userId, 'team_collaboration'),

  /**
   * Check if user can use white-label exports
   */
  canUseWhiteLabel: (userId: string) =>
    checkFeatureAccess(userId, 'white_label'),
}
