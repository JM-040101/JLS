'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Download, CheckCircle, XCircle, Clock } from 'lucide-react'

interface BillingHistoryProps {
  userId: string
}

interface Invoice {
  id: string
  amount: number
  currency: string
  status: 'paid' | 'failed' | 'pending'
  createdAt: Date
  invoiceUrl?: string
  invoicePdf?: string
}

export function BillingHistory({ userId }: BillingHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [userId])

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/stripe/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return null
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase()
    })
    return formatter.format(amount / 100)
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Billing History</h2>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No billing history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(invoice.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formatAmount(invoice.amount, invoice.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {invoice.invoicePdf && (
                  <a
                    href={invoice.invoicePdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Download invoice"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tax Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Tax Information</h3>
          <p className="text-xs text-gray-600">
            VAT is automatically calculated based on your location. 
            Business customers can add their VAT number in the billing portal for tax exemption.
          </p>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-2">
            Manage Tax Settings →
          </button>
        </div>
      </div>
    </div>
  )
}