import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { vatManager } from '@/lib/stripe/vat'
import { stripe } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'validate': {
        // Validate VAT number
        const { vatNumber } = params
        if (!vatNumber) {
          return NextResponse.json({ error: 'VAT number required' }, { status: 400 })
        }

        const validation = await vatManager.validateVATNumber(vatNumber)
        
        if (validation.valid) {
          // Store validated VAT in database
          const { error: dbError } = await supabase
            .from('tax_information')
            .upsert({
              user_id: user.id,
              tax_id: vatNumber,
              tax_id_type: validation.type,
              country_code: validation.country,
              validated: true,
              validated_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (dbError) {
            console.error('Failed to store VAT info:', dbError)
          }

          // If user has Stripe customer ID, update their tax ID
          const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

          if (profile?.stripe_customer_id) {
            try {
              await vatManager.addTaxIdToCustomer(
                profile.stripe_customer_id,
                vatNumber,
                validation.type || 'eu_vat'
              )
            } catch (error) {
              console.error('Failed to add tax ID to Stripe:', error)
            }
          }
        }

        return NextResponse.json({ validation })
      }

      case 'calculate': {
        // Calculate VAT for amount
        const { amount, countryCode, hasValidVATNumber } = params
        
        if (!amount || !countryCode) {
          return NextResponse.json(
            { error: 'Amount and country code required' },
            { status: 400 }
          )
        }

        const calculation = vatManager.calculateVAT(
          amount,
          countryCode,
          hasValidVATNumber
        )

        return NextResponse.json({ calculation })
      }

      case 'remove': {
        // Remove VAT from customer
        const { taxIdId } = params
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .single()

        if (!profile?.stripe_customer_id) {
          return NextResponse.json(
            { error: 'No customer found' },
            { status: 404 }
          )
        }

        await vatManager.removeTaxIdFromCustomer(
          profile.stripe_customer_id,
          taxIdId
        )

        // Update database
        await supabase
          .from('tax_information')
          .delete()
          .eq('user_id', user.id)

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Tax API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tax information
    const { data: taxInfo, error: taxError } = await supabase
      .from('tax_information')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (taxError && taxError.code !== 'PGRST116') {
      console.error('Failed to fetch tax info:', taxError)
      return NextResponse.json(
        { error: 'Failed to fetch tax information' },
        { status: 500 }
      )
    }

    // Get Stripe tax IDs if customer exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let stripeTaxIds = []
    if (profile?.stripe_customer_id) {
      try {
        stripeTaxIds = await vatManager.getCustomerTaxIds(
          profile.stripe_customer_id
        )
      } catch (error) {
        console.error('Failed to fetch Stripe tax IDs:', error)
      }
    }

    // Get billing addresses
    const { data: addresses } = await supabase
      .from('billing_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    return NextResponse.json({
      taxInfo: taxInfo || null,
      stripeTaxIds,
      billingAddresses: addresses || []
    })
  } catch (error: any) {
    console.error('Tax API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}