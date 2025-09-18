import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe/config'
import { vatManager } from '@/lib/stripe/vat'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoice_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get user's Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ invoices: [] })
    }

    if (invoiceId) {
      // Get specific invoice with tax details
      const invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ['customer', 'subscription', 'customer_tax_ids']
      })

      // Verify invoice belongs to user
      if (invoice.customer !== profile.stripe_customer_id) {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        )
      }

      // Generate tax invoice data
      const taxInvoice = await vatManager.generateTaxInvoice(invoiceId)

      return NextResponse.json({
        invoice: {
          id: invoice.id,
          number: invoice.number,
          amount: invoice.total,
          currency: invoice.currency,
          status: invoice.status,
          created: invoice.created,
          pdf: invoice.invoice_pdf,
          hosted_invoice_url: invoice.hosted_invoice_url,
          tax_details: taxInvoice,
          lines: invoice.lines.data.map(line => ({
            description: line.description,
            amount: line.amount,
            currency: line.currency,
            quantity: line.quantity
          }))
        }
      })
    } else {
      // List invoices
      const invoices = await stripe.invoices.list({
        customer: profile.stripe_customer_id,
        limit,
        expand: ['data.subscription']
      })

      // Store invoices in database for history tracking
      for (const invoice of invoices.data) {
        if (invoice.status === 'paid' && invoice.id) {
          await supabase
            .from('payment_history')
            .upsert({
              stripe_invoice_id: invoice.id,
              customer_id: profile.stripe_customer_id,
              user_id: user.id,
              amount: invoice.total,
              currency: invoice.currency,
              status: 'paid',
              description: invoice.description || `Invoice ${invoice.number}`,
              invoice_url: invoice.hosted_invoice_url,
              invoice_pdf: invoice.invoice_pdf,
              paid_at: invoice.status_transitions?.paid_at 
                ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
                : new Date(invoice.created * 1000).toISOString(),
              created_at: new Date(invoice.created * 1000).toISOString()
            }, {
              onConflict: 'stripe_invoice_id'
            })
        }
      }

      return NextResponse.json({
        invoices: invoices.data.map(invoice => ({
          id: invoice.id,
          amount: invoice.total,
          currency: invoice.currency,
          status: invoice.status,
          createdAt: new Date(invoice.created * 1000).toISOString(),
          invoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf
        }))
      })
    }
  } catch (error: any) {
    console.error('Invoice API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, invoiceId } = body

    // Get user's Stripe customer ID
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

    switch (action) {
      case 'download_tax_invoice': {
        // Generate tax-compliant invoice PDF
        const invoice = await stripe.invoices.retrieve(invoiceId, {
          expand: ['customer', 'customer_tax_ids']
        })

        // Verify invoice belongs to user
        if (invoice.customer !== profile.stripe_customer_id) {
          return NextResponse.json(
            { error: 'Invoice not found' },
            { status: 404 }
          )
        }

        // Get tax details
        const taxDetails = await vatManager.generateTaxInvoice(invoiceId)

        // Generate invoice HTML (simplified version)
        const invoiceHtml = generateInvoiceHtml(invoice, taxDetails)

        return NextResponse.json({
          success: true,
          html: invoiceHtml,
          pdfUrl: invoice.invoice_pdf
        })
      }

      case 'send_invoice': {
        // Send invoice to customer email
        const invoice = await stripe.invoices.sendInvoice(invoiceId)
        
        return NextResponse.json({
          success: true,
          message: 'Invoice sent successfully'
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Invoice action error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateInvoiceHtml(
  invoice: any,
  taxDetails: any
): string {
  const invoiceDate = format(new Date(invoice.created * 1000), 'MMMM d, yyyy')
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.number}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    .header { margin-bottom: 40px; }
    .company-name { font-size: 24px; font-weight: bold; }
    .invoice-title { font-size: 32px; margin-top: 20px; }
    .invoice-details { margin: 20px 0; }
    .invoice-meta { display: flex; justify-content: space-between; margin: 30px 0; }
    table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: bold; }
    .totals { text-align: right; margin-top: 30px; }
    .total-row { display: flex; justify-content: space-between; max-width: 300px; margin-left: auto; padding: 8px 0; }
    .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #000; padding-top: 12px; }
    .vat-info { margin-top: 40px; padding: 20px; background: #f9f9f9; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">Your Company Name</div>
    <div class="invoice-title">INVOICE</div>
  </div>
  
  <div class="invoice-meta">
    <div>
      <strong>Invoice Number:</strong> ${invoice.number}<br>
      <strong>Date:</strong> ${invoiceDate}<br>
      <strong>Status:</strong> ${invoice.status?.toUpperCase()}
    </div>
    <div>
      <strong>Bill To:</strong><br>
      ${invoice.customer_email || 'Customer'}<br>
      ${taxDetails.vatNumber ? `VAT: ${taxDetails.vatNumber}<br>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.lines.data.map((line: any) => `
        <tr>
          <td>${line.description}</td>
          <td>${line.quantity}</td>
          <td>£${(line.unit_amount / 100).toFixed(2)}</td>
          <td>£${(line.amount / 100).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>£${taxDetails.subtotal.toFixed(2)}</span>
    </div>
    ${taxDetails.vatAmount > 0 ? `
      <div class="total-row">
        <span>VAT (${taxDetails.taxRate}%):</span>
        <span>£${taxDetails.vatAmount.toFixed(2)}</span>
      </div>
    ` : ''}
    <div class="total-row grand-total">
      <span>Total:</span>
      <span>£${taxDetails.total.toFixed(2)}</span>
    </div>
  </div>

  ${taxDetails.vatNumber ? `
    <div class="vat-info">
      <strong>VAT Information</strong><br>
      Customer VAT Number: ${taxDetails.vatNumber}<br>
      ${taxDetails.taxRate === 0 ? 'Reverse charge applies - VAT to be accounted for by the recipient' : ''}
    </div>
  ` : ''}
</body>
</html>
  `
}