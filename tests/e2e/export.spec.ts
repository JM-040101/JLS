import { test, expect, type Page, type Download } from '@playwright/test'
import { loginUser } from './auth.spec'
import { setupAPIMocks } from './mocks/api-mocks'
import * as fs from 'fs'
import * as path from 'path'
import * as unzipper from 'unzipper'

test.describe('Export Functionality', () => {
  let mocks: ReturnType<typeof setupAPIMocks>

  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    mocks = setupAPIMocks(page)
    await mocks.setupAllMocks()
    
    // Login user
    await loginUser(page)
  })

  test('should complete workflow and generate export', async ({ page }) => {
    // Create a complete session first
    await createCompleteSession(page)
    
    // Navigate to completion page
    await page.goto('/workflow/test-session/complete')
    
    // Check export button is available
    const exportButton = page.locator('button:has-text("Generate Export")')
    await expect(exportButton).toBeVisible()
    
    // Click to generate export
    await exportButton.click()
    
    // Wait for export generation
    await expect(page.locator('text="Generating export..."')).toBeVisible()
    await expect(page.locator('text="Export ready!"')).toBeVisible({ timeout: 30000 })
    
    // Download button should appear
    const downloadButton = page.locator('button:has-text("Download Blueprint")')
    await expect(downloadButton).toBeVisible()
  })

  test('should download ZIP file with correct structure', async ({ page }) => {
    // Create complete session
    await createCompleteSession(page)
    await page.goto('/workflow/test-session/complete')
    
    // Generate export
    await page.click('button:has-text("Generate Export")')
    await page.waitForSelector('text="Export ready!"', { timeout: 30000 })
    
    // Start download
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Download Blueprint")')
    const download = await downloadPromise
    
    // Save and verify download
    const downloadPath = await download.path()
    expect(downloadPath).toBeTruthy()
    
    // Verify ZIP file structure
    const extractPath = path.join(__dirname, 'temp', 'export-test')
    await verifyZipStructure(downloadPath!, extractPath)
  })

  test('should generate ClaudeOps-compliant documentation', async ({ page }) => {
    await createCompleteSession(page)
    await page.goto('/workflow/test-session/complete')
    
    // Generate export
    await page.click('button:has-text("Generate Export")')
    await page.waitForSelector('text="Export ready!"', { timeout: 30000 })
    
    // Preview documentation
    await page.click('button:has-text("Preview Files")')
    
    // Check CLAUDE.md
    await page.click('[data-file="CLAUDE.md"]')
    const claudeMdContent = await page.locator('[data-testid="file-preview"]').textContent()
    expect(claudeMdContent).toContain('# CLAUDE.md')
    expect(claudeMdContent).toContain('MCP Servers:')
    expect(claudeMdContent).toContain('Module Structure')
    
    // Check README.md
    await page.click('[data-file="README.md"]')
    const readmeContent = await page.locator('[data-testid="file-preview"]').textContent()
    expect(readmeContent).toContain('# Test SaaS Project')
    expect(readmeContent).toContain('## Overview')
    expect(readmeContent).toContain('## Getting Started')
    
    // Verify module files are under 50KB
    const moduleFiles = await page.locator('[data-file*="Claude-"]').all()
    for (const file of moduleFiles) {
      const fileName = await file.getAttribute('data-file')
      const fileSize = await file.getAttribute('data-size')
      expect(parseInt(fileSize!)).toBeLessThan(51200) // 50KB in bytes
    }
  })

  test('should include executable Claude prompts', async ({ page }) => {
    await createCompleteSession(page)
    await page.goto('/workflow/test-session/complete')
    
    // Generate export
    await page.click('button:has-text("Generate Export")')
    await page.waitForSelector('text="Export ready!"', { timeout: 30000 })
    
    // Preview prompts
    await page.click('button:has-text("Preview Files")')
    await page.click('[data-testid="prompts-folder"]')
    
    // Check for prompt files
    const promptFiles = [
      'setup-authentication.md',
      'create-api-endpoints.md',
      'configure-database.md',
      'build-ui-components.md',
      'integrate-payments.md'
    ]
    
    for (const promptFile of promptFiles) {
      await expect(page.locator(`[data-file="${promptFile}"]`)).toBeVisible()
    }
    
    // Verify prompt content includes MCP references
    await page.click('[data-file="setup-authentication.md"]')
    const promptContent = await page.locator('[data-testid="file-preview"]').textContent()
    expect(promptContent).toContain('mcp__supabase')
    expect(promptContent).toContain('## Task:')
    expect(promptContent).toContain('## Context:')
  })

  test('should track export history', async ({ page }) => {
    // Generate first export
    await createCompleteSession(page)
    await page.goto('/workflow/test-session/complete')
    await page.click('button:has-text("Generate Export")')
    await page.waitForSelector('text="Export ready!"', { timeout: 30000 })
    
    // Navigate to export history
    await page.goto('/exports')
    
    // Check export appears in history
    await expect(page.locator('h1')).toContainText('Export History')
    const exportEntry = page.locator('[data-testid="export-entry"]').first()
    await expect(exportEntry).toBeVisible()
    await expect(exportEntry).toContainText('Test SaaS Project')
    await expect(exportEntry).toContainText('v1.0.0')
    
    // Check download and re-generate options
    await expect(exportEntry.locator('button:has-text("Download")')).toBeVisible()
    await expect(exportEntry.locator('button:has-text("Regenerate")')).toBeVisible()
  })

  test('should handle export versioning', async ({ page }) => {
    await createCompleteSession(page)
    await page.goto('/workflow/test-session/complete')
    
    // Generate v1.0.0
    await page.click('button:has-text("Generate Export")')
    await page.waitForSelector('text="Export ready!"', { timeout: 30000 })
    let versionText = await page.locator('[data-testid="export-version"]').textContent()
    expect(versionText).toContain('v1.0.0')
    
    // Make changes and regenerate
    await page.click('button:has-text("Update Blueprint")')
    await page.fill('textarea[name="updates"]', 'Added new feature requirements')
    await page.click('button:has-text("Save Updates")')
    
    // Generate v1.1.0
    await page.click('button:has-text("Generate Export")')
    await page.waitForSelector('text="Export ready!"', { timeout: 30000 })
    versionText = await page.locator('[data-testid="export-version"]').textContent()
    expect(versionText).toContain('v1.1.0')
  })

  test('should enforce export quotas', async ({ page }) => {
    // Check user's export quota
    await page.goto('/subscription')
    const quotaInfo = page.locator('[data-testid="export-quota"]')
    
    if (await quotaInfo.isVisible()) {
      const quotaText = await quotaInfo.textContent()
      const match = quotaText?.match(/(\d+) \/ (\d+)/)
      
      if (match) {
        const [, used, limit] = match
        
        // If at limit, should show upgrade prompt
        if (used === limit) {
          await page.goto('/workflow/test-session/complete')
          await page.click('button:has-text("Generate Export")')
          
          await expect(page.locator('text="Export limit reached"')).toBeVisible()
          await expect(page.locator('a:has-text("Upgrade to Pro")')).toBeVisible()
        }
      }
    }
  })

  test('should share export via public link', async ({ page }) => {
    await createCompleteSession(page)
    await page.goto('/workflow/test-session/complete')
    
    // Generate export
    await page.click('button:has-text("Generate Export")')
    await page.waitForSelector('text="Export ready!"', { timeout: 30000 })
    
    // Get shareable link
    await page.click('button:has-text("Share")')
    const shareModal = page.locator('[data-testid="share-modal"]')
    await expect(shareModal).toBeVisible()
    
    // Copy link
    const linkInput = shareModal.locator('input[readonly]')
    const shareLink = await linkInput.inputValue()
    expect(shareLink).toContain('/export/public/')
    
    // Test link in new context (simulating different user)
    const context = await page.context().browser()?.newContext()
    if (context) {
      const newPage = await context.newPage()
      await newPage.goto(shareLink)
      
      // Should show public export page
      await expect(newPage.locator('h1')).toContainText('Test SaaS Project')
      await expect(newPage.locator('button:has-text("Download")')).toBeVisible()
      
      await context.close()
    }
  })

  test('should export to Supabase storage', async ({ page }) => {
    await createCompleteSession(page)
    await page.goto('/workflow/test-session/complete')
    
    // Generate export with storage option
    await page.click('button:has-text("Export Options")')
    await page.check('input[name="saveToStorage"]')
    await page.click('button:has-text("Generate Export")')
    
    await page.waitForSelector('text="Export ready!"', { timeout: 30000 })
    
    // Verify storage URL
    const storageInfo = page.locator('[data-testid="storage-info"]')
    await expect(storageInfo).toBeVisible()
    await expect(storageInfo).toContainText('Stored in Supabase')
    
    // Check expiry date (30 days)
    await expect(storageInfo).toContainText('Expires in 30 days')
  })

  test('should handle export errors gracefully', async ({ page }) => {
    // Simulate Claude API error
    await mocks.simulateError('**/api/process/claude', 500, 'Claude service unavailable')
    
    await createCompleteSession(page)
    await page.goto('/workflow/test-session/complete')
    
    // Try to generate export
    await page.click('button:has-text("Generate Export")')
    
    // Should show error message
    await expect(page.locator('text="Failed to generate export"')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text="Please try again"')).toBeVisible()
    
    // Retry button should be available
    await expect(page.locator('button:has-text("Retry")')).toBeVisible()
  })
})

