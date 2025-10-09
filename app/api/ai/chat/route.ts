import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt, validateAIInstructions } from '@/lib/ai-instructions'
import { requireAuth } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * POST /api/ai/chat
 *
 * Handles AI chat for the workflow phases
 * This endpoint will call GPT-5 or Claude Sonnet 4 with the proper instructions
 *
 * Request body:
 * {
 *   sessionId: string,
 *   phase: number,
 *   message: string,
 *   conversationHistory?: array
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth()

    // Parse request body
    const body = await request.json()
    const { sessionId, phase, message, conversationHistory = [] } = body

    // Validate inputs
    if (!sessionId || !phase || !message) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'sessionId, phase, and message are required'
      }, { status: 400 })
    }

    if (phase < 1 || phase > 12) {
      return NextResponse.json({
        error: 'Invalid phase',
        message: 'Phase must be between 1 and 12'
      }, { status: 400 })
    }

    // Verify user owns this session
    const supabase = createSupabaseServerClient()
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id, current_phase, app_name, app_description')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({
        error: 'Session not found'
      }, { status: 404 })
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, { status: 403 })
    }

    // Validate AI instructions are configured
    const validation = validateAIInstructions()
    if (!validation.valid) {
      return NextResponse.json({
        error: 'AI instructions not configured',
        missing: validation.missing,
        message: 'Please configure AI workflow instructions first'
      }, { status: 503 })
    }

    // Build the system prompt with instructions for this phase
    const systemPrompt = buildSystemPrompt(phase)

    // Add context about the user's SaaS idea
    const contextPrompt = `
# User's SaaS Project Context
App Name: ${session.app_name || 'Not specified'}
App Description: ${session.app_description}
Current Phase: ${session.current_phase}

Remember this context as you guide the user through Phase ${phase}.
`

    // TODO: Integrate with GPT-5 or Claude Sonnet 4
    // This is a placeholder response
    // You'll need to implement the actual AI API call here using:
    // - OpenAI API for GPT-5
    // - Anthropic API for Claude Sonnet 4

    const aiResponse = `[AI Response Placeholder]

This endpoint is ready to receive your AI model integration.

System Prompt Length: ${systemPrompt.length} characters
Context: ${session.app_name || 'Unnamed Project'}
User Message: ${message}

To complete the integration, add your API key and implement the AI call in this endpoint.`

    // Return AI response
    return NextResponse.json({
      response: aiResponse,
      phase,
      sessionId,
      instructions: {
        loaded: true,
        promptLength: systemPrompt.length
      }
    })

  } catch (error: any) {
    console.error('Error in AI chat:', error)
    return NextResponse.json({
      error: 'AI chat failed',
      message: error.message
    }, { status: 500 })
  }
}
