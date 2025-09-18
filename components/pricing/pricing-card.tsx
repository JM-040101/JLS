'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { PRICING } from '@/lib/stripe/config'

interface PricingCardProps {
  interval: 'month' | 'year'
  onCheckout: (priceId: string) => void
  isLoading?: boolean
  currentPlan?: string | null
}

export function PricingCard({ 
  interval, 
  onCheckout, 
  isLoading = false,
  currentPlan
}: PricingCardProps) {
  const pricing = interval === 'month' ? PRICING.PRO_MONTHLY : PRICING.PRO_ANNUAL
  const isCurrentPlan = currentPlan === pricing.priceId

  // Calculate savings for annual
  const monthlyCost = PRICING.PRO_MONTHLY.amount
  const annualMonthlyCost = Math.round(PRICING.PRO_ANNUAL.amount / 12)
  const savings = monthlyCost - annualMonthlyCost
  const savingsPercent = Math.round((savings / monthlyCost) * 100)

  return (
    <div className={`
      relative rounded-2xl p-8 
      ${interval === 'year' 
        ? 'border-2 border-blue-500 shadow-xl bg-gradient-to-br from-blue-50 to-white' 
        : 'border border-gray-200 bg-white shadow-lg'
      }
    `}>
      {interval === 'year' && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            SAVE {savingsPercent}%
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {pricing.name}
        </h3>
        <p className="text-gray-600">
          {pricing.description}
        </p>
      </div>

      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center">
          <span className="text-4xl font-bold text-gray-900">
            £{Math.floor(pricing.amount / 100)}
          </span>
          <span className="text-xl text-gray-600 ml-1">
            .{(pricing.amount % 100).toString().padStart(2, '0')}
          </span>
          <span className="text-gray-500 ml-2">
            /{interval === 'month' ? 'month' : 'year'}
          </span>
        </div>
        
        {interval === 'year' && (
          <p className="text-sm text-green-600 mt-2 font-medium">
            £{annualMonthlyCost}.99/month when billed annually
          </p>
        )}
        
        {interval === 'month' && (
          <p className="text-sm text-gray-500 mt-2">
            Billed monthly
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {pricing.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <button
          disabled
          className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-semibold cursor-not-allowed"
        >
          Current Plan
        </button>
      ) : (
        <button
          onClick={() => onCheckout(pricing.priceId)}
          disabled={isLoading}
          className={`
            w-full py-3 px-6 rounded-lg font-semibold transition-all
            ${interval === 'year'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? 'Processing...' : 'Get Started'}
        </button>
      )}

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          {interval === 'month' ? '7-day free trial' : 'No trial for annual billing'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Cancel anytime • No setup fees
        </p>
      </div>
    </div>
  )
}