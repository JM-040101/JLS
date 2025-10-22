// Subscription Management Page

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { subscriptionManager } from '@/lib/stripe/subscription'
import { SubscriptionDetails } from '@/components/subscription/subscription-details'
import { SubscriptionUsage } from '@/components/subscription/subscription-usage'
import { BillingHistory } from '@/components/subscription/billing-history'

export default async function SubscriptionPage() {
  const supabase = createSupabaseServerClient()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/sign-in')
  }

  // Get subscription details
  const subscription = await subscriptionManager.getSubscriptionByUserId(user.id)
  
  if (!subscription) {
    redirect('/pricing')
  }

  // Get usage data
  const usage = await subscriptionManager.getSubscriptionUsage(user.id)
  const limits = await subscriptionManager.checkSubscriptionLimits(user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
          <p className="mt-2 text-gray-600">Manage your subscription and view usage</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Subscription Details */}
          <div className="lg:col-span-2">
            <SubscriptionDetails 
              subscription={subscription}
              userId={user.id}
            />

            {/* Usage Statistics */}
            <div className="mt-8">
              <SubscriptionUsage 
                usage={usage}
                limits={limits}
              />
            </div>
          </div>

          {/* Billing History */}
          <div>
            <BillingHistory userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}