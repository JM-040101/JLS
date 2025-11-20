import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MultiTierPricingSection } from '@/components/pricing/multi-tier-pricing-section'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { SubscriptionTier } from '@/lib/pricing.config'

export default async function PricingPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentTier: SubscriptionTier = 'free'
  let userId: string | undefined = undefined

  if (user) {
    userId = user.id
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (profile?.subscription_tier) {
      currentTier = profile.subscription_tier as SubscriptionTier
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blueprint-navy-50 to-white">
      {/* Header */}
      <header className="border-b border-blueprint-navy-100 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-blueprint-navy-600 hover:text-blueprint-navy-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-blueprint-navy-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-blueprint-navy-600">
            Choose the perfect plan for your SaaS blueprint journey
          </p>
        </div>

        {/* Pricing Section */}
        <MultiTierPricingSection currentTier={currentTier} userId={userId} />

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-blueprint-navy-900 mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
              <h3 className="font-semibold text-blueprint-navy-900 mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-blueprint-navy-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
              <h3 className="font-semibold text-blueprint-navy-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-blueprint-navy-600">
                We accept all major credit cards (Visa, Mastercard, American Express) through Stripe's secure payment processing.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
              <h3 className="font-semibold text-blueprint-navy-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-blueprint-navy-600">
                Yes! You can create one blueprint for free to try out the platform. Upgrade to Pro anytime for unlimited access.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
              <h3 className="font-semibold text-blueprint-navy-900 mb-2">
                What happens to my blueprints if I cancel?
              </h3>
              <p className="text-blueprint-navy-600">
                Your blueprints remain accessible after cancellation, but you won't be able to create new ones until you reactivate your subscription.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-blueprint-navy-600 mb-4">
            Still have questions?
          </p>
          <Link
            href="/dashboard"
            className="text-blueprint-cyan-600 hover:text-blueprint-cyan-700 font-medium"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}
