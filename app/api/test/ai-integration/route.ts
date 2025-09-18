// Test endpoint for AI integration
// This endpoint allows testing the AI workflow with mock data

import { NextRequest, NextResponse } from 'next/server'
import { AIClient } from '@/lib/ai/client'
import { AI_MODELS, SYSTEM_INSTRUCTIONS } from '@/lib/ai/config'
import { checkRateLimit } from '@/lib/ai/rate-limit'
import { getUserUsage } from '@/lib/ai/metrics'

export async function GET(request: NextRequest) {
  try {
    // Mock user ID for testing
    const userId = 'test-user-123'
    const sessionId = 'test-session-456'

    // Test rate limiting
    const rateLimitStatus = await checkRateLimit(userId)
    
    // Test usage metrics
    const dailyUsage = await getUserUsage(userId, 'day')
    const monthlyUsage = await getUserUsage(userId, 'month')

    // Test AI client with a simple prompt
    const aiClient = new AIClient(userId, sessionId)
    
    let testResponse = null
    let error = null

    try {
      testResponse = await aiClient.generate({
        model: AI_MODELS.GPT4_BACKUP, // Use GPT-4 for testing (cheaper)
        systemInstructions: {
          role: 'system',
          content: 'You are a helpful assistant testing the AI integration.'
        },
        messages: [{
          role: 'user',
          content: 'Generate a simple test response to confirm the AI integration is working. Respond with JSON: {"status": "working", "message": "..."}'
        }],
        maxRetries: 1,
        trackCost: true
      })
    } catch (aiError: any) {
      error = {
        message: aiError.message,
        code: aiError.code,
        retryable: aiError.retryable
      }
    }

    return NextResponse.json({
      integration: {
        status: testResponse ? 'working' : 'failed',
        response: testResponse ? JSON.parse(testResponse) : null,
        error
      },
      rateLimit: {
        remaining: rateLimitStatus.remaining,
        limit: rateLimitStatus.limit,
        resetAt: rateLimitStatus.resetAt,
        blocked: rateLimitStatus.blocked
      },
      usage: {
        daily: dailyUsage,
        monthly: monthlyUsage
      },
      models: {
        gpt5: AI_MODELS.GPT5.model,
        claude: AI_MODELS.CLAUDE_SONNET.model,
        backup: AI_MODELS.GPT4_BACKUP.model
      }
    })

  } catch (error: any) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType = 'workflow' } = body

    const userId = 'test-user-123'
    const sessionId = 'test-session-456'
    const aiClient = new AIClient(userId, sessionId)

    let result = null

    switch (testType) {
      case 'workflow':
        // Test workflow question generation
        result = await testWorkflowQuestions(aiClient)
        break
        
      case 'plan':
        // Test plan processing
        result = await testPlanProcessing(aiClient)
        break
        
      case 'export':
        // Test export generation
        result = await testExportGeneration(aiClient)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      testType,
      success: true,
      result
    })

  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error.message
      },
      { status: 500 }
    )
  }
}

async function testWorkflowQuestions(aiClient: AIClient) {
  const mockContext = {
    businessIdea: 'AI-powered project management tool',
    targetAudience: 'Remote software teams',
    phaseNumber: 1
  }

  const prompt = `
Generate 3 questions for Phase 1 (Ideation) of a SaaS blueprint.
Business: ${mockContext.businessIdea}
Audience: ${mockContext.targetAudience}

Return JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "...",
      "type": "text",
      "required": true
    }
  ],
  "guidance": "..."
}
`

  const response = await aiClient.generate({
    model: AI_MODELS.GPT4_BACKUP,
    systemInstructions: {
      role: 'system',
      content: SYSTEM_INSTRUCTIONS.workflow
    },
    messages: [{ role: 'user', content: prompt }],
    trackCost: false
  })

  return JSON.parse(response)
}

async function testPlanProcessing(aiClient: AIClient) {
  const mockPlan = {
    1: { problem: 'Complex project coordination', solution: 'AI-powered PM tool' },
    2: { audience: 'Remote teams', size: '10000+' }
  }

  const prompt = `
Transform this blueprint into a module structure:
${JSON.stringify(mockPlan, null, 2)}

Return JSON with 2 modules:
[
  {
    "name": "module-name",
    "path": "path/to/module",
    "content": "Brief description",
    "dependencies": [],
    "mcpServers": [],
    "constraints": ["constraint1"]
  }
]
`

  const response = await aiClient.generate({
    model: AI_MODELS.CLAUDE_SONNET,
    systemInstructions: {
      role: 'system',
      content: SYSTEM_INSTRUCTIONS.planProcessing
    },
    messages: [{ role: 'user', content: prompt }],
    trackCost: false
  })

  return JSON.parse(response)
}

async function testExportGeneration(aiClient: AIClient) {
  const prompt = `
Generate a simple README outline for a SaaS project.
Include: Overview, Features, Setup sections only.
Keep it brief (under 200 words).
`

  const response = await aiClient.generate({
    model: AI_MODELS.GPT4_BACKUP,
    systemInstructions: {
      role: 'system',
      content: SYSTEM_INSTRUCTIONS.export
    },
    messages: [{ role: 'user', content: prompt }],
    trackCost: false
  })

  return { readme: response }
}