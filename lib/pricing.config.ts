/**
 * Pricing Configuration
 * Centralized configuration for all subscription tiers, features, and limits
 */

export type SubscriptionTier = 'free' | 'essentials' | 'premium' | 'pro_studio' | 'enterprise'

export interface TierFeature {
  included: boolean
  limit?: number | string
  description?: string
}

export interface TierConfig {
  id: SubscriptionTier
  name: string
  displayName: string
  description: string
  price: {
    monthly: number
    annual?: number
    currency: string
    displayPrice: string
    annualDisplayPrice?: string
  }
  stripePriceId?: {
    monthly?: string
    annual?: string
  }
  features: {
    activeProjects: TierFeature
    advancedPrompts: TierFeature
    codeExamples: TierFeature
    prioritySupport: TierFeature
    unlimitedExports: TierFeature
    apiAccess: TierFeature
    teamCollaboration: TierFeature
    whiteLabel: TierFeature
    dedicatedSupport: TierFeature
    customIntegrations: TierFeature
    sla: TierFeature
  }
  highlighted?: boolean
  ctaText: string
  ctaAction: 'signup' | 'upgrade' | 'contact'
}

export const PRICING_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    displayName: 'Free',
    description: 'Perfect for exploring SharpAxe and creating your first blueprint',
    price: {
      monthly: 0,
      currency: 'gbp',
      displayPrice: '£0',
    },
    features: {
      activeProjects: { included: true, limit: 1, description: '1 active project' },
      advancedPrompts: { included: false },
      codeExamples: { included: false },
      prioritySupport: { included: false },
      unlimitedExports: { included: false, limit: 3, description: '3 exports per month' },
      apiAccess: { included: false },
      teamCollaboration: { included: false },
      whiteLabel: { included: false },
      dedicatedSupport: { included: false },
      customIntegrations: { included: false },
      sla: { included: false },
    },
    ctaText: 'Get Started Free',
    ctaAction: 'signup',
  },

  essentials: {
    id: 'essentials',
    name: 'Essentials',
    displayName: 'Essentials',
    description: 'For indie developers building their first SaaS product',
    price: {
      monthly: 7.99,
      annual: 79.99,
      currency: 'gbp',
      displayPrice: '£7.99',
      annualDisplayPrice: '£79.99/yr',
    },
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS_MONTHLY,
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIALS_ANNUAL,
    },
    features: {
      activeProjects: { included: true, limit: 5, description: '5 active projects' },
      advancedPrompts: { included: true, description: 'Advanced Claude Code prompts' },
      codeExamples: { included: false },
      prioritySupport: { included: false },
      unlimitedExports: { included: false, limit: 25, description: '25 exports per month' },
      apiAccess: { included: false },
      teamCollaboration: { included: false },
      whiteLabel: { included: false },
      dedicatedSupport: { included: false },
      customIntegrations: { included: false },
      sla: { included: false },
    },
    ctaText: 'Start Building',
    ctaAction: 'upgrade',
  },

  premium: {
    id: 'premium',
    name: 'Premium',
    displayName: 'Premium',
    description: 'For serious developers building multiple SaaS products',
    price: {
      monthly: 14.99,
      annual: 149.99,
      currency: 'gbp',
      displayPrice: '£14.99',
      annualDisplayPrice: '£149.99/yr',
    },
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY,
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_ANNUAL,
    },
    features: {
      activeProjects: { included: true, limit: 15, description: '15 active projects' },
      advancedPrompts: { included: true, description: 'Advanced Claude Code prompts' },
      codeExamples: { included: true, description: 'Full code examples included' },
      prioritySupport: { included: true, description: 'Priority email support' },
      unlimitedExports: { included: true, description: 'Unlimited exports' },
      apiAccess: { included: false },
      teamCollaboration: { included: false },
      whiteLabel: { included: false },
      dedicatedSupport: { included: false },
      customIntegrations: { included: false },
      sla: { included: false },
    },
    highlighted: true,
    ctaText: 'Go Premium',
    ctaAction: 'upgrade',
  },

  pro_studio: {
    id: 'pro_studio',
    name: 'Pro Studio',
    displayName: 'Pro Studio',
    description: 'For agencies and teams shipping SaaS products at scale',
    price: {
      monthly: 39.99,
      annual: 399.99,
      currency: 'gbp',
      displayPrice: '£39.99',
      annualDisplayPrice: '£399.99/yr',
    },
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_STUDIO_MONTHLY,
      annual: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_STUDIO_ANNUAL,
    },
    features: {
      activeProjects: { included: true, limit: 'unlimited', description: 'Unlimited active projects' },
      advancedPrompts: { included: true, description: 'Advanced Claude Code prompts' },
      codeExamples: { included: true, description: 'Full code examples included' },
      prioritySupport: { included: true, description: 'Priority support' },
      unlimitedExports: { included: true, description: 'Unlimited exports' },
      apiAccess: { included: true, description: 'Full API access' },
      teamCollaboration: { included: true, description: 'Team collaboration tools' },
      whiteLabel: { included: true, description: 'White-label blueprints' },
      dedicatedSupport: { included: false },
      customIntegrations: { included: false },
      sla: { included: false },
    },
    ctaText: 'Upgrade to Pro',
    ctaAction: 'upgrade',
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    displayName: 'Enterprise',
    description: 'Custom solutions for large organizations with specific requirements',
    price: {
      monthly: 0,
      currency: 'gbp',
      displayPrice: 'Custom',
    },
    features: {
      activeProjects: { included: true, limit: 'unlimited', description: 'Unlimited active projects' },
      advancedPrompts: { included: true, description: 'Advanced Claude Code prompts' },
      codeExamples: { included: true, description: 'Full code examples included' },
      prioritySupport: { included: true, description: 'Priority support' },
      unlimitedExports: { included: true, description: 'Unlimited exports' },
      apiAccess: { included: true, description: 'Full API access' },
      teamCollaboration: { included: true, description: 'Team collaboration tools' },
      whiteLabel: { included: true, description: 'White-label blueprints' },
      dedicatedSupport: { included: true, description: 'Dedicated account manager' },
      customIntegrations: { included: true, description: 'Custom integrations' },
      sla: { included: true, description: '99.9% uptime SLA' },
    },
    ctaText: 'Contact Sales',
    ctaAction: 'contact',
  },
}

