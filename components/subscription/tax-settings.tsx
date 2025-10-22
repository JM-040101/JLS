'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, AlertCircle, Building2, MapPin, FileText } from 'lucide-react'
import { EU_VAT_RATES } from '@/lib/stripe/vat'
import { useToast } from '@/lib/hooks/use-toast'

interface TaxSettingsProps {
  userId: string
}

interface TaxInfo {
  taxId?: string
  taxIdType?: string
  countryCode?: string
  companyName?: string
  validated?: boolean
  validatedAt?: Date
}

interface BillingAddress {
  id: string
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  isDefault: boolean
}

export function TaxSettings({ userId }: TaxSettingsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [taxInfo, setTaxInfo] = useState<TaxInfo | null>(null)
  const [billingAddresses, setBillingAddresses] = useState<BillingAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [vatNumber, setVatNumber] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('GB')
  const [newAddress, setNewAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'GB',
    isDefault: false
  })
  const [showAddressForm, setShowAddressForm] = useState(false)

  useEffect(() => {
    fetchTaxInfo()
  }, [userId])

  const fetchTaxInfo = async () => {
    try {
      const response = await fetch('/api/stripe/tax')
      if (response.ok) {
        const data = await response.json()
        setTaxInfo(data.taxInfo)
        setBillingAddresses(data.billingAddresses || [])
        
        if (data.taxInfo) {
          setVatNumber(data.taxInfo.taxId || '')
          setCompanyName(data.taxInfo.companyName || '')
          setSelectedCountry(data.taxInfo.countryCode || 'GB')
        }
      }
    } catch (error) {
      console.error('Failed to fetch tax info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateVAT = async () => {
    if (!vatNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a VAT number',
        variant: 'destructive'
      })
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch('/api/stripe/tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          vatNumber: vatNumber.toUpperCase().replace(/\s/g, '')
        })
      })

      const data = await response.json()
      
      if (data.validation.valid) {
        toast({
          title: 'Success',
          description: 'VAT number validated successfully'
        })
        setTaxInfo({
          ...taxInfo,
          taxId: vatNumber,
          validated: true,
          validatedAt: new Date(),
          countryCode: data.validation.country
        })
      } else {
        toast({
          title: 'Validation Failed',
          description: data.validation.message || 'Invalid VAT number',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to validate VAT number',
        variant: 'destructive'
      })
    } finally {
      setIsValidating(false)
    }
  }

  const saveAddress = async () => {
    if (!newAddress.line1 || !newAddress.city || !newAddress.postalCode) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/user/billing-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress)
      })

      if (response.ok) {
        const savedAddress = await response.json()
        setBillingAddresses([...billingAddresses, savedAddress])
        setShowAddressForm(false)
        setNewAddress({
          line1: '',
          line2: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'GB',
          isDefault: false
        })
        toast({
          title: 'Success',
          description: 'Billing address saved'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save billing address',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const removeVAT = async () => {
    if (!confirm('Are you sure you want to remove your VAT number?')) {
      return
    }

    try {
      const response = await fetch('/api/stripe/tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove' })
      })

      if (response.ok) {
        setTaxInfo(null)
        setVatNumber('')
        toast({
          title: 'Success',
          description: 'VAT number removed'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove VAT number',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* VAT Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            VAT Information
          </h2>
        </div>

        <div className="p-6">
          {taxInfo?.validated ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-green-800">
                      VAT Number Validated
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {taxInfo.taxId}
                    </p>
                    {taxInfo.companyName && (
                      <p className="text-sm text-green-700">
                        {taxInfo.companyName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={removeVAT}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Your VAT number has been validated and will be used for tax exemption on future invoices.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="vat" className="block text-sm font-medium text-gray-700 mb-1">
                  VAT Number
                </label>
                <div className="flex gap-3">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(EU_VAT_RATES).map(([code, info]) => (
                      <option key={code} value={code}>
                        {code} - {info.country}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    id="vat"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="Enter VAT number"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={validateVAT}
                    disabled={isValidating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isValidating ? 'Validating...' : 'Validate'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Example: GB123456789 or DE123456789
                </p>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  VAT Exemption for Businesses
                </h3>
                <p className="text-sm text-blue-800">
                  If you're a business customer in the EU with a valid VAT number, 
                  you may be eligible for VAT exemption through the reverse charge mechanism.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Billing Addresses */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Billing Addresses
            </h2>
            {!showAddressForm && (
              <button
                onClick={() => setShowAddressForm(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Add Address
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {showAddressForm ? (
            <div className="space-y-4 mb-6 p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={newAddress.line1}
                    onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={newAddress.line2}
                    onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <select
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(EU_VAT_RATES).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="default"
                  checked={newAddress.isDefault}
                  onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="default" className="ml-2 text-sm text-gray-700">
                  Set as default billing address
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveAddress}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Address'}
                </button>
                <button
                  onClick={() => setShowAddressForm(false)}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {billingAddresses.length === 0 && !showAddressForm ? (
            <p className="text-gray-500 text-center py-4">
              No billing addresses added yet
            </p>
          ) : (
            <div className="space-y-3">
              {billingAddresses.map((address) => (
                <div
                  key={address.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">
                        {address.line1}
                      </p>
                      {address.line2 && (
                        <p className="text-gray-600">{address.line2}</p>
                      )}
                      <p className="text-gray-600">
                        {address.city}, {address.state && `${address.state}, `}
                        {address.postalCode}
                      </p>
                      <p className="text-gray-600">{address.country}</p>
                    </div>
                    {address.isDefault && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VAT Rates Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            EU VAT Rates
          </h2>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Standard VAT rates applied based on your location:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {Object.entries(EU_VAT_RATES).slice(0, 6).map(([code, info]) => (
              <div key={code} className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">{code}</span>
                <span className="text-gray-600">{info.rate}%</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            VAT is automatically calculated and added to your invoice based on your location.
            Business customers with valid VAT numbers may be exempt.
          </p>
        </div>
      </div>
    </div>
  )
}