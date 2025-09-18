// AI Model Configuration

import { AIModel } from './types'

export const AI_MODELS = {
  GPT5: {
    provider: 'openai',
    model: 'gpt-5-turbo',
    maxTokens: 4000,
    temperature: 0.7
  } as AIModel,
  
  CLAUDE_SONNET: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 8000,
    temperature: 0.3
  } as AIModel,
  
  GPT4_BACKUP: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    maxTokens: 4000,
    temperature: 0.7
  } as AIModel
}

export const RATE_LIMITS = {
  free: {
    requestsPerMinute: 3,
    requestsPerHour: 30,
    requestsPerDay: 100
  },
  pro: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 1000
  },
  enterprise: {
    requestsPerMinute: 30,
    requestsPerHour: 500,
    requestsPerDay: 5000
  }
}

export const COST_PER_TOKEN = {
  'gpt-5-turbo': {
    input: 0.00003,
    output: 0.00006
  },
  'gpt-4-turbo-preview': {
    input: 0.00001,
    output: 0.00003
  },
  'claude-3-5-sonnet-20241022': {
    input: 0.000003,
    output: 0.000015
  }
}

export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
}

export const CACHE_CONFIG = {
  ttl: 3600, // 1 hour
  maxSize: 100, // Maximum cached responses
  enabledForPhases: [1, 2, 3] // Cache initial phases only
}

export const TIMEOUT_CONFIG = {
  default: 30000, // 30 seconds
  planProcessing: 60000, // 60 seconds for complex processing
  export: 120000 // 2 minutes for export generation
}

export const SYSTEM_INSTRUCTIONS = {
  workflow: `You are an expert SaaS consultant helping users build comprehensive blueprints for their SaaS ideas. 
You have access to the Expanded SaaS Playbook and should reference it when providing guidance.
Your role is to ask thoughtful, probing questions that help users think through all aspects of their SaaS business.

Key principles:
1. Be specific and actionable in your questions
2. Build upon previous answers to create a coherent narrative
3. Challenge assumptions while being supportive
4. Focus on practical implementation details
5. Consider technical, business, and user experience aspects`,

  planProcessing: `You are a Claude Code specialist who transforms SaaS blueprints into modular, executable documentation.
You follow the ClaudeOps methodology and create clean, well-structured markdown files.

Your output must:
1. Be modular with files under 50KB each
2. Include clear constraints and requirements
3. Reference appropriate MCP servers (supabase, playwright)
4. Generate executable Claude Code prompts
5. Follow proper markdown formatting with clear hierarchy`,

  export: `You are creating comprehensive documentation for a SaaS project.
Generate clear, actionable content that can be directly used by developers.
Include specific implementation details, code examples where appropriate, and clear next steps.`
}