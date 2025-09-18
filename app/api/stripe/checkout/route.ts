// Stripe Checkout Session API

import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICING, CHECKOUT_CONFIG, TAX_CONFIG } from '@/lib/stripe/config'
import { subscriptionManager } from '@/lib/stripe/subscription'
import { vatManager } from '@/lib/stripe/vat'
import { createSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { priceId, interval = 'month', successUrl, cancelUrl } = body

    // Validate price ID
    const validPrices = [
      PRICING.PRO_MONTHLY.priceId,
      PRICING.PRO_ANNUAL.priceId
    ]
    
    if (!priceId || !validPrices.includes(priceId)) {
      return NextResponse.json(
        { error: 'Invalid price selected' },
        { status: 400 }
      )
    }

    // Check if user already has an active subscription
    const existingSubscription = await subscriptionManager.getSubscriptionByUserId(user.id)
    if (existingSubscription && await subscriptionManager.isSubscriptionActive(user.id)) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const customerId = await subscriptionManager.getOrCreateStripeCustomer(
      user.id,
      user.email || ''
    )

    // Check for existing VAT information
    const { data: taxInfo } = await supabase
      .from('tax_information')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If user has a validated VAT number, add it to the customer
    if (taxInfo?.validated && taxInfo.tax_id) {
      try {
        await vatManager.addTaxIdToCustomer(
          customerId,
          taxInfo.tax_id,
          taxInfo.tax_id_type || 'eu_vat'
        )
      } catch (error) {
        console.error('Failed to add tax ID to customer:', error)
        // Continue without tax ID - not a blocking error
      }
    }

    // Prepare customer update data
    const customerUpdate: any = CHECKOUT_CONFIG.customerUpdate
    
    // If we have tax info, include it in customer update
    if (taxInfo?.company_name) {
      customerUpdate.name = 'required'
    }
    
    if (taxInfo?.company_address) {
      customerUpdate.address = 'required'
    }

    // Create checkout session with dynamic tax settings
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: CHECKOUT_CONFIG.mode,
      payment_method_types: CHECKOUT_CONFIG.paymentMethodTypes,
      billing_address_collection: CHECKOUT_CONFIG.billingAddressCollection,
      customer_update: customerUpdate,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      subscription_data: {
        metadata: {
          userId: user.id
        },
        trial_period_days: interval === 'month' ? 7 : undefined // 7-day trial for monthly only
      },
      automatic_tax: {
        enabled: TAX_CONFIG.automaticTax
      },
      tax_id_collection: {
        enabled: TAX_CONFIG.collectTaxId
      },
      customer_tax_exempt: taxInfo?.validated && taxInfo.country_code !== 'GB' ? 'reverse' : 'none',
      allow_promotion_codes: CHECKOUT_CONFIG.allowPromotionCodes,
      locale: CHECKOUT_CONFIG.locale,
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
      metadata: {
        userId: user.id,
        priceId,
        interval,
        hasVAT: taxInfo?.validated ? 'true' : 'false',
        vatCountry: taxInfo?.country_code || ''
      }
    })

    // Log checkout session creation
    await logCheckoutSession(user.id, session.id, priceId)

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id
    })

  } catch (error: any) {
    console.error('Checkout session error:', error)
    
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    )
  }
}

// Get checkout session status
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session ID from query params
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    })

    // Verify session belongs to user
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Return session status
    return NextResponse.json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
      subscription: session.subscription ? {
        id: (session.subscription as any).id,
        status: (session.subscription as any).status,
        currentPeriodEnd: (session.subscription as any).current_period_end
      } : null
    })

  } catch (error: any) {
    console.error('Get session error:', error)
    
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    )
  }
}

async function logCheckoutSession(userId: string, sessionId: string, priceId: string) {
  const supabase = createSupabaseClient()
  
  try {
    await supabase
      .from('checkout_sessions')
      .insert({
        user_id: userId,
        stripe_session_id: sessionId,
        price_id: priceId,
        status: 'pending',
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log checkout session:', error)
  }
}