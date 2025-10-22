import { requireAuth } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Calendar, DollarSign, AlertCircle } from 'lucide-react'
import UserMenu from '@/components/auth/user-menu'

export default async function BillingPage() {
  const user = await requireAuth()
  const supabase = createSupabaseServerClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_admin === true || profile?.role === 'admin' || profile?.role === 'superadmin'
  const hasActiveSubscription = profile?.subscription_status === 'active'

  return (
    <div className="min-h-screen bg-gradient-to-b from-blueprint-navy-50 to-white">
      {/* Header */}
      <header className="border-b border-blueprint-navy-100 bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-blueprint-navy-600 hover:text-blueprint-navy-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <UserMenu />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blueprint-navy-900 mb-2">
            Billing & Subscription
          </h1>
          <p className="text-blueprint-navy-600">
            Manage your subscription and payment methods
          </p>
        </div>

        <div className="space-y-6">
          {/* Admin Notice */}
          {isAdmin && !hasActiveSubscription && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-purple-900">Admin Access</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    You have admin privileges with unlimited access to all Pro features without requiring a subscription.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Plan */}
          <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-5 h-5 text-blueprint-navy-600" />
                <h2 className="text-xl font-semibold text-blueprint-navy-900">
                  Current Plan
                </h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                hasActiveSubscription || isAdmin
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {hasActiveSubscription || isAdmin ? 'Pro' : 'Free'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-blueprint-navy-600">Plan Status</span>
                <span className="font-medium text-blueprint-navy-900">
                  {hasActiveSubscription ? 'Active' : isAdmin ? 'Admin Access' : 'Inactive'}
                </span>
              </div>

              {hasActiveSubscription && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-blueprint-navy-600">Price</span>
                    <span className="font-medium text-blueprint-navy-900">£14.99/month</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-blueprint-navy-600">Next Billing Date</span>
                    <span className="font-medium text-blueprint-navy-900">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </>
              )}

              {!hasActiveSubscription && !isAdmin && (
                <div className="pt-4 border-t border-blueprint-navy-100">
                  <p className="text-sm text-blueprint-navy-600 mb-4">
                    Upgrade to Pro to unlock unlimited blueprint generations and advanced features.
                  </p>
                  <Link href="/pricing" className="btn-primary">
                    View Plans
                  </Link>
                </div>
              )}

              {hasActiveSubscription && (
                <div className="pt-4 border-t border-blueprint-navy-100">
                  <button
                    className="btn-secondary text-sm"
                    disabled
                  >
                    Manage Subscription
                  </button>
                  <p className="text-xs text-blueprint-navy-500 mt-2">
                    Stripe portal integration coming soon
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          {hasActiveSubscription && (
            <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <DollarSign className="w-5 h-5 text-blueprint-navy-600" />
                <h2 className="text-xl font-semibold text-blueprint-navy-900">
                  Payment Method
                </h2>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-blueprint-navy-50 rounded-lg">
                <CreditCard className="w-8 h-8 text-blueprint-navy-600" />
                <div className="flex-1">
                  <p className="font-medium text-blueprint-navy-900">•••• •••• •••• 4242</p>
                  <p className="text-sm text-blueprint-navy-600">Expires 12/25</p>
                </div>
              </div>

              <div className="mt-4">
                <button className="btn-secondary text-sm" disabled>
                  Update Payment Method
                </button>
                <p className="text-xs text-blueprint-navy-500 mt-2">
                  Payment method management coming soon
                </p>
              </div>
            </div>
          )}

          {/* Billing History */}
          <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-5 h-5 text-blueprint-navy-600" />
              <h2 className="text-xl font-semibold text-blueprint-navy-900">
                Billing History
              </h2>
            </div>

            {hasActiveSubscription ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blueprint-navy-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blueprint-navy-900">Pro Plan - Monthly</p>
                    <p className="text-sm text-blueprint-navy-600">
                      {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-blueprint-navy-900">£14.99</p>
                    <button className="text-sm text-blueprint-cyan-600 hover:text-blueprint-cyan-700" disabled>
                      Download
                    </button>
                  </div>
                </div>
                <p className="text-xs text-blueprint-navy-500 text-center pt-2">
                  Invoice download coming soon
                </p>
              </div>
            ) : (
              <p className="text-center text-blueprint-navy-600 py-8">
                No billing history yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
