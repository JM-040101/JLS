'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAllTiers, type SubscriptionTier } from '@/lib/pricing.config'
import ElectricBorder from '@/components/ui/ElectricBorder'
import { useToast } from '@/lib/hooks/use-toast'
import { branding } from '@/branding.config'

interface MultiTierPricingSectionProps {
  currentTier?: SubscriptionTier
  userId?: string
}

export function MultiTierPricingSection({ currentTier = 'free', userId }: MultiTierPricingSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const tiers = getAllTiers()

  const handleAction = async (tier: SubscriptionTier, action: 'signup' | 'upgrade' | 'contact') => {
    if (action === 'contact') {
      window.location.href = 'mailto:sales@sharpaxe.com?subject=Enterprise%20Plan%20Inquiry'
      return
    }

    if (action === 'signup' && !userId) {
      router.push('/auth/sign-in?redirect=/pricing')
      return
    }

    if (action === 'upgrade') {
      setIsLoading(tier)
      try {
        const tierConfig = tiers.find(t => t.id === tier)
        const priceId = interval === 'monthly'
          ? tierConfig?.stripePriceId?.monthly
          : tierConfig?.stripePriceId?.annual

        if (!priceId) {
          throw new Error('Price ID not configured for this tier')
        }

        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId,
            interval,
            successUrl: `${window.location.origin}/dashboard?success=true`,
            cancelUrl: `${window.location.origin}/pricing?cancelled=true`,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create checkout session')
        }

        const { checkoutUrl } = await response.json()
        window.location.href = checkoutUrl
      } catch (error: any) {
        console.error('Checkout error:', error)
        toast({
          title: 'Error',
          description: error.message || 'Failed to start checkout',
          variant: 'destructive',
        })
        setIsLoading(null)
      }
    }
  }

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{
            color: branding.colors.textHeading,
            fontFamily: branding.fonts.heading
          }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg" style={{
            color: branding.colors.textMuted
          }}>
            Choose the perfect plan for your SaaS blueprint journey
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center rounded-lg p-1 mt-8" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <button
              onClick={() => setInterval('monthly')}
              className="px-6 py-2 rounded-md font-medium transition-all"
              style={{
                background: interval === 'monthly' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                color: interval === 'monthly' ? branding.colors.accent : branding.colors.text,
                border: interval === 'monthly' ? `1px solid ${branding.colors.accent}` : 'none',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('annual')}
              className="px-6 py-2 rounded-md font-medium transition-all flex items-center"
              style={{
                background: interval === 'annual' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                color: interval === 'annual' ? branding.colors.accent : branding.colors.text,
                border: interval === 'annual' ? `1px solid ${branding.colors.accent}` : 'none',
              }}
            >
              Annual
              <span className="ml-2 px-2 py-0.5 text-xs rounded font-semibold" style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: branding.colors.success,
              }}>
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid - First 4 Tiers (2x2) */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-6">
          {tiers.filter(t => t.id !== 'enterprise').map((tier) => {
            const price = interval === 'monthly' ? tier.price.displayPrice : tier.price.annualDisplayPrice || tier.price.displayPrice
            const isCurrentTier = tier.id === currentTier
            const PricingCardWrapper = tier.highlighted ? ElectricBorder : 'div'
            const wrapperProps = tier.highlighted ? {
              duration: '8s',
              trailSize: 'md' as const,
              borderRadius: '1.5rem',
              className: 'h-full',
              contentClassName: ''
            } : {
              className: 'h-full'
            }

            return (
              <PricingCardWrapper key={tier.id} {...wrapperProps}>
                <div
                  className="p-8 rounded-3xl h-full flex flex-col transition-all duration-300 transform hover:scale-105"
                  style={{
                    background: tier.highlighted
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                    backdropFilter: 'blur(60px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                    border: tier.highlighted
                      ? 'none'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: tier.highlighted
                      ? '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
                      : '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {/* Tier Header */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-3" style={{
                      color: tier.highlighted ? '#FFFFFF' : branding.colors.textHeading,
                      fontFamily: branding.fonts.heading,
                      textShadow: tier.highlighted ? '0 2px 4px rgba(0, 0, 0, 0.3)' : 'none'
                    }}>
                      {tier.displayName}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{
                      color: tier.highlighted ? '#F3F4F6' : branding.colors.textMuted,
                      minHeight: '40px',
                      lineHeight: '1.7',
                      opacity: 1,
                      textShadow: tier.highlighted ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
                    }}>
                      {tier.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline mb-2">
                      <span className="text-4xl font-bold" style={{
                        color: tier.highlighted ? '#FFFFFF' : branding.colors.textHeading,
                        textShadow: tier.highlighted ? '0 2px 4px rgba(0, 0, 0, 0.4)' : 'none'
                      }}>
                        {tier.id === 'enterprise' ? 'Custom' : price}
                      </span>
                      {tier.id !== 'free' && tier.id !== 'enterprise' && (
                        <span className="ml-2 text-lg" style={{
                          color: tier.highlighted ? '#E5E7EB' : branding.colors.textMuted,
                          textShadow: tier.highlighted ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
                        }}>
                          /{interval === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleAction(tier.id, tier.ctaAction)}
                    disabled={isLoading === tier.id || isCurrentTier}
                    className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 mb-6"
                    style={{
                      background: isCurrentTier
                        ? 'rgba(255, 255, 255, 0.05)'
                        : tier.highlighted
                        ? `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`
                        : 'rgba(255, 255, 255, 0.05)',
                      color: isCurrentTier
                        ? branding.colors.textMuted
                        : tier.highlighted
                        ? '#12141C'
                        : branding.colors.textHeading,
                      border: tier.highlighted
                        ? 'none'
                        : isCurrentTier
                        ? `1px solid rgba(255, 255, 255, 0.1)`
                        : `1px solid ${branding.colors.accent}`,
                      cursor: isCurrentTier ? 'not-allowed' : 'pointer',
                      opacity: isLoading === tier.id ? 0.7 : 1,
                      boxShadow: tier.highlighted ? `0 0 20px ${branding.colors.accentGlow}` : 'none'
                    }}
                  >
                    {isLoading === tier.id
                      ? 'Processing...'
                      : isCurrentTier
                      ? 'Current Plan'
                      : tier.ctaText}
                  </button>

                  {/* Features List */}
                  <div className="flex-1 space-y-3">
                    {Object.entries(tier.features)
                      .filter(([_, feature]) => feature.included || feature.limit)
                      .map(([key, feature]) => (
                        <div key={key} className="flex items-start">
                          <svg
                            className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            style={{
                              color: tier.highlighted ? '#FFFFFF' : branding.colors.accent,
                              filter: tier.highlighted ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' : 'none'
                            }}
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm" style={{
                            color: tier.highlighted ? '#F3F4F6' : branding.colors.text,
                            fontSize: '0.95rem',
                            lineHeight: '1.5',
                            textShadow: tier.highlighted ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
                          }}>
                            {feature.description || key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Current Tier Badge */}
                  {isCurrentTier && (
                    <div
                      className="mt-4 py-2 px-4 rounded-lg text-center text-sm font-semibold"
                      style={{
                        background: 'rgba(6, 182, 212, 0.2)',
                        color: branding.colors.accent,
                        border: `1px solid ${branding.colors.accent}`,
                      }}
                    >
                      Your Current Plan
                    </div>
                  )}
                </div>
              </PricingCardWrapper>
            )
          })}
        </div>

        {/* Enterprise Tier - Full Width Horizontal Card */}
        {(() => {
          const enterpriseTier = tiers.find(t => t.id === 'enterprise')
          if (!enterpriseTier) return null

          const isCurrentTier = enterpriseTier.id === currentTier
          const price = interval === 'monthly' ? enterpriseTier.price.displayPrice : enterpriseTier.price.annualDisplayPrice || enterpriseTier.price.displayPrice

          return (
            <div className="max-w-5xl mx-auto">
              <div
                className="p-8 md:p-10 rounded-3xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                  backdropFilter: 'blur(60px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                  {/* Left Side - Tier Info */}
                  <div className="md:w-2/5 flex flex-col">
                    <h3 className="text-3xl font-bold mb-3" style={{
                      color: branding.colors.textHeading,
                      fontFamily: branding.fonts.heading
                    }}>
                      {enterpriseTier.displayName}
                    </h3>
                    <p className="text-base leading-relaxed mb-6" style={{
                      color: branding.colors.textMuted,
                      lineHeight: '1.7',
                      opacity: 0.9
                    }}>
                      {enterpriseTier.description}
                    </p>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline mb-2">
                        <span className="text-5xl font-bold" style={{
                          color: branding.colors.textHeading
                        }}>
                          Custom
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: branding.colors.textMuted }}>
                        Tailored pricing for your organization
                      </p>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleAction(enterpriseTier.id, enterpriseTier.ctaAction)}
                      disabled={isLoading === enterpriseTier.id || isCurrentTier}
                      className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                      style={{
                        background: isCurrentTier
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(255, 255, 255, 0.05)',
                        color: isCurrentTier
                          ? branding.colors.textMuted
                          : branding.colors.textHeading,
                        border: isCurrentTier
                          ? `1px solid rgba(255, 255, 255, 0.1)`
                          : `1px solid ${branding.colors.accent}`,
                        cursor: isCurrentTier ? 'not-allowed' : 'pointer',
                        opacity: isLoading === enterpriseTier.id ? 0.7 : 1,
                      }}
                    >
                      {isLoading === enterpriseTier.id
                        ? 'Processing...'
                        : isCurrentTier
                        ? 'Current Plan'
                        : enterpriseTier.ctaText}
                    </button>

                    {/* Current Tier Badge */}
                    {isCurrentTier && (
                      <div
                        className="mt-4 py-2 px-4 rounded-lg text-center text-sm font-semibold"
                        style={{
                          background: 'rgba(6, 182, 212, 0.2)',
                          color: branding.colors.accent,
                          border: `1px solid ${branding.colors.accent}`,
                        }}
                      >
                        Your Current Plan
                      </div>
                    )}
                  </div>

                  {/* Right Side - Features Grid */}
                  <div className="md:w-3/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(enterpriseTier.features)
                        .filter(([_, feature]) => feature.included || feature.limit)
                        .map(([key, feature]) => (
                          <div key={key} className="flex items-start">
                            <svg
                              className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              style={{ color: branding.colors.accent }}
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm" style={{
                              color: branding.colors.text,
                              fontSize: '0.95rem',
                              lineHeight: '1.5'
                            }}>
                              {feature.description || key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Trust Section */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center space-x-8 flex-wrap gap-4">
            <div className="flex items-center" style={{ color: branding.colors.text }}>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: branding.colors.accent }}>
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span style={{ fontSize: '0.95rem' }}>SSL Secured</span>
            </div>
            <div className="flex items-center" style={{ color: branding.colors.text }}>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: branding.colors.accent }}>
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              <span style={{ fontSize: '0.95rem' }}>Secure Payments via Stripe</span>
            </div>
            <div className="flex items-center" style={{ color: branding.colors.text }}>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: branding.colors.accent }}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span style={{ fontSize: '0.95rem' }}>Cancel Anytime</span>
            </div>
          </div>

          <p className="text-sm mt-6" style={{
            color: branding.colors.textMuted,
            fontSize: '0.9rem'
          }}>
            All plans include EU VAT handling. Enterprise plans include dedicated onboarding.
          </p>
        </div>
      </div>
    </section>
  )
}