/**
 * Get tier configuration by ID
 */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
  return PRICING_TIERS[tier]
}

/**
 * Get all tier configurations as an array
 */
export function getAllTiers(): TierConfig[] {
  return Object.values(PRICING_TIERS)
}

/**
 * Check if a tier includes a specific feature
 */
export function tierHasFeature(
  tier: SubscriptionTier,
  feature: keyof TierConfig['features']
): boolean {
  return PRICING_TIERS[tier].features[feature].included
}

/**
 * Get the project limit for a tier
 */
export function getTierProjectLimit(tier: SubscriptionTier): number {
  const limit = PRICING_TIERS[tier].features.activeProjects.limit
  return typeof limit === 'number' ? limit : 999999 // Treat 'unlimited' as large number
}

/**
 * Get the export limit for a tier (per month)
 */
export function getTierExportLimit(tier: SubscriptionTier): number {
  const feature = PRICING_TIERS[tier].features.unlimitedExports
  if (feature.included) return 999999 // Unlimited
  return typeof feature.limit === 'number' ? feature.limit : 0
}

/**
 * Check if one tier is higher than another
 */
export function isTierHigherThan(tier1: SubscriptionTier, tier2: SubscriptionTier): boolean {
  const tierOrder: SubscriptionTier[] = ['free', 'essentials', 'premium', 'pro_studio', 'enterprise']
  return tierOrder.indexOf(tier1) > tierOrder.indexOf(tier2)
}

/**
 * Get tier from Stripe Price ID
 */
export function getTierFromPriceId(priceId: string): SubscriptionTier | null {
  for (const [tier, config] of Object.entries(PRICING_TIERS)) {
    if (
      config.stripePriceId?.monthly === priceId ||
      config.stripePriceId?.annual === priceId
    ) {
      return tier as SubscriptionTier
    }
  }
  return null
}

/**
 * Feature display names for UI
 */
export const FEATURE_DISPLAY_NAMES: Record<keyof TierConfig['features'], string> = {
  activeProjects: 'Active Projects',
  advancedPrompts: 'Advanced Prompts',
  codeExamples: 'Code Examples',
  prioritySupport: 'Priority Support',
  unlimitedExports: 'Exports',
  apiAccess: 'API Access',
  teamCollaboration: 'Team Collaboration',
  whiteLabel: 'White Label',
  dedicatedSupport: 'Dedicated Support',
  customIntegrations: 'Custom Integrations',
  sla: 'SLA',
}
