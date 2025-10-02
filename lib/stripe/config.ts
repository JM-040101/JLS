// Stripe Configuration

import Stripe from 'stripe'

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  appInfo: {
    name: 'SaaS Blueprint Generator',
    version: '1.0.0'
  }
})

// Pricing configuration
export const PRICING = {
  PRO_MONTHLY: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY || '',
    amount: 1499, // £14.99 in pence
    currency: 'gbp',
    interval: 'month' as const,
    name: 'Pro Monthly',
    description: 'Full access to blueprint generator',
    features: [
      'Unlimited blueprint generation',
      'All 12 phases included',
      'Export to Claude Code',
      'Priority support',
      'Custom modules',
      'Team collaboration'
    ]
  },
  PRO_ANNUAL: {
    priceId: process.env.STRIPE_PRICE_ID_ANNUAL || '',
    amount: 12999, // £129.99 in pence (15% discount)
    currency: 'gbp',
    interval: 'year' as const,
    name: 'Pro Annual',
    description: 'Full access with annual discount',
    features: [
      'Everything in monthly',
      'Save 15% annually',
      'Priority onboarding',
      'Custom integrations'
    ]
  }
}

// Subscription statuses
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  TRIALING: 'trialing',
  PAST_DUE: 'past_due',
  CANCELLED: 'canceled',
  UNPAID: 'unpaid',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired'
} as const

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS]

// Grace period in days for failed payments
export const GRACE_PERIOD_DAYS = 3

// Webhook events we handle
export const WEBHOOK_EVENTS = {
  CHECKOUT_COMPLETED: 'checkout.session.completed',
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  PAYMENT_METHOD_ATTACHED: 'payment_method.attached'
} as const

// Tax configuration for EU VAT
export const TAX_CONFIG = {
  automaticTax: true,
  collectTaxId: true,
  taxBehavior: 'exclusive' as const,
  taxIdTypes: [
    'eu_vat',     // EU VAT number
    'gb_vat',     // UK VAT number
    'ch_vat',     // Swiss VAT
    'no_vat',     // Norwegian VAT
    'nz_gst',     // New Zealand GST
    'au_abn',     // Australian ABN
    'in_gst',     // Indian GST
    'ca_bn',      // Canadian BN
    'sg_gst',     // Singapore GST
    'ae_trn'      // UAE TRN
  ]
}

// Stripe Checkout configuration
export const CHECKOUT_CONFIG = {
  mode: 'subscription' as const,
  paymentMethodTypes: ['card'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
  billingAddressCollection: 'required' as const,
  customerUpdate: {
    address: 'auto' as const,
    name: 'auto' as const
  },
  taxIdCollection: {
    enabled: true
  },
  automaticTax: {
    enabled: true
  },
  phoneNumberCollection: {
    enabled: false
  },
  shippingAddressCollection: undefined,
  allowPromotionCodes: true,
  locale: 'auto' as const
}

// Customer portal configuration
export const PORTAL_CONFIG = {
  features: {
    customerUpdate: {
      enabled: true,
      allowedUpdates: ['email', 'tax_id', 'address']
    },
    invoiceHistory: {
      enabled: true
    },
    paymentMethodUpdate: {
      enabled: true
    },
    subscriptionCancel: {
      enabled: true,
      mode: 'at_period_end' as const,
      cancellationReason: {
        enabled: true,
        options: [
          'too_expensive',
          'missing_features',
          'switched_service',
          'unused',
          'customer_service',
          'too_complex',
          'low_quality',
          'other'
        ]
      }
    },
    subscriptionPause: {
      enabled: false
    }
  }
}

// Error messages
export const ERROR_MESSAGES = {
  PAYMENT_REQUIRED: 'Please update your payment method to continue',
  SUBSCRIPTION_EXPIRED: 'Your subscription has expired. Please renew to continue.',
  INVALID_PRICE: 'Invalid price selected',
  CHECKOUT_ERROR: 'Unable to create checkout session. Please try again.',
  WEBHOOK_ERROR: 'Unable to process payment update',
  CUSTOMER_NOT_FOUND: 'Customer record not found',
  SUBSCRIPTION_NOT_FOUND: 'Subscription not found',
  INVALID_TAX_ID: 'Invalid tax ID provided'
}

// Success messages
export const SUCCESS_MESSAGES = {
  SUBSCRIPTION_CREATED: 'Welcome! Your subscription is now active.',
  SUBSCRIPTION_UPDATED: 'Your subscription has been updated.',
  SUBSCRIPTION_CANCELLED: 'Your subscription has been cancelled and will end at the current billing period.',
  PAYMENT_SUCCESSFUL: 'Payment successful!',
  TAX_ID_ADDED: 'Tax ID has been added to your account.'
}