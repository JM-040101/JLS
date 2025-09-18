// AI Client Implementation

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { 
  AIModel, 
  ChatMessage, 
  GenerationOptions, 
  AIError,
  AIMetrics 
} from './types'
import { COST_PER_TOKEN, RETRY_CONFIG, TIMEOUT_CONFIG } from './config'
import { logMetrics } from './metrics'
import { checkRateLimit } from './rate-limit'
import { getCachedResponse, setCachedResponse } from './cache'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  dangerouslyAllowBrowser: false
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export class AIClient {
  private userId: string
  private sessionId: string

  constructor(userId: string, sessionId: string) {
    this.userId = userId
    this.sessionId = sessionId
  }

  async generate(options: GenerationOptions): Promise<string> {
    // Check rate limits
    const rateLimitStatus = await checkRateLimit(this.userId)
    if (rateLimitStatus.blocked) {
      throw this.createError(
        'RATE_LIMIT',
        `Rate limit exceeded. Reset at ${rateLimitStatus.resetAt}`,
        true,
        rateLimitStatus.resetAt.getTime() - Date.now()
      )
    }

    // Check cache if enabled
    if (options.cacheKey) {
      const cached = await getCachedResponse(options.cacheKey)
      if (cached) {
        return cached
      }
    }

    // Perform generation with retries
    const startTime = Date.now()
    let lastError: Error | undefined
    
    for (let attempt = 0; attempt <= (options.maxRetries || RETRY_CONFIG.maxRetries); attempt++) {
      try {
        const response = await this.callModel(options)
        
        // Log metrics if tracking enabled
        if (options.trackCost !== false) {
          await this.logUsage(options.model, response, Date.now() - startTime, true)
        }

        // Cache response if enabled
        if (options.cacheKey && response.content) {
          await setCachedResponse(options.cacheKey, response.content)
        }

        return response.content
      } catch (error: any) {
        lastError = error
        
        // Log failed attempt
        if (options.trackCost !== false) {
          await this.logUsage(options.model, null, Date.now() - startTime, false, error.message)
        }

        // Check if error is retryable
        if (!this.isRetryableError(error) || attempt === (options.maxRetries || RETRY_CONFIG.maxRetries)) {
          throw error
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
          RETRY_CONFIG.maxDelay
        )
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError || this.createError('MODEL_ERROR', 'Failed to generate response', true)
  }

  private async callModel(options: GenerationOptions): Promise<{ content: string; usage?: any }> {
    const timeout = options.timeout || TIMEOUT_CONFIG.default

    if (options.model.provider === 'openai') {
      return this.callOpenAI(options, timeout)
    } else if (options.model.provider === 'anthropic') {
      return this.callAnthropic(options, timeout)
    }

    throw this.createError('MODEL_ERROR', `Unsupported provider: ${options.model.provider}`, false)
  }

  private async callOpenAI(options: GenerationOptions, timeout: number): Promise<{ content: string; usage?: any }> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const messages = [
        { role: 'system' as const, content: options.systemInstructions.content },
        ...options.messages
      ]

      const completion = await openai.chat.completions.create({
        model: options.model.model,
        messages,
        max_tokens: options.model.maxTokens,
        temperature: options.model.temperature,
        stream: false
      }, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      return {
        content: completion.choices[0]?.message?.content || '',
        usage: completion.usage
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw this.createError('TIMEOUT', 'Request timed out', true)
      }
      
      throw this.handleProviderError(error)
    }
  }

  private async callAnthropic(options: GenerationOptions, timeout: number): Promise<{ content: string; usage?: any }> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await anthropic.messages.create({
        model: options.model.model,
        max_tokens: options.model.maxTokens,
        temperature: options.model.temperature,
        system: options.systemInstructions.content,
        messages: options.messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      }, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      return {
        content: response.content[0]?.type === 'text' ? response.content[0].text : '',
        usage: response.usage
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw this.createError('TIMEOUT', 'Request timed out', true)
      }
      
      throw this.handleProviderError(error)
    }
  }

  private async logUsage(
    model: AIModel,
    response: { content: string; usage?: any } | null,
    latency: number,
    success: boolean,
    error?: string
  ) {
    const metrics: AIMetrics = {
      userId: this.userId,
      sessionId: this.sessionId,
      model: model.model,
      inputTokens: response?.usage?.prompt_tokens || 0,
      outputTokens: response?.usage?.completion_tokens || 0,
      cost: this.calculateCost(model.model, response?.usage),
      latency,
      timestamp: new Date(),
      success,
      error
    }

    await logMetrics(metrics)
  }

  private calculateCost(model: string, usage?: any): number {
    if (!usage) return 0

    const rates = COST_PER_TOKEN[model as keyof typeof COST_PER_TOKEN]
    if (!rates) return 0

    const inputCost = (usage.prompt_tokens || 0) * rates.input
    const outputCost = (usage.completion_tokens || 0) * rates.output
    
    return inputCost + outputCost
  }

  private isRetryableError(error: any): boolean {
    if (error.code === 'RATE_LIMIT' || error.code === 'TIMEOUT') {
      return true
    }
    
    // Check for specific HTTP status codes
    if (error.status === 429 || error.status === 503 || error.status >= 500) {
      return true
    }

    return false
  }

  private handleProviderError(error: any): AIError {
    // Handle OpenAI errors
    if (error.status === 401 || error.code === 'invalid_api_key') {
      return this.createError('INVALID_API_KEY', 'Invalid API key', false)
    }
    
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      return this.createError('RATE_LIMIT', 'Rate limit exceeded', true, error.headers?.['retry-after'] * 1000)
    }

    if (error.status === 400 || error.code === 'invalid_request') {
      return this.createError('VALIDATION_ERROR', error.message, false, undefined, error)
    }

    return this.createError('MODEL_ERROR', error.message || 'Unknown error', true, undefined, error)
  }

  private createError(
    code: AIError['code'],
    message: string,
    retryable: boolean,
    retryAfter?: number,
    details?: any
  ): AIError {
    const error = new Error(message) as AIError
    error.code = code
    error.retryable = retryable
    error.retryAfter = retryAfter
    error.details = details
    return error
  }
}