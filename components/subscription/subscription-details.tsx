'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CreditCard, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { SUBSCRIPTION_STATUS } from '@/lib/stripe/config'
import type { Subscription } from '@/lib/stripe/subscription'
import { useToast } from '@/lib/hooks/use-toast'

interface SubscriptionDetailsProps {
  subscription: Subscription
  userId: string
}

export function SubscriptionDetails({ subscription, userId }: SubscriptionDetailsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleManageBilling = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/subscription`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { portalUrl } = await response.json()
      window.location.href = portalUrl
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open billing portal',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Active
          </span>
        )
      case SUBSCRIPTION_STATUS.TRIALING:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Trial
          </span>
        )
      case SUBSCRIPTION_STATUS.PAST_DUE:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-4 h-4 mr-1" />
            Past Due
          </span>
        )
      case SUBSCRIPTION_STATUS.CANCELLED:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            {status}
          </span>
        )
    }
  }

  const getPlanName = (priceId: string) => {
    if (priceId.includes('monthly')) return 'Pro Monthly'
    if (priceId.includes('annual')) return 'Pro Annual'
    return 'Pro'
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Subscription Details</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Plan */}
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Plan</p>
              <p className="text-xl font-semibold text-gray-900">
                {getPlanName(subscription.priceId)}
              </p>
            </div>
            {getStatusBadge(subscription.status)}
          </div>

          {/* Billing Period */}
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <div>
                <p className="text-gray-600">Current Period</p>
                <p className="font-medium text-gray-900">
                  {format(subscription.currentPeriodStart, 'MMM d, yyyy')} - {format(subscription.currentPeriodEnd, 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center text-sm">
              <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
              <div>
                <p className="text-gray-600">Next Payment</p>
                <p className="font-medium text-gray-900">
                  {subscription.cancelAt 
                    ? `Cancels on ${format(subscription.cancelAt, 'MMM d, yyyy')}`
                    : format(subscription.currentPeriodEnd, 'MMM d, yyyy')
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {subscription.status === SUBSCRIPTION_STATUS.PAST_DUE && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">
                  Payment Required
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Your payment method failed. Please update your payment information to continue using the service.
                </p>
              </div>
            </div>
          </div>
        )}

        {subscription.cancelAt && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">
                  Subscription Ending
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Your subscription will end on {format(subscription.cancelAt, 'MMMM d, yyyy')}. 
                  You can reactivate anytime before this date.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleManageBilling}
            disabled={isLoading}
            className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Manage Billing'}
          </button>

          {subscription.status === SUBSCRIPTION_STATUS.ACTIVE && !subscription.cancelAt && (
            <button
              onClick={() => router.push('/pricing')}
              className="flex-1 bg-white text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Change Plan
            </button>
          )}

          {subscription.cancelAt && (
            <button
              onClick={handleManageBilling}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Reactivate Subscription
            </button>
          )}
        </div>
      </div>
    </div>
  )
}