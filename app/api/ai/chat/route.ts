import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt, validateAIInstructions } from '@/lib/ai-instructions'
import { requireAuth } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

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

    // Build messages array for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt + '\n\n' + contextPrompt
      },
      // Add conversation history
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      // Add current user message
      {
        role: 'user',
        content: message
      }
    ]

    // Call GPT-5 (fallback to gpt-4-turbo if GPT-5 not available)
    let completion
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-5',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    } catch (error: any) {
      // If GPT-5 is not available, fallback to gpt-4-turbo
      if (error?.status === 404 || error?.message?.includes('gpt-5')) {
        console.log('GPT-5 not available, falling back to gpt-4-turbo')
        completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo',
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        })
      } else {
        throw error
      }
    }

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.'

    // Save the conversation to database
    const { error: saveError } = await supabase
      .from('answers')
      .upsert({
        session_id: sessionId,
        phase_number: phase,
        question: message,
        answer: aiResponse,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'session_id,phase_number'
      })

    if (saveError) {
      console.error('Failed to save conversation:', saveError)
    }

    // Return AI response
    return NextResponse.json({
      response: aiResponse,
      phase,
      sessionId,
      model: completion.model,
      usage: completion.usage,
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
