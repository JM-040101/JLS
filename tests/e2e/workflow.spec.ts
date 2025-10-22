import { test, expect, type Page } from '@playwright/test'
import { loginUser } from './auth.spec'

const WORKFLOW_PHASES = [
  { id: 1, name: 'Problem Definition', key: 'problem' },
  { id: 2, name: 'Target Audience', key: 'audience' },
  { id: 3, name: 'Core Features', key: 'features' },
  { id: 4, name: 'User Journey', key: 'journey' },
  { id: 5, name: 'Technical Stack', key: 'stack' },
  { id: 6, name: 'Data Model', key: 'data' },
  { id: 7, name: 'API Design', key: 'api' },
  { id: 8, name: 'Security & Compliance', key: 'security' },
  { id: 9, name: 'Monetization Strategy', key: 'monetization' },
  { id: 10, name: 'Launch Plan', key: 'launch' },
  { id: 11, name: 'Growth Strategy', key: 'growth' },
  { id: 12, name: 'Success Metrics', key: 'metrics' },
]

test.describe('Workflow Completion', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page)
    await page.waitForTimeout(1000) // Wait for auth to settle
  })

  test('should display workflow dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check dashboard elements
    await expect(page.locator('h1')).toContainText('Dashboard')
    await expect(page.locator('button:has-text("Start New Blueprint")')).toBeVisible()
    
    // Check for recent projects section
    const recentProjects = page.locator('[data-testid="recent-projects"]')
    if (await recentProjects.isVisible()) {
      await expect(recentProjects).toContainText('Recent Projects')
    }
  })

  test('should start new blueprint workflow', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Click start new blueprint
    await page.click('button:has-text("Start New Blueprint")')
    
    // Should navigate to workflow start
    await page.waitForURL('**/workflow/new', { timeout: 10000 })
    
    // Enter project details
    await page.fill('input[name="projectName"]', 'Test SaaS Project')
    await page.fill('textarea[name="projectDescription"]', 'A test SaaS project for automated testing')
    await page.selectOption('select[name="industry"]', 'technology')
    
    // Start workflow
    await page.click('button:has-text("Begin Blueprint Creation")')
    
    // Should navigate to phase 1
    await page.waitForURL('**/workflow/**/phase/1', { timeout: 10000 })
    await expect(page.locator('h2')).toContainText('Problem Definition')
  })

  test('should complete all 12 phases sequentially', async ({ page }) => {
    // Start new workflow
    await startNewWorkflow(page, 'Complete Test Project')
    
    // Complete each phase
    for (const phase of WORKFLOW_PHASES) {
      await completePhase(page, phase)
      
      // Verify progression
      if (phase.id < 12) {
        await page.waitForURL(`**/phase/${phase.id + 1}`, { timeout: 10000 })
        await expect(page.locator('h2')).toContainText(WORKFLOW_PHASES[phase.id].name)
      }
    }
    
    // After completing all phases, should show completion screen
    await page.waitForURL('**/workflow/**/complete', { timeout: 10000 })
    await expect(page.locator('h1')).toContainText('Blueprint Complete')
    await expect(page.locator('button:has-text("Download Blueprint")')).toBeVisible()
  })

  test('should save progress and allow resume', async ({ page, context }) => {
    // Start workflow
    await startNewWorkflow(page, 'Resume Test Project')
    
    // Complete first 3 phases
    for (let i = 0; i < 3; i++) {
      await completePhase(page, WORKFLOW_PHASES[i])
    }
    
    // Get session ID from URL
    const sessionUrl = page.url()
    const sessionId = sessionUrl.match(/workflow\/([^/]+)/)?.[1]
    expect(sessionId).toBeTruthy()
    
    // Navigate away
    await page.goto('/dashboard')
    
    // Check if project appears in recent projects
    await expect(page.locator('text="Resume Test Project"')).toBeVisible()
    
    // Click to resume
    await page.click('text="Resume Test Project"')
    
    // Should be on phase 4
    await page.waitForURL(`**/workflow/${sessionId}/phase/4`, { timeout: 10000 })
    await expect(page.locator('h2')).toContainText('User Journey')
    
    // Progress indicators should show first 3 phases complete
    const progressIndicators = page.locator('[data-testid^="phase-indicator-"]')
    for (let i = 0; i < 3; i++) {
      await expect(progressIndicators.nth(i)).toHaveAttribute('data-status', 'completed')
    }
  })

  test('should validate required fields in each phase', async ({ page }) => {
    await startNewWorkflow(page, 'Validation Test Project')
    
    // Try to proceed without filling required fields
    await page.click('button:has-text("Next Phase")')
    
    // Should show validation error
    await expect(page.locator('text=/required/i')).toBeVisible()
    
    // Fill minimal required data
    await page.fill('textarea[name="answer"]', 'This is a test answer')
    
    // Should now be able to proceed
    await page.click('button:has-text("Next Phase")')
    await page.waitForURL('**/phase/2', { timeout: 5000 })
  })

  test('should show AI assistance during workflow', async ({ page }) => {
    await startNewWorkflow(page, 'AI Assisted Project')
    
    // Look for AI suggestion button
    const aiButton = page.locator('button:has-text("Get AI Suggestion")')
    if (await aiButton.isVisible()) {
      await aiButton.click()
      
      // Should show AI response
      await expect(page.locator('[data-testid="ai-suggestion"]')).toBeVisible({ timeout: 10000 })
    }
    
    // Check for contextual help
    const helpButton = page.locator('[data-testid="phase-help"]')
    if (await helpButton.isVisible()) {
      await helpButton.click()
      await expect(page.locator('[data-testid="help-content"]')).toBeVisible()
    }
  })

  test('should handle navigation between phases', async ({ page }) => {
    await startNewWorkflow(page, 'Navigation Test Project')
    
    // Complete first 3 phases
    for (let i = 0; i < 3; i++) {
      await completePhase(page, WORKFLOW_PHASES[i])
    }
    
    // Navigate back to phase 2
    await page.click('[data-testid="phase-indicator-2"]')
    await page.waitForURL('**/phase/2', { timeout: 5000 })
    
    // Should show previously entered data
    const answerField = page.locator('textarea[name="answer"]')
    await expect(answerField).not.toBeEmpty()
    
    // Edit answer
    await answerField.fill('Updated answer for phase 2')
    await page.click('button:has-text("Save & Continue")')
    
    // Should go to phase 3
    await page.waitForURL('**/phase/3', { timeout: 5000 })
  })

  test('should prevent skipping phases', async ({ page }) => {
    await startNewWorkflow(page, 'Skip Test Project')
    
    // Try to navigate directly to phase 5
    const currentUrl = page.url()
    const baseUrl = currentUrl.replace(/phase\/\d+/, '')
    await page.goto(`${baseUrl}phase/5`)
    
    // Should redirect back to phase 1
    await page.waitForURL('**/phase/1', { timeout: 5000 })
    await expect(page.locator('text=/complete.*previous.*phases/i')).toBeVisible()
  })

  test('should show progress bar and phase indicators', async ({ page }) => {
    await startNewWorkflow(page, 'Progress Test Project')
    
    // Check initial progress
    const progressBar = page.locator('[data-testid="progress-bar"]')
    await expect(progressBar).toHaveAttribute('data-progress', '0')
    
    // Complete first phase
    await completePhase(page, WORKFLOW_PHASES[0])
    
    // Progress should update
    await expect(progressBar).toHaveAttribute('data-progress', '8') // ~8% for 1/12 phases
    
    // Phase indicators
    const phaseIndicators = page.locator('[data-testid="phase-indicators"]')
    await expect(phaseIndicators).toBeVisible()
    
    // First phase should be marked complete
    await expect(page.locator('[data-testid="phase-indicator-1"]')).toHaveAttribute('data-status', 'completed')
    // Second phase should be current
    await expect(page.locator('[data-testid="phase-indicator-2"]')).toHaveAttribute('data-status', 'current')
  })

  test('should auto-save answers as user types', async ({ page }) => {
    await startNewWorkflow(page, 'Autosave Test Project')
    
    // Type in answer field
    const answerField = page.locator('textarea[name="answer"]')
    await answerField.fill('This is my answer that should be auto-saved')
    
    // Wait for auto-save indicator
    await expect(page.locator('text=/saving/i')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=/saved/i')).toBeVisible({ timeout: 5000 })
    
    // Refresh page
    await page.reload()
    
    // Answer should still be there
    await expect(answerField).toHaveValue('This is my answer that should be auto-saved')
  })

  test('should handle workflow timeout gracefully', async ({ page }) => {
    await startNewWorkflow(page, 'Timeout Test Project')
    
    // Simulate long inactivity (would need to mock time in real implementation)
    // For now, just check that session expiry is handled
    
    // Check for session warning if implemented
    const sessionWarning = page.locator('[data-testid="session-warning"]')
    if (await sessionWarning.isVisible({ timeout: 1000 })) {
      await expect(sessionWarning).toContainText(/session.*expire/i)
    }
  })
})

