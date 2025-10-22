// AI Integration Types

export interface AIModel {
  provider: 'openai' | 'anthropic'
  model: string
  maxTokens: number
  temperature: number
}

export interface WorkflowContext {
  sessionId: string
  userId: string
  phaseNumber: number
  previousAnswers: Record<string, any>
  businessIdea: string
  targetAudience?: string
  currentPhaseAnswers?: Record<string, string>
}

export interface PhaseQuestion {
  id: string
  question: string
  type: 'text' | 'select' | 'multiselect' | 'number' | 'boolean'
  options?: string[]
  required: boolean
  placeholder?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface PhaseResponse {
  phaseNumber: number
  questions: PhaseQuestion[]
  guidance: string
  nextPhasePreview?: string
}

export interface PlanProcessingRequest {
  sessionId: string
  fullPlan: Record<number, Record<string, any>>
  outputFormat: 'claudeops' | 'devbook' | 'standard'
}

export interface ProcessedPlan {
  id: string
  sessionId: string
  structure: ModuleStructure[]
  prompts: ClaudePrompt[]
  readme: string
  claudeMd: string
}

export interface ModuleStructure {
  name: string
  path: string
  content: string
  dependencies: string[]
  mcpServers?: string[]
  constraints: string[]
}

export interface ClaudePrompt {
  id: string
  title: string
  description: string
  prompt: string
  mcpServers: string[]
  expectedOutput: string
  dependencies: string[]
}

export interface AIMetrics {
  userId: string
  sessionId: string
  model: string
  inputTokens: number
  outputTokens: number
  cost: number
  latency: number
  timestamp: Date
  success: boolean
  error?: string
}

export interface RateLimitStatus {
  remaining: number
  limit: number
  resetAt: Date
  blocked: boolean
}

export interface AIError extends Error {
  code: 'RATE_LIMIT' | 'INVALID_API_KEY' | 'MODEL_ERROR' | 'VALIDATION_ERROR' | 'TIMEOUT'
  details?: any
  retryable: boolean
  retryAfter?: number
}

export interface SystemInstruction {
  role: 'system'
  content: string
  knowledge?: string[]
}

export interface ChatMessage {
  role: 'system' | 'assistant' | 'user'
  content: string
  metadata?: Record<string, any>
}

export interface GenerationOptions {
  model: AIModel
  systemInstructions: SystemInstruction
  messages: ChatMessage[]
  maxRetries?: number
  timeout?: number
  cacheKey?: string
  trackCost?: boolean
}