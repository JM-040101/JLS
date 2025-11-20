'use client'

import { useRouter } from 'next/navigation'
import { getTierConfig, type SubscriptionTier } from '@/lib/pricing.config'
import branding from '@/branding.config'

interface UpgradePromptProps {
  currentTier: SubscriptionTier
  requiredTier?: SubscriptionTier
  feature?: string
  limitType?: 'projects' | 'exports'
  currentCount?: number
  limit?: number
  onClose?: () => void
}

export default function UpgradePrompt({
  currentTier,
  requiredTier = 'premium',
  feature,
  limitType,
  currentCount,
  limit,
  onClose
}: UpgradePromptProps) {
  const router = useRouter()
  const currentTierConfig = getTierConfig(currentTier)
  const requiredTierConfig = getTierConfig(requiredTier)

  const getMessage = () => {
    if (limitType === 'projects') {
      return `You've reached your ${currentTierConfig.displayName} limit of ${limit} active project${limit === 1 ? '' : 's'}.`
    }
    if (limitType === 'exports') {
      return `You've reached your ${currentTierConfig.displayName} limit of ${limit} export${limit === 1 ? '' : 's'} this month.`
    }
    if (feature) {
      return `${feature} is only available on the ${requiredTierConfig.displayName} plan or higher.`
    }
    return `Upgrade to ${requiredTierConfig.displayName} to unlock more features.`
  }

  const getActionText = () => {
    if (currentTier === 'free') {
      return 'Start Free Trial'
    }
    return `Upgrade to ${requiredTierConfig.displayName}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div
        className="max-w-md w-full rounded-3xl p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
          backdropFilter: 'blur(60px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
          }}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="white"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        {/* Title */}
        <h3
          className="text-2xl font-bold text-center mb-3"
          style={{ color: branding.colors.textHeading }}
        >
          Upgrade Required
        </h3>

        {/* Message */}
        <p
          className="text-center mb-6"
          style={{
            color: branding.colors.textBody,
            opacity: 0.8
          }}
        >
          {getMessage()}
        </p>

        {/* Current vs Required Plan Comparison */}
        <div className="space-y-3 mb-6">
          {/* Current Plan */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-60" style={{ color: branding.colors.textBody }}>
                  Current Plan
                </div>
                <div className="font-semibold" style={{ color: branding.colors.textHeading }}>
                  {currentTierConfig.displayName}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg" style={{ color: branding.colors.textHeading }}>
                  {currentTierConfig.price.displayPrice}
                </div>
                {currentTier !== 'free' && (
                  <div className="text-xs opacity-60" style={{ color: branding.colors.textBody }}>
                    /month
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke={branding.colors.gradientFrom}
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          {/* Required Plan */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${branding.colors.gradientFrom}15, ${branding.colors.gradientTo}10)`,
              border: `1px solid ${branding.colors.gradientFrom}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-60" style={{ color: branding.colors.textBody }}>
                  Recommended
                </div>
                <div className="font-semibold" style={{ color: branding.colors.gradientFrom }}>
                  {requiredTierConfig.displayName}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg" style={{ color: branding.colors.gradientFrom }}>
                  {requiredTierConfig.price.displayPrice}
                </div>
                {requiredTier !== 'free' && requiredTier !== 'enterprise' && (
                  <div className="text-xs opacity-60" style={{ color: branding.colors.textBody }}>
                    /month
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="mb-6">
          <div className="text-sm font-semibold mb-3" style={{ color: branding.colors.textHeading }}>
            What you'll get:
          </div>
          <div className="space-y-2">
            {Object.entries(requiredTierConfig.features)
              .filter(([_, feature]) => feature.included)
              .slice(0, 4)
              .map(([key, feature]) => (
                <div key={key} className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: branding.colors.gradientFrom }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm" style={{ color: branding.colors.textBody }}>
                    {feature.description || key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: branding.colors.textBody,
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              Maybe Later
            </button>
          )}
          <button
            onClick={() => router.push('/pricing')}
            className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all"
            style={{
              background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
              color: '#FFFFFF',
            }}
          >
            {getActionText()}
          </button>
        </div>

        {/* Fine print */}
        <p
          className="text-xs text-center mt-4"
          style={{
            color: branding.colors.textBody,
            opacity: 0.5
          }}
        >
          Cancel anytime. No long-term commitments.
        </p>
      </div>
    </div>
  )
}
