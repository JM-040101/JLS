// Save Workflow Answers API

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { AIClient } from '@/lib/ai/client'
import { AI_MODELS, SYSTEM_INSTRUCTIONS } from '@/lib/ai/config'

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
    const { sessionId, phaseNumber, answers, isComplete } = body

    if (!sessionId || !phaseNumber || !answers) {
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

    // Validate answers if phase is being completed
    if (isComplete) {
      const validation = await validateAnswers(answers, phaseNumber, user.id, sessionId)
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid answers', details: validation.errors },
          { status: 400 }
        )
      }
    }

    // Save or update answers
    const { data: savedAnswer, error: saveError } = await supabase
      .from('answers')
      .upsert({
        session_id: sessionId,
        phase_number: phaseNumber,
        answers,
        is_complete: isComplete || false,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving answers:', saveError)
      return NextResponse.json(
        { error: 'Failed to save answers' },
        { status: 500 }
      )
    }

    // Update session progress if phase is complete
    if (isComplete) {
      const newProgress = Math.max(session.current_phase, phaseNumber)

      // Count unique phases that have answers
      const { data: answeredPhases } = await supabase
        .from('answers')
        .select('phase_number')
        .eq('session_id', sessionId)

      const uniquePhases = new Set(answeredPhases?.map(a => a.phase_number) || [])
      const completedPhases = uniquePhases.size

      await supabase
        .from('sessions')
        .update({
          current_phase: newProgress,
          completed_phases: completedPhases,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      // Check if all phases are complete
      if (completedPhases === 12) {
        await supabase
          .from('sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', sessionId)
      }
    }

    // Generate AI summary of the phase if complete
    let summary = null
    if (isComplete) {
      summary = await generatePhaseSummary(
        answers,
        phaseNumber,
        session.business_idea,
        user.id,
        sessionId
      )
    }

    return NextResponse.json({
      success: true,
      answer: savedAnswer,
      summary,
      nextPhase: isComplete && phaseNumber < 12 ? phaseNumber + 1 : null
    })

  } catch (error: any) {
    console.error('Error saving answers:', error)
    
    return NextResponse.json(
      { error: 'Failed to save answers' },
      { status: 500 }
    )
  }
}

async function validateAnswers(
  answers: Record<string, any>,
  phaseNumber: number,
  userId: string,
  sessionId: string
): Promise<{ valid: boolean; errors?: string[] }> {
  // Basic validation
  if (!answers || Object.keys(answers).length === 0) {
    return { valid: false, errors: ['No answers provided'] }
  }

  // Get phase template to check required fields
  const supabase = createSupabaseServerClient()
  const { data: template } = await supabase
    .from('phase_templates')
    .select('questions')
    .eq('phase_number', phaseNumber)
    .single()

  if (template?.questions) {
    const errors: string[] = []
    
    for (const question of template.questions) {
      if (question.required && !answers[question.id]) {
        errors.push(`Missing required answer for: ${question.question}`)
      }
      
      // Validate text length if specified
      if (question.validation && answers[question.id]) {
        const value = answers[question.id]
        
        if (question.type === 'text') {
          if (question.validation.min && value.length < question.validation.min) {
            errors.push(`Answer too short for: ${question.question}`)
          }
          if (question.validation.max && value.length > question.validation.max) {
            errors.push(`Answer too long for: ${question.question}`)
          }
        }
        
        if (question.type === 'number') {
          const num = Number(value)
          if (question.validation.min && num < question.validation.min) {
            errors.push(`Value too low for: ${question.question}`)
          }
          if (question.validation.max && num > question.validation.max) {
            errors.push(`Value too high for: ${question.question}`)
          }
        }
      }
    }
    
    if (errors.length > 0) {
      return { valid: false, errors }
    }
  }

  // Use AI for semantic validation of critical phases
  const criticalPhases = [1, 3, 6, 9, 12] // Phases that need AI validation
  if (criticalPhases.includes(phaseNumber)) {
    const aiClient = new AIClient(userId, sessionId)
    
    try {
      const validationPrompt = `
Validate these answers for phase ${phaseNumber}:
${JSON.stringify(answers, null, 2)}

Check if the answers are:
1. Complete and detailed enough
2. Internally consistent
3. Realistic and achievable
4. Aligned with the business idea

Respond with JSON: { "valid": true/false, "feedback": "..." }
`

      const response = await aiClient.generate({
        model: AI_MODELS.GPT4_BACKUP, // Use cheaper model for validation
        systemInstructions: {
          role: 'system',
          content: 'You are validating SaaS blueprint answers for completeness and quality.'
        },
        messages: [{ role: 'user', content: validationPrompt }],
        maxRetries: 1,
        trackCost: false
      })

      try {
        const result = JSON.parse(response)
        if (!result.valid) {
          return { valid: false, errors: [result.feedback] }
        }
      } catch (e) {
        // If parsing fails, assume valid
        console.error('Failed to parse validation response:', e)
      }
    } catch (error) {
      // Don't block on AI validation failures
      console.error('AI validation failed:', error)
    }
  }

  return { valid: true }
}

async function generatePhaseSummary(
  answers: Record<string, any>,
  phaseNumber: number,
  businessIdea: string,
  userId: string,
  sessionId: string
): Promise<string> {
  const aiClient = new AIClient(userId, sessionId)
  
  try {
    const summaryPrompt = `
Summarize the key decisions and insights from phase ${phaseNumber} answers:
${JSON.stringify(answers, null, 2)}

Business Idea: ${businessIdea}

Create a brief 2-3 sentence summary highlighting the most important decisions made.
Focus on actionable outcomes and key strategic choices.
`

    const summary = await aiClient.generate({
      model: AI_MODELS.GPT4_BACKUP,
      systemInstructions: {
        role: 'system',
        content: 'You are summarizing SaaS blueprint phase answers concisely.'
      },
      messages: [{ role: 'user', content: summaryPrompt }],
      maxRetries: 1,
      trackCost: false
    })

    return summary
  } catch (error) {
    console.error('Failed to generate summary:', error)
    return 'Phase completed successfully.'
  }
}