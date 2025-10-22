// Stripe Customer Portal API

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { subscriptionManager } from '@/lib/stripe/subscription'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { returnUrl } = body

    // Get customer portal URL
    try {
      const portalUrl = await subscriptionManager.getCustomerPortalUrl(
        user.id,
        returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      )

      return NextResponse.json({ portalUrl })

    } catch (error: any) {
      // If no subscription exists, return error
      if (error.message === 'Subscription not found') {
        return NextResponse.json(
          { error: 'No active subscription found' },
          { status: 404 }
        )
      }
      throw error
    }

  } catch (error: any) {
    console.error('Portal session error:', error)
    
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}