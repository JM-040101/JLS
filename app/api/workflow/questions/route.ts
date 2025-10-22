// Workflow Questions API - Get phase-specific questions from GPT-5

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { AIClient } from '@/lib/ai/client'
import { AI_MODELS, SYSTEM_INSTRUCTIONS, CACHE_CONFIG } from '@/lib/ai/config'
import { generateCacheKey } from '@/lib/ai/cache'
import { PhaseResponse, WorkflowContext } from '@/lib/ai/types'
import { WORKFLOW_PHASES as PHASES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { sessionId, phaseNumber } = body

    if (!sessionId || !phaseNumber) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Verify session ownership
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get previous answers to build context
    const { data: answers } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .lt('phase_number', phaseNumber)
      .order('phase_number')

    // Build workflow context
    const context: WorkflowContext = {
      sessionId,
      userId: user.id,
      phaseNumber,
      previousAnswers: answers?.reduce((acc, answer) => {
        acc[answer.phase_number] = answer.answers
        return acc
      }, {} as Record<string, any>) || {},
      businessIdea: session.business_idea,
      targetAudience: session.target_audience
    }

    // Generate questions using GPT-5
    const aiClient = new AIClient(user.id, sessionId)

    // Build conversation history context
    const historyContext = answers && answers.length > 0
      ? `Previous conversation:\n${buildConversationHistory(answers)}\n\n`
      : ''

    // Build messages for GPT-5
    const messages = [
      {
        role: 'user' as const,
        content: historyContext + buildQuestionPrompt(context, phaseNumber)
      }
    ]

    // Generate cache key for common initial phases
    const cacheKey = CACHE_CONFIG.enabledForPhases.includes(phaseNumber)
      ? generateCacheKey({
          phase: phaseNumber,
          idea: session.business_idea,
          audience: session.target_audience
        })
      : undefined

    // Call GPT-5 to generate questions
    const response = await aiClient.generate({
      model: AI_MODELS.GPT5,
      systemInstructions: {
        role: 'system',
        content: SYSTEM_INSTRUCTIONS.workflow,
        knowledge: ['Expanded SaaS Playbook', 'ClaudeOps Methodology']
      },
      messages,
      cacheKey,
      trackCost: true
    })

    // Parse GPT-5 response to extract questions
    const phaseResponse = parseGPTResponse(response, phaseNumber)

    // Store phase template if it doesn't exist
    await supabase
      .from('phase_templates')
      .upsert({
        phase_number: phaseNumber,
        name: PHASES[phaseNumber - 1].title,
        questions: phaseResponse.questions,
        updated_at: new Date().toISOString()
      })

    return NextResponse.json(phaseResponse)

  } catch (error: any) {
    console.error('Error generating questions:', error)
    
    if (error.code === 'RATE_LIMIT') {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: error.retryAfter },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}

function buildQuestionPrompt(context: WorkflowContext, phaseNumber: number): string {
  const phase = PHASES[phaseNumber - 1]
  
  return `
You are helping build a comprehensive blueprint for a SaaS business.

Business Idea: ${context.businessIdea}
Target Audience: ${context.targetAudience || 'Not specified yet'}
Current Phase: ${phase.title} (Phase ${phaseNumber} of 12)

Previous answers have been collected for phases 1-${phaseNumber - 1}.
${context.previousAnswers ? `Key insights so far: ${JSON.stringify(context.previousAnswers, null, 2)}` : ''}

Generate 5-8 specific, actionable questions for the ${phase.title} phase.
Each question should:
1. Build upon previous answers
2. Be specific to their business idea
3. Help them think through practical implementation details
4. Consider technical, business, and UX aspects

Return the response in this exact JSON format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Your question here",
      "type": "text",
      "required": true,
      "placeholder": "Helpful placeholder text",
      "validation": {
        "min": 10,
        "max": 500,
        "message": "Please provide a detailed answer"
      }
    }
  ],
  "guidance": "Brief guidance about this phase and what to focus on",
  "nextPhasePreview": "Brief preview of what comes next"
}

Question types can be: text, select, multiselect, number, boolean
For select/multiselect, include an "options" array.
`
}

function buildConversationHistory(answers: any[]): string {
  return answers
    .map(answer => {
      const phase = PHASES[answer.phase_number - 1]
      return `Phase ${answer.phase_number} (${phase.title}): User provided detailed answers about ${phase.description}`
    })
    .join('\n')
}

function parseGPTResponse(response: string, phaseNumber: number): PhaseResponse {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(response)
    
    if (parsed.questions && Array.isArray(parsed.questions)) {
      return {
        phaseNumber,
        questions: parsed.questions,
        guidance: parsed.guidance || '',
        nextPhasePreview: parsed.nextPhasePreview
      }
    }
  } catch (error) {
    // If JSON parsing fails, extract questions from text
    console.error('Failed to parse GPT response as JSON:', error)
  }

  // Fallback to default questions if parsing fails
  const phase = PHASES[phaseNumber - 1]
  return {
    phaseNumber,
    questions: getDefaultQuestions(phaseNumber),
    guidance: `Let's explore ${phase.title} for your SaaS business.`,
    nextPhasePreview: phaseNumber < 12 ? `Next, we'll cover ${PHASES[phaseNumber].title}` : undefined
  }
}

function getDefaultQuestions(phaseNumber: number): any[] {
  // Default questions for each phase as fallback
  const defaults: Record<number, any[]> = {
    1: [
      {
        id: 'q1',
        question: 'What specific problem does your SaaS solve?',
        type: 'text',
        required: true,
        placeholder: 'Describe the problem in detail'
      },
      {
        id: 'q2',
        question: 'Who experiences this problem most acutely?',
        type: 'text',
        required: true,
        placeholder: 'Describe your target users'
      }
    ],
    // ... add defaults for other phases
  }

  return defaults[phaseNumber] || [{
    id: 'q1',
    question: `Tell us about your approach to ${PHASES[phaseNumber - 1].title}`,
    type: 'text',
    required: true,
    placeholder: 'Provide details'
  }]
}