import { test, expect, type Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const TEST_USER_EMAIL = 'test@example.com'
const TEST_USER_PASSWORD = 'Test123456!'
const NEW_USER_EMAIL = 'newuser@example.com'
const NEW_USER_PASSWORD = 'NewUser123!'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page with sign up CTA', async ({ page }) => {
    // Check landing page elements
    await expect(page).toHaveTitle(/SaaS Blueprint Generator/)
    await expect(page.locator('h1')).toContainText('Transform Your SaaS Idea')
    
    // Check for main CTA buttons
    const signUpButton = page.locator('a:has-text("Get Started")')
    await expect(signUpButton).toBeVisible()
    
    const loginLink = page.locator('a:has-text("Sign In")')
    await expect(loginLink).toBeVisible()
  })

  test('should allow new user registration', async ({ page }) => {
    // Navigate to sign up page
    await page.click('a:has-text("Get Started")')
    await page.waitForURL('**/auth/signup')
    
    // Fill registration form
    await page.fill('input[name="email"]', NEW_USER_EMAIL)
    await page.fill('input[name="password"]', NEW_USER_PASSWORD)
    await page.fill('input[name="confirmPassword"]', NEW_USER_PASSWORD)
    await page.fill('input[name="fullName"]', 'New Test User')
    
    // Accept terms
    await page.check('input[name="acceptTerms"]')
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Create Account")')
    
    // Wait for redirect to dashboard or email verification
    await page.waitForURL(/\/(dashboard|verify-email)/, { timeout: 10000 })
    
    // If email verification required
    if (page.url().includes('verify-email')) {
      await expect(page.locator('text=/check your email/i')).toBeVisible()
    } else {
      // Check dashboard elements
      await expect(page.locator('h1')).toContainText('Dashboard')
    }
  })

  test('should validate registration form inputs', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Test email validation
    await page.fill('input[name="email"]', 'invalid-email')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=/valid email/i')).toBeVisible()
    
    // Test password validation
    await page.fill('input[name="email"]', 'valid@email.com')
    await page.fill('input[name="password"]', '123') // Too short
    await page.fill('input[name="confirmPassword"]', '123')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=/at least 8 characters/i')).toBeVisible()
    
    // Test password mismatch
    await page.fill('input[name="password"]', 'ValidPass123!')
    await page.fill('input[name="confirmPassword"]', 'DifferentPass123!')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=/passwords.*match/i')).toBeVisible()
  })

  test('should allow user login', async ({ page }) => {
    // Navigate to login page
    await page.click('a:has-text("Sign In")')
    await page.waitForURL('**/auth/login')
    
    // Fill login form
    await page.fill('input[name="email"]', TEST_USER_EMAIL)
    await page.fill('input[name="password"]', TEST_USER_PASSWORD)
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Sign In")')
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    await expect(page.locator('text=/dashboard/i')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Try invalid credentials
    await page.fill('input[name="email"]', 'wrong@email.com')
    await page.fill('input[name="password"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')
    
    // Check error message
    await expect(page.locator('text=/invalid.*credentials/i')).toBeVisible({ timeout: 5000 })
  })

  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Click forgot password link
    await page.click('a:has-text("Forgot password")')
    await page.waitForURL('**/auth/forgot-password')
    
    // Enter email
    await page.fill('input[name="email"]', TEST_USER_EMAIL)
    await page.click('button:has-text("Send Reset Link")')
    
    // Check confirmation message
    await expect(page.locator('text=/email.*sent/i')).toBeVisible()
  })

  test('should allow user logout', async ({ page }) => {
    // First login
    await loginUser(page)
    
    // Open user menu
    await page.click('[data-testid="user-menu"]')
    
    // Click logout
    await page.click('button:has-text("Sign Out")')
    
    // Verify redirect to home
    await page.waitForURL('/', { timeout: 5000 })
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible()
  })

  test('should persist session across page reloads', async ({ page, context }) => {
    // Login
    await loginUser(page)
    
    // Store cookies
    const cookies = await context.cookies()
    
    // Reload page
    await page.reload()
    
    // Should still be logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    await expect(page.url()).toContain('/dashboard')
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard')
    
    // Should redirect to login
    await page.waitForURL('**/auth/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test('should handle social login buttons', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Check for social login options
    const googleButton = page.locator('button:has-text("Continue with Google")')
    const githubButton = page.locator('button:has-text("Continue with GitHub")')
    
    // If social logins are configured, they should be visible
    const hasSocialLogins = await googleButton.isVisible() || await githubButton.isVisible()
    
    if (hasSocialLogins) {
      // Test Google OAuth flow (mocked)
      if (await googleButton.isVisible()) {
        await googleButton.click()
        // Would redirect to Google OAuth in real scenario
        await expect(page.url()).toContain('google')
      }
    }
  })
})

// Helper function to login
async function loginUser(page: Page, email = TEST_USER_EMAIL, password = TEST_USER_PASSWORD) {
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]:has-text("Sign In")')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

export { loginUser }