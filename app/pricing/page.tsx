import Link from 'next/link'
import { Check, ArrowLeft } from 'lucide-react'

export default function PricingPage() {
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

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-blueprint-navy-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-blueprint-navy-600">
            Everything you need to plan and build your SaaS, all in one subscription
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-lg border-2 border-blueprint-navy-200 p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-blueprint-navy-900 mb-2">Free</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold text-blueprint-navy-900">£0</span>
                <span className="text-blueprint-navy-600 ml-2">/month</span>
              </div>
              <p className="text-blueprint-navy-600">
                Try out the platform with limited features
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <span className="text-blueprint-navy-700">1 blueprint generation</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <span className="text-blueprint-navy-700">Access to 12-phase workflow</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <span className="text-blueprint-navy-700">Basic export functionality</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <span className="text-blueprint-navy-700">Community support</span>
              </li>
            </ul>

            <Link
              href="/auth/sign-up"
              className="block w-full text-center px-6 py-3 border-2 border-blueprint-navy-600 text-blueprint-navy-600 font-medium rounded-lg hover:bg-blueprint-navy-50 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-gradient-to-br from-blueprint-cyan-500 to-blueprint-navy-600 rounded-lg p-8 text-white relative">
            <div className="absolute top-4 right-4">
              <span className="bg-yellow-400 text-blueprint-navy-900 text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold">£14.99</span>
                <span className="ml-2 opacity-90">/month</span>
              </div>
              <p className="opacity-90">
                Everything you need to succeed
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 mr-2 mt-0.5" />
                <span>Unlimited blueprint generations</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 mr-2 mt-0.5" />
                <span>12-phase guided workflow</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 mr-2 mt-0.5" />
                <span>GPT-5 & Claude Sonnet 4 integration</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 mr-2 mt-0.5" />
                <span>Exportable documentation</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 mr-2 mt-0.5" />
                <span>Claude Code prompts</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 mr-2 mt-0.5" />
                <span>EU VAT included</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 mr-2 mt-0.5" />
                <span>Priority email support</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 mr-2 mt-0.5" />
                <span>Early access to new features</span>
              </li>
            </ul>

            <Link
              href="/workflow/new"
              className="block w-full px-6 py-3 bg-white text-blueprint-navy-900 font-medium rounded-lg hover:bg-gray-100 transition-colors text-center"
            >
              Start Your Blueprint Journey
            </Link>
            <p className="text-xs text-center mt-2 opacity-75">
              Sign up to create your first blueprint
            </p>
          </div>
        </div>

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
