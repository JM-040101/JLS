import { test, expect, type Page } from '@playwright/test'
import { loginUser } from './auth.spec'

const STRIPE_TEST_CARD = '4242424242424242'
const STRIPE_TEST_CARD_CVC = '123'
const STRIPE_TEST_CARD_EXPIRY = '12/30'

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
  })

  test('should display pricing page with plans', async ({ page }) => {
    await page.goto('/pricing')
    
    // Check pricing page elements
    await expect(page.locator('h1')).toContainText('Choose Your Plan')
    
    // Check for pricing cards
    const pricingCards = page.locator('[data-testid="pricing-card"]')
    await expect(pricingCards).toHaveCount(3) // Free, Pro, Enterprise
    
    // Check Free plan
    const freePlan = pricingCards.filter({ hasText: 'Free' })
    await expect(freePlan).toContainText('£0')
    await expect(freePlan).toContainText('1 blueprint per month')
    
    // Check Pro plan
    const proPlan = pricingCards.filter({ hasText: 'Pro' })
    await expect(proPlan).toContainText('£14.99')
    await expect(proPlan).toContainText('Unlimited blueprints')
    
    // Check Enterprise plan
    const enterprisePlan = pricingCards.filter({ hasText: 'Enterprise' })
    await expect(enterprisePlan).toContainText('Contact us')
  })

  test('should toggle between monthly and annual billing', async ({ page }) => {
    await page.goto('/pricing')
    
    // Check billing toggle
    const billingToggle = page.locator('[data-testid="billing-toggle"]')
    await expect(billingToggle).toBeVisible()
    
    // Default should be monthly
    await expect(page.locator('text="Monthly"')).toHaveAttribute('aria-selected', 'true')
    
    // Switch to annual
    await page.click('button:has-text("Annual")')
    
    // Prices should update to show discount
    const proPlan = page.locator('[data-testid="pricing-card"]:has-text("Pro")')
    await expect(proPlan).toContainText('£12.74') // 15% discount
    await expect(proPlan).toContainText('Save 15%')
  })

  test('should initiate Stripe checkout for Pro plan', async ({ page }) => {
    await page.goto('/pricing')
    
    // Click upgrade on Pro plan
    const proCard = page.locator('[data-testid="pricing-card"]:has-text("Pro")')
    await proCard.locator('button:has-text("Get Started")').click()
    
    // Should redirect to Stripe checkout or show checkout modal
    await page.waitForURL(/checkout|stripe/, { timeout: 10000 })
    
    // If using Stripe hosted checkout
    if (page.url().includes('checkout.stripe.com')) {
      // Verify Stripe checkout page loaded
      await expect(page.locator('text="Subscribe to Pro"')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('text="£14.99 per month"')).toBeVisible()
    } else {
      // If using embedded checkout
      await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible()
    }
  })

  test('should complete payment with test card', async ({ page }) => {
    await page.goto('/pricing')
    
    // Start checkout
    const proCard = page.locator('[data-testid="pricing-card"]:has-text("Pro")')
    await proCard.locator('button:has-text("Get Started")').click()
    
    // Handle Stripe checkout
    if (page.url().includes('checkout.stripe.com')) {
      // Stripe hosted checkout
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="cardNumber"]', STRIPE_TEST_CARD)
      await page.fill('input[name="cardExpiry"]', STRIPE_TEST_CARD_EXPIRY)
      await page.fill('input[name="cardCvc"]', STRIPE_TEST_CARD_CVC)
      await page.fill('input[name="billingName"]', 'Test User')
      
      // Submit payment
      await page.click('button[type="submit"]')
      
      // Wait for success redirect
      await page.waitForURL('**/dashboard?success=true', { timeout: 30000 })
    } else {
      // Embedded checkout form
      await fillEmbeddedCheckout(page)
    }
    
    // Verify subscription activated
    await expect(page.locator('text="Payment successful"')).toBeVisible()
    await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Pro')
  })

  test('should handle VAT for EU customers', async ({ page }) => {
    await page.goto('/subscription/tax-settings')
    
    // Add VAT number
    await page.selectOption('select[name="country"]', 'DE') // Germany
    await page.fill('input[name="vatNumber"]', 'DE123456789')
    await page.click('button:has-text("Validate")')
    
    // Wait for validation
    await expect(page.locator('text="VAT Number Validated"')).toBeVisible({ timeout: 10000 })
    
    // Go to pricing
    await page.goto('/pricing')
    
    // Start checkout
    const proCard = page.locator('[data-testid="pricing-card"]:has-text("Pro")')
    await proCard.locator('button:has-text("Get Started")').click()
    
    // Should show VAT exemption for validated business
    await expect(page.locator('text=/reverse charge/i')).toBeVisible()
    await expect(page.locator('text="VAT: £0.00"')).toBeVisible()
  })

  test('should access billing portal for subscription management', async ({ page }) => {
    // Assuming user has active subscription
    await page.goto('/subscription')
    
    // Click manage subscription
    await page.click('button:has-text("Manage Subscription")')
    
    // Should redirect to Stripe billing portal
    await page.waitForURL(/billing.stripe.com|customer-portal/, { timeout: 10000 })
    
    // Verify portal elements
    if (page.url().includes('billing.stripe.com')) {
      await expect(page.locator('text="Billing portal"')).toBeVisible()
      await expect(page.locator('text="Update payment method"')).toBeVisible()
      await expect(page.locator('text="Cancel subscription"')).toBeVisible()
    }
  })

  test('should display subscription details and usage', async ({ page }) => {
    // Navigate to subscription page
    await page.goto('/subscription')
    
    // Check subscription details
    await expect(page.locator('h1')).toContainText('Subscription')
    
    // If user has subscription
    const subscriptionCard = page.locator('[data-testid="subscription-details"]')
    if (await subscriptionCard.isVisible()) {
      await expect(subscriptionCard).toContainText(/Pro|Free/)
      await expect(subscriptionCard).toContainText('Current Period')
      
      // Check usage metrics
      const usageCard = page.locator('[data-testid="subscription-usage"]')
      await expect(usageCard).toBeVisible()
      await expect(usageCard).toContainText('Blueprints Created')
      await expect(usageCard).toContainText('Exports Generated')
    } else {
      // No subscription - should show upgrade prompt
      await expect(page.locator('text="Upgrade to Pro"')).toBeVisible()
    }
  })

  test('should show billing history', async ({ page }) => {
    await page.goto('/subscription')
    
    // Click billing history tab
    await page.click('[data-testid="billing-history-tab"]')
    
    // Check for invoice table
    const invoiceTable = page.locator('[data-testid="invoice-table"]')
    await expect(invoiceTable).toBeVisible()
    
    // If there are invoices
    const invoiceRows = invoiceTable.locator('tbody tr')
    const count = await invoiceRows.count()
    
    if (count > 0) {
      // Check first invoice
      const firstInvoice = invoiceRows.first()
      await expect(firstInvoice).toContainText('£')
      await expect(firstInvoice.locator('a:has-text("Download")')).toBeVisible()
    } else {
      await expect(page.locator('text="No invoices yet"')).toBeVisible()
    }
  })

  test('should handle failed payment gracefully', async ({ page }) => {
    await page.goto('/pricing')
    
    // Start checkout with card that will fail
    const proCard = page.locator('[data-testid="pricing-card"]:has-text("Pro")')
    await proCard.locator('button:has-text("Get Started")').click()
    
    // Use declined test card
    const DECLINED_CARD = '4000000000000002'
    
    if (page.url().includes('checkout.stripe.com')) {
      await page.fill('input[name="cardNumber"]', DECLINED_CARD)
      await page.fill('input[name="cardExpiry"]', STRIPE_TEST_CARD_EXPIRY)
      await page.fill('input[name="cardCvc"]', STRIPE_TEST_CARD_CVC)
      
      await page.click('button[type="submit"]')
      
      // Should show error
      await expect(page.locator('text=/declined|insufficient funds/i')).toBeVisible({ timeout: 10000 })
    }
  })

  test('should enforce subscription limits for free plan', async ({ page }) => {
    // Assuming user is on free plan
    // Try to create second blueprint in same month
    
    await page.goto('/dashboard')
    
    // Check if limit warning appears
    const limitWarning = page.locator('[data-testid="plan-limit-warning"]')
    if (await limitWarning.isVisible()) {
      await expect(limitWarning).toContainText('1 blueprint per month')
      await expect(limitWarning.locator('a:has-text("Upgrade")')).toBeVisible()
    }
    
    // Try to start new blueprint when at limit
    const startButton = page.locator('button:has-text("Start New Blueprint")')
    if (await startButton.isDisabled()) {
      // Hover to see tooltip
      await startButton.hover()
      await expect(page.locator('text="Upgrade to Pro for unlimited blueprints"')).toBeVisible()
    }
  })

  test('should apply promo code at checkout', async ({ page }) => {
    await page.goto('/pricing')
    
    // Start checkout
    const proCard = page.locator('[data-testid="pricing-card"]:has-text("Pro")')
    await proCard.locator('button:has-text("Get Started")').click()
    
    // Look for promo code field
    const promoField = page.locator('input[name="promoCode"], input[placeholder*="promo"]')
    if (await promoField.isVisible()) {
      await promoField.fill('TESTPROMO20') // 20% off test code
      await page.click('button:has-text("Apply")')
      
      // Check discount applied
      await expect(page.locator('text="20% discount applied"')).toBeVisible()
      await expect(page.locator('text="£11.99"')).toBeVisible() // Discounted price
    }
  })
})

// Helper function for embedded checkout
async function fillEmbeddedCheckout(page: Page) {
  // Wait for Stripe iframe to load
  const stripeFrame = page.frameLocator('iframe[name*="stripe"], iframe[src*="stripe"]').first()
  
  // Fill card details
  await stripeFrame.locator('input[name="cardnumber"]').fill(STRIPE_TEST_CARD)
  await stripeFrame.locator('input[name="exp-date"]').fill(STRIPE_TEST_CARD_EXPIRY)
  await stripeFrame.locator('input[name="cvc"]').fill(STRIPE_TEST_CARD_CVC)
  await stripeFrame.locator('input[name="postal"]').fill('12345')
  
  // Submit form
  await page.click('button[type="submit"]:has-text("Subscribe")')
  
  // Wait for success
  await page.waitForURL('**/dashboard?success=true', { timeout: 30000 })
}