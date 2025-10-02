// Stripe Webhook Handler

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, WEBHOOK_EVENTS } from '@/lib/stripe/config'
import { subscriptionManager } from '@/lib/stripe/subscription'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${error.message}` },
      { status: 400 }
    )
  }

  // Log webhook event
  await logWebhookEvent(event)

  try {
    // Handle different event types
    switch (event.type) {
      case WEBHOOK_EVENTS.CHECKOUT_COMPLETED:
        await handleCheckoutCompleted(event)
        break

      case WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
        await handleSubscriptionCreated(event)
        break

      case WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
        await handleSubscriptionUpdated(event)
        break

      case WEBHOOK_EVENTS.SUBSCRIPTION_DELETED:
        await handleSubscriptionDeleted(event)
        break

      case WEBHOOK_EVENTS.INVOICE_PAID:
        await handleInvoicePaid(event)
        break

      case WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        await handleInvoicePaymentFailed(event)
        break

      case WEBHOOK_EVENTS.PAYMENT_METHOD_ATTACHED:
        await handlePaymentMethodAttached(event)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    
    // Log error but return success to prevent Stripe retries for processing errors
    await logWebhookError(event, error)
    
    return NextResponse.json({ received: true })
  }
}

// Handle checkout session completed
async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session
  
  if (!session.customer || !session.subscription) {
    throw new Error('Invalid checkout session data')
  }

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userId = session.metadata?.userId

  if (!userId) {
    throw new Error('User ID not found in session metadata')
  }

  // Fetch full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  // Create or update subscription record
  await subscriptionManager.upsertSubscription({
    userId,
    customerId,
    subscriptionId: subscription.id,
    priceId: subscription.items.data[0].price.id,
    status: subscription.status as any,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined
  })

  // Send welcome email (optional)
  await sendWelcomeEmail(userId, session.customer_email || '')

  console.log(`✅ Checkout completed for user ${userId}`)
}

// Handle subscription created
async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  
  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
  const userId = customer.metadata?.userId

  if (!userId) {
    console.error('User ID not found in customer metadata')
    return
  }

  // Create subscription record
  await subscriptionManager.upsertSubscription({
    userId,
    customerId: subscription.customer as string,
    subscriptionId: subscription.id,
    priceId: subscription.items.data[0].price.id,
    status: subscription.status as any,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined
  })

  console.log(`✅ Subscription created for user ${userId}`)
}

// Handle subscription updated
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  
  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
  const userId = customer.metadata?.userId

  if (!userId) {
    console.error('User ID not found in customer metadata')
    return
  }

  // Update subscription record
  await subscriptionManager.upsertSubscription({
    userId,
    customerId: subscription.customer as string,
    subscriptionId: subscription.id,
    priceId: subscription.items.data[0].price.id,
    status: subscription.status as any,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : undefined,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined
  })

  // Handle specific status changes
  if (subscription.status === 'canceled') {
    await handleSubscriptionCancellation(userId)
  } else if (subscription.status === 'past_due') {
    await handlePastDueSubscription(userId)
  }

  console.log(`✅ Subscription updated for user ${userId}`)
}

// Handle subscription deleted
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  
  // Get user ID from customer metadata
  const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
  const userId = customer.metadata?.userId

  if (!userId) {
    console.error('User ID not found in customer metadata')
    return
  }

  // Mark subscription as cancelled
  await subscriptionManager.upsertSubscription({
    userId,
    customerId: subscription.customer as string,
    subscriptionId: subscription.id,
    priceId: subscription.items.data[0].price.id,
    status: 'canceled',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    canceledAt: new Date()
  })

  // Revoke access
  await revokeUserAccess(userId)

  console.log(`✅ Subscription cancelled for user ${userId}`)
}

// Handle invoice paid
async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  
  if (!invoice.subscription) {
    return // One-time payment, not a subscription
  }

  // Log successful payment
  const supabase = createSupabaseServerClient()
  await supabase
    .from('payment_history')
    .insert({
      stripe_invoice_id: invoice.id,
      customer_id: invoice.customer as string,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'paid',
      paid_at: new Date().toISOString()
    })

  console.log(`✅ Invoice paid: ${invoice.id}`)
}

// Handle invoice payment failed
async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  
  if (!invoice.subscription) {
    return
  }

  // Get customer and user
  const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer
  const userId = customer.metadata?.userId

  if (!userId) {
    return
  }

  // Send payment failure email
  await sendPaymentFailureEmail(userId, customer.email || '')

  // Log failed payment
  const supabase = createSupabaseServerClient()
  await supabase
    .from('payment_history')
    .insert({
      stripe_invoice_id: invoice.id,
      customer_id: invoice.customer as string,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      failed_at: new Date().toISOString()
    })

  console.log(`❌ Payment failed for user ${userId}`)
}

// Handle payment method attached
async function handlePaymentMethodAttached(event: Stripe.Event) {
  const paymentMethod = event.data.object as Stripe.PaymentMethod
  
  console.log(`✅ Payment method attached: ${paymentMethod.id}`)
  
  // Optionally update default payment method
  if (paymentMethod.customer) {
    await stripe.customers.update(paymentMethod.customer as string, {
      invoice_settings: {
        default_payment_method: paymentMethod.id
      }
    })
  }
}

// Helper functions

async function logWebhookEvent(event: Stripe.Event) {
  const supabase = createSupabaseServerClient()
  
  try {
    await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        type: event.type,
        data: event.data.object,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log webhook event:', error)
  }
}

async function logWebhookError(event: Stripe.Event, error: Error) {
  const supabase = createSupabaseServerClient()
  
  try {
    await supabase
      .from('webhook_errors')
      .insert({
        stripe_event_id: event.id,
        type: event.type,
        error_message: error.message,
        error_stack: error.stack,
        created_at: new Date().toISOString()
      })
  } catch (logError) {
    console.error('Failed to log webhook error:', logError)
  }
}

async function sendWelcomeEmail(userId: string, email: string) {
  // Implement email sending logic
  console.log(`Sending welcome email to ${email}`)
}

async function sendPaymentFailureEmail(userId: string, email: string) {
  // Implement email sending logic
  console.log(`Sending payment failure email to ${email}`)
}

async function handleSubscriptionCancellation(userId: string) {
  // Send cancellation email
  console.log(`Handling cancellation for user ${userId}`)
}

async function handlePastDueSubscription(userId: string) {
  // Send past due notification
  console.log(`Handling past due subscription for user ${userId}`)
}

async function revokeUserAccess(userId: string) {
  // Update user access level
  const supabase = createSupabaseServerClient()
  
  await supabase
    .from('profiles')
    .update({
      subscription_status: 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  console.log(`Access revoked for user ${userId}`)
}