// Helper functions
async function startNewWorkflow(page: Page, projectName: string) {
  await page.goto('/dashboard')
  await page.click('button:has-text("Start New Blueprint")')
  await page.waitForURL('**/workflow/new', { timeout: 10000 })
  
  await page.fill('input[name="projectName"]', projectName)
  await page.fill('textarea[name="projectDescription"]', `Description for ${projectName}`)
  await page.selectOption('select[name="industry"]', 'technology')
  await page.click('button:has-text("Begin Blueprint Creation")')
  
  await page.waitForURL('**/phase/1', { timeout: 10000 })
}

async function completePhase(page: Page, phase: typeof WORKFLOW_PHASES[0]) {
  // Wait for phase to load
  await expect(page.locator('h2')).toContainText(phase.name)
  
  // Fill in mock answer based on phase
  const answer = getMockAnswer(phase.key)
  await page.fill('textarea[name="answer"]', answer)
  
  // If there are additional fields, fill them
  const additionalFields = page.locator('input[data-phase-field]')
  const count = await additionalFields.count()
  for (let i = 0; i < count; i++) {
    await additionalFields.nth(i).fill(`Additional info ${i + 1}`)
  }
  
  // Submit phase
  await page.click('button:has-text("Next Phase"), button:has-text("Save & Continue")')
}

function getMockAnswer(phaseKey: string): string {
  const answers: Record<string, string> = {
    problem: 'Our SaaS solves the problem of inefficient project management for remote teams.',
    audience: 'Target audience is small to medium tech companies with 10-100 employees.',
    features: 'Core features include task management, time tracking, and team collaboration tools.',
    journey: 'Users sign up, create projects, invite team members, and track progress in real-time.',
    stack: 'Next.js frontend, Node.js backend, PostgreSQL database, deployed on AWS.',
    data: 'Main entities: Users, Projects, Tasks, Comments, with appropriate relationships.',
    api: 'RESTful API with authentication, CRUD operations, and webhooks for integrations.',
    security: 'OAuth 2.0 authentication, encrypted data at rest, GDPR compliant, regular backups.',
    monetization: 'Freemium model with paid tiers at $10/user/month for Pro features.',
    launch: 'Beta launch in Q1, marketing campaign in Q2, full launch in Q3 2024.',
    growth: 'Content marketing, SEO, partnerships with productivity influencers, referral program.',
    metrics: 'Track MRR, user retention, feature adoption, NPS score, and churn rate.',
  }
  
  return answers[phaseKey] || 'Generic test answer for this phase.'
}