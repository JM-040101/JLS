// EU VAT Handling Utilities

import { stripe, TAX_CONFIG } from './config'

export interface TaxIdValidation {
  valid: boolean
  country?: string
  type?: string
  message?: string
}

export interface VATRate {
  country: string
  rate: number
  reducedRate?: number
}

// EU VAT rates (2024)
export const EU_VAT_RATES: Record<string, VATRate> = {
  'AT': { country: 'Austria', rate: 20, reducedRate: 10 },
  'BE': { country: 'Belgium', rate: 21, reducedRate: 6 },
  'BG': { country: 'Bulgaria', rate: 20, reducedRate: 9 },
  'HR': { country: 'Croatia', rate: 25, reducedRate: 5 },
  'CY': { country: 'Cyprus', rate: 19, reducedRate: 5 },
  'CZ': { country: 'Czech Republic', rate: 21, reducedRate: 10 },
  'DK': { country: 'Denmark', rate: 25 },
  'EE': { country: 'Estonia', rate: 22, reducedRate: 9 },
  'FI': { country: 'Finland', rate: 24, reducedRate: 10 },
  'FR': { country: 'France', rate: 20, reducedRate: 5.5 },
  'DE': { country: 'Germany', rate: 19, reducedRate: 7 },
  'GR': { country: 'Greece', rate: 24, reducedRate: 6 },
  'HU': { country: 'Hungary', rate: 27, reducedRate: 5 },
  'IE': { country: 'Ireland', rate: 23, reducedRate: 9 },
  'IT': { country: 'Italy', rate: 22, reducedRate: 4 },
  'LV': { country: 'Latvia', rate: 21, reducedRate: 5 },
  'LT': { country: 'Lithuania', rate: 21, reducedRate: 5 },
  'LU': { country: 'Luxembourg', rate: 17, reducedRate: 3 },
  'MT': { country: 'Malta', rate: 18, reducedRate: 5 },
  'NL': { country: 'Netherlands', rate: 21, reducedRate: 9 },
  'PL': { country: 'Poland', rate: 23, reducedRate: 5 },
  'PT': { country: 'Portugal', rate: 23, reducedRate: 6 },
  'RO': { country: 'Romania', rate: 19, reducedRate: 5 },
  'SK': { country: 'Slovakia', rate: 20, reducedRate: 10 },
  'SI': { country: 'Slovenia', rate: 22, reducedRate: 5 },
  'ES': { country: 'Spain', rate: 21, reducedRate: 4 },
  'SE': { country: 'Sweden', rate: 25, reducedRate: 6 },
  'GB': { country: 'United Kingdom', rate: 20, reducedRate: 5 }, // Post-Brexit
}

export class VATManager {
  // Validate VAT number
  async validateVATNumber(vatNumber: string): Promise<TaxIdValidation> {
    try {
      // Clean VAT number
      const cleanedVat = vatNumber.replace(/\s/g, '').toUpperCase()
      
      // Basic format validation
      if (!this.isValidVATFormat(cleanedVat)) {
        return {
          valid: false,
          message: 'Invalid VAT number format'
        }
      }

      // For production, you would call VIES API here
      // For now, we'll do basic validation
      const countryCode = cleanedVat.substring(0, 2)
      if (!EU_VAT_RATES[countryCode]) {
        return {
          valid: false,
          message: 'Country not in EU VAT system'
        }
      }

      return {
        valid: true,
        country: countryCode,
        type: 'eu_vat'
      }
    } catch (error) {
      return {
        valid: false,
        message: 'VAT validation failed'
      }
    }
  }

  // Add tax ID to customer
  async addTaxIdToCustomer(customerId: string, taxId: string, type: string = 'eu_vat'): Promise<void> {
    try {
      await stripe.customers.createTaxId(customerId, {
        type: type as any,
        value: taxId
      })
    } catch (error: any) {
      console.error('Failed to add tax ID:', error)
      throw new Error('Failed to add tax ID to customer')
    }
  }

  // Remove tax ID from customer
  async removeTaxIdFromCustomer(customerId: string, taxIdId: string): Promise<void> {
    try {
      await stripe.customers.deleteTaxId(customerId, taxIdId)
    } catch (error: any) {
      console.error('Failed to remove tax ID:', error)
      throw new Error('Failed to remove tax ID')
    }
  }

  // Get customer tax IDs
  async getCustomerTaxIds(customerId: string): Promise<any[]> {
    try {
      const taxIds = await stripe.customers.listTaxIds(customerId)
      return taxIds.data
    } catch (error: any) {
      console.error('Failed to get tax IDs:', error)
      return []
    }
  }

