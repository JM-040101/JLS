import { type Page, type Route } from '@playwright/test'

export class APIMocks {
  private page: Page
  private mockConfig: any

  constructor(page: Page) {
    this.page = page
    this.mockConfig = this.loadMockConfig()
  }

  private loadMockConfig() {
    try {
      // Load mock config from test data
      return require('../test-data/mock-config.json')
    } catch {
      return {
        gpt5: { enabled: true },
        claude: { enabled: true },
        stripe: { enabled: true, testMode: true }
      }
    }
  }

  async setupAllMocks() {
    if (this.mockConfig.gpt5?.enabled) {
      await this.setupGPT5Mocks()
    }
    if (this.mockConfig.claude?.enabled) {
      await this.setupClaudeMocks()
    }
    if (this.mockConfig.stripe?.enabled) {
      await this.setupStripeMocks()
    }
  }

  async setupGPT5Mocks() {
    // Mock OpenAI API calls
    await this.page.route('**/api/openai/**', async (route: Route) => {
      const url = route.request().url()
      
      if (url.includes('/chat/completions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(this.getGPT5Response(route.request()))
        })
      } else {
        await route.continue()
      }
    })

    // Mock internal GPT-5 workflow API
    await this.page.route('**/api/workflow/gpt5', async (route: Route) => {
      const request = route.request()
      const body = request.postDataJSON()
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(this.getWorkflowGPT5Response(body))
      })
    })
  }

  async setupClaudeMocks() {
    // Mock Anthropic API calls
    await this.page.route('**/api/anthropic/**', async (route: Route) => {
      const url = route.request().url()
      
      if (url.includes('/messages')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(this.getClaudeResponse(route.request()))
        })
      } else {
        await route.continue()
      }
    })

    // Mock internal Claude processing API
    await this.page.route('**/api/process/claude', async (route: Route) => {
      const request = route.request()
      const body = request.postDataJSON()
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(this.getClaudeProcessingResponse(body))
      })
    })
  }

  async setupStripeMocks() {
    // Mock Stripe checkout session creation
    await this.page.route('**/api/stripe/checkout', async (route: Route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            checkoutUrl: 'https://checkout.stripe.com/test_session_123',
            sessionId: 'cs_test_' + Math.random().toString(36).substr(2, 9)
          })
        })
      } else {
        await route.continue()
      }
    })

    // Mock Stripe webhook
    await this.page.route('**/api/stripe/webhook', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ received: true })
      })
    })

    // Mock billing portal
    await this.page.route('**/api/stripe/portal', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: 'https://billing.stripe.com/test_portal_session'
        })
      })
    })
  }

  private getGPT5Response(request: any) {
    const body = request.postDataJSON()
    const phase = this.extractPhaseFromMessages(body.messages)
    
    return {
      id: 'chatcmpl-test-' + Date.now(),
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-5',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: this.getPhaseQuestion(phase)
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150
      }
    }
  }

  private getWorkflowGPT5Response(body: any) {
    const { phase, answer, context } = body
    
    return {
      success: true,
      phase: phase,
      response: {
        question: this.getPhaseQuestion(phase),
        followUp: this.getPhaseFollowUp(phase),
        validation: 'Your answer has been recorded successfully.',
        suggestions: this.getPhaseSuggestions(phase),
        nextPhase: phase < 12 ? phase + 1 : null
      },
      metadata: {
        tokensUsed: 150,
        processingTime: 1234,
        model: 'gpt-5-turbo'
      }
    }
  }

  private getClaudeResponse(request: any) {
    return {
      id: 'msg_test_' + Date.now(),
      type: 'message',
      role: 'assistant',
      content: [{
        type: 'text',
        text: 'This is a mocked Claude response for testing.'
      }],
      model: 'claude-3-sonnet-20240229',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 100,
        output_tokens: 50
      }
    }
  }

  private getClaudeProcessingResponse(body: any) {
    const { action, sessionData } = body
    
    if (action === 'generatePlan') {
      return {
        success: true,
        plan: {
          modules: [
            { name: 'Authentication', file: 'Claude-auth.md', size: 45000 },
            { name: 'API Layer', file: 'Claude-api.md', size: 48000 },
            { name: 'Database', file: 'Claude-database.md', size: 42000 },
            { name: 'UI Components', file: 'Claude-ui.md', size: 47000 },
            { name: 'Payments', file: 'Claude-payments.md', size: 44000 },
            { name: 'AI Integration', file: 'Claude-ai.md', size: 46000 }
          ],
          prompts: [
            'setup-authentication.md',
            'create-api-endpoints.md',
            'configure-database.md',
            'build-ui-components.md',
            'integrate-payments.md',
            'integrate-ai.md'
          ],
          readme: 'Generated README content for the project',
          claudeMd: 'Generated CLAUDE.md instructions'
        },
        metadata: {
          totalSize: 272000,
          moduleCount: 6,
          promptCount: 6,
          generationTime: 5432
        }
      }
    }
    
    return { success: true, message: 'Processed successfully' }
  }

  private getPhaseQuestion(phase: number): string {
    const questions = [
      'What specific problem does your SaaS solve?',
      'Who is your target audience and what are their pain points?',
      'What are the core features that will differentiate your product?',
      'How will users interact with your application?',
      'What technology stack will you use and why?',
      'How will you structure your data model?',
      'What API endpoints and integrations do you need?',
      'How will you ensure security and compliance?',
      'What is your monetization strategy?',
      'What is your go-to-market strategy?',
      'How will you grow and scale your user base?',
      'What metrics will you track to measure success?'
    ]
    
    return questions[phase - 1] || 'Please provide more details.'
  }

  private getPhaseFollowUp(phase: number): string {
    return `Can you elaborate more on your approach for phase ${phase}?`
  }

  private getPhaseSuggestions(phase: number): string[] {
    return [
      `Consider industry best practices for phase ${phase}`,
      `Research competitor approaches`,
      `Define clear success criteria`,
      `Document assumptions and risks`
    ]
  }

  private extractPhaseFromMessages(messages: any[]): number {
    // Extract phase number from conversation context
    const systemMessage = messages.find(m => m.role === 'system')
    if (systemMessage?.content) {
      const match = systemMessage.content.match(/phase (\d+)/i)
      if (match) return parseInt(match[1])
    }
    return 1
  }

  // Utility method to disable specific mocks
  async disableMock(service: 'gpt5' | 'claude' | 'stripe') {
    this.mockConfig[service].enabled = false
    await this.page.unroute(`**/api/${service}/**`)
  }

  // Utility method to add custom mock responses
  async addCustomResponse(pattern: string, response: any) {
    await this.page.route(pattern, async (route: Route) => {
      await route.fulfill({
        status: response.status || 200,
        contentType: response.contentType || 'application/json',
        body: typeof response.body === 'string' 
          ? response.body 
          : JSON.stringify(response.body)
      })
    })
  }

  // Method to simulate API errors
  async simulateError(pattern: string, errorCode: number = 500, errorMessage: string = 'Internal Server Error') {
    await this.page.route(pattern, async (route: Route) => {
      await route.fulfill({
        status: errorCode,
        contentType: 'application/json',
        body: JSON.stringify({
          error: errorMessage,
          code: errorCode
        })
      })
    })
  }

  // Method to simulate network delay
  async simulateDelay(pattern: string, delayMs: number) {
    await this.page.route(pattern, async (route: Route) => {
      await new Promise(resolve => setTimeout(resolve, delayMs))
      await route.continue()
    })
  }
}

export function setupAPIMocks(page: Page): APIMocks {
  const mocks = new APIMocks(page)
  return mocks
}