// Helper functions
async function createCompleteSession(page: Page) {
  // Navigate to dashboard and start new workflow
  await page.goto('/dashboard')
  await page.click('button:has-text("Start New Blueprint")')
  
  // Fill initial project info
  await page.fill('input[name="projectName"]', 'Test SaaS Project')
  await page.fill('textarea[name="projectDescription"]', 'A complete test project for export')
  await page.selectOption('select[name="industry"]', 'technology')
  await page.click('button:has-text("Begin Blueprint Creation")')
  
  // Quick complete all phases with mock data
  for (let i = 1; i <= 12; i++) {
    await page.waitForURL(`**/phase/${i}`, { timeout: 10000 })
    await page.fill('textarea[name="answer"]', `Mock answer for phase ${i}`)
    
    // Click next or complete
    if (i < 12) {
      await page.click('button:has-text("Next Phase")')
    } else {
      await page.click('button:has-text("Complete Blueprint")')
    }
  }
  
  // Wait for completion page
  await page.waitForURL('**/complete', { timeout: 10000 })
}

async function verifyZipStructure(zipPath: string, extractPath: string) {
  // Create extract directory
  if (!fs.existsSync(extractPath)) {
    fs.mkdirSync(extractPath, { recursive: true })
  }
  
  // Extract ZIP
  await new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .on('close', resolve)
      .on('error', reject)
  })
  
  // Verify expected structure
  const expectedFiles = [
    'README.md',
    'CLAUDE.md',
    'modules/Claude-auth.md',
    'modules/Claude-api.md',
    'modules/Claude-database.md',
    'modules/Claude-ui.md',
    'modules/Claude-payments.md',
    'prompts/setup-authentication.md',
    'prompts/create-api-endpoints.md'
  ]
  
  for (const file of expectedFiles) {
    const filePath = path.join(extractPath, file)
    expect(fs.existsSync(filePath)).toBeTruthy()
  }
  
  // Clean up
  fs.rmSync(extractPath, { recursive: true, force: true })
}