  // Calculate VAT amount
  calculateVAT(amount: number, countryCode: string, hasValidVATNumber: boolean = false): {
    vatRate: number
    vatAmount: number
    totalAmount: number
  } {
    // If valid VAT number for B2B, apply reverse charge (0% VAT)
    if (hasValidVATNumber && countryCode !== 'GB') {
      return {
        vatRate: 0,
        vatAmount: 0,
        totalAmount: amount
      }
    }

    // Get VAT rate for country
    const vatInfo = EU_VAT_RATES[countryCode]
    if (!vatInfo) {
      // Non-EU country or unknown
      return {
        vatRate: 0,
        vatAmount: 0,
        totalAmount: amount
      }
    }

    // Calculate VAT
    const vatRate = vatInfo.rate
    const vatAmount = Math.round(amount * (vatRate / 100))
    const totalAmount = amount + vatAmount

    return {
      vatRate,
      vatAmount,
      totalAmount
    }
  }

  // Get country from IP (for automatic tax calculation)
  async getCountryFromIP(ipAddress: string): Promise<string | null> {
    try {
      // In production, use a geolocation API
      // For now, return null (Stripe will handle it automatically)
      return null
    } catch (error) {
      console.error('Failed to get country from IP:', error)
      return null
    }
  }

  // Format VAT number for display
  formatVATNumber(vatNumber: string): string {
    const cleaned = vatNumber.replace(/\s/g, '').toUpperCase()
    const country = cleaned.substring(0, 2)
    const number = cleaned.substring(2)
    
    // Format based on country
    switch (country) {
      case 'GB':
        // GB 123 4567 89
        return `${country} ${number.substring(0, 3)} ${number.substring(3, 7)} ${number.substring(7)}`
      case 'DE':
        // DE 123456789
        return `${country} ${number}`
      case 'FR':
        // FR 12 345678901
        return `${country} ${number.substring(0, 2)} ${number.substring(2)}`
      default:
        return cleaned
    }
  }

  // Validate VAT number format
  private isValidVATFormat(vatNumber: string): boolean {
    // Basic regex patterns for EU VAT numbers
    const patterns: Record<string, RegExp> = {
      'AT': /^ATU\d{8}$/,
      'BE': /^BE0\d{9}$/,
      'BG': /^BG\d{9,10}$/,
      'CY': /^CY\d{8}[A-Z]$/,
      'CZ': /^CZ\d{8,10}$/,
      'DE': /^DE\d{9}$/,
      'DK': /^DK\d{8}$/,
      'EE': /^EE\d{9}$/,
      'EL': /^EL\d{9}$/,
      'GR': /^GR\d{9}$/,
      'ES': /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
      'FI': /^FI\d{8}$/,
      'FR': /^FR[A-Z0-9]{2}\d{9}$/,
      'GB': /^GB\d{9}$|^GB\d{12}$|^GBGD\d{3}$|^GBHA\d{3}$/,
      'HR': /^HR\d{11}$/,
      'HU': /^HU\d{8}$/,
      'IE': /^IE\d[A-Z0-9]\d{5}[A-Z]$|^IE\d{7}[A-Z]{2}$/,
      'IT': /^IT\d{11}$/,
      'LT': /^LT\d{9}$|^LT\d{12}$/,
      'LU': /^LU\d{8}$/,
      'LV': /^LV\d{11}$/,
      'MT': /^MT\d{8}$/,
      'NL': /^NL\d{9}B\d{2}$/,
      'PL': /^PL\d{10}$/,
      'PT': /^PT\d{9}$/,
      'RO': /^RO\d{2,10}$/,
      'SE': /^SE\d{12}$/,
      'SI': /^SI\d{8}$/,
      'SK': /^SK\d{10}$/
    }

    const countryCode = vatNumber.substring(0, 2)
    const pattern = patterns[countryCode]
    
    if (!pattern) {
      return false
    }

    return pattern.test(vatNumber)
  }

  // Generate tax invoice
  async generateTaxInvoice(invoiceId: string): Promise<{
    invoiceNumber: string
    vatNumber?: string
    subtotal: number
    vatAmount: number
    total: number
    taxRate: number
  }> {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId)
      
      const subtotal = invoice.subtotal
      const tax = invoice.tax || 0
      const total = invoice.total
      const taxRate = tax > 0 ? Math.round((tax / subtotal) * 100) : 0

      // Get customer VAT number if exists
      const customer = await stripe.customers.retrieve(invoice.customer as string)
      const taxIds = await stripe.customers.listTaxIds(invoice.customer as string)
      const vatNumber = taxIds.data.find(t => t.type === 'eu_vat')?.value

      return {
        invoiceNumber: invoice.number || invoiceId,
        vatNumber,
        subtotal: subtotal / 100,
        vatAmount: tax / 100,
        total: total / 100,
        taxRate
      }
    } catch (error: any) {
      console.error('Failed to generate tax invoice:', error)
      throw new Error('Failed to generate tax invoice')
    }
  }
}

// Export singleton instance
export const vatManager = new VATManager()