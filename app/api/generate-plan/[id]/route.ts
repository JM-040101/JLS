import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { join } from 'path'

// POST /api/generate-plan/[id]
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  return handleGeneratePlan(params.id)
}

async function handleGeneratePlan(sessionId: string) {
  try {
    console.log('[GENERATE-PLAN] Starting plan generation for session:', sessionId)

    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('[GENERATE-PLAN] Auth error:', authError)
      return NextResponse.json({ error: 'Authentication failed', details: authError.message }, { status: 401 })
    }

    if (!user) {
      console.error('[GENERATE-PLAN] No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[GENERATE-PLAN] Authenticated user:', user.id)

    // 2. Validate session ID
    if (!sessionId) {
      console.error('[GENERATE-PLAN] No session ID provided')
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // 3. Check if plan already exists
    console.log('[GENERATE-PLAN] Checking for existing plan...')
    const { data: existingPlan, error: planCheckError } = await supabase
      .from('plans')
      .select('id, content, edited_content, status')
      .eq('session_id', sessionId)
      .single()

    if (planCheckError && planCheckError.code !== 'PGRST116') {
      console.error('[GENERATE-PLAN] Error checking existing plan:', planCheckError)
    }

    // If plan exists and is approved, return it
    if (existingPlan && existingPlan.status === 'approved') {
      console.log('[GENERATE-PLAN] Returning existing approved plan:', existingPlan.id)
      return NextResponse.json({
        plan: existingPlan.edited_content || existingPlan.content,
        status: existingPlan.status,
        planId: existingPlan.id
      })
    }

    // If plan exists but not approved, regenerate it
    if (existingPlan) {
      console.log('[GENERATE-PLAN] Plan exists but not approved, regenerating...')
    }

    // 4. Fetch all phase answers
    console.log('[GENERATE-PLAN] Fetching answers...')
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('phase_number, answer_text, question_text')
      .eq('session_id', sessionId)
      .order('phase_number', { ascending: true })

    if (answersError) {
      console.error('[GENERATE-PLAN] Error fetching answers:', answersError)
      return NextResponse.json({
        error: 'Failed to fetch answers',
        details: answersError.message
      }, { status: 500 })
    }

    console.log('[GENERATE-PLAN] Found answers:', answers?.length || 0)

    // Count unique phases (not total answers)
    const uniquePhases = answers ? new Set(answers.map(a => a.phase_number)).size : 0
    console.log('[GENERATE-PLAN] Unique phases:', uniquePhases)

    if (!answers || uniquePhases !== 12) {
      console.error('[GENERATE-PLAN] Incomplete workflow:', { totalAnswers: answers?.length, uniquePhases })
      return NextResponse.json(
        {
          error: `Complete all 12 phases before generating plan. Currently have ${uniquePhases} phases completed.`,
          details: { totalAnswers: answers?.length || 0, uniquePhases }
        },
        { status: 400 }
      )
    }

    // 5. Call GPT-4 to create building plan
    console.log('[GENERATE-PLAN] Calling GPT-4 to create building plan...')
    let buildingPlan
    try {
      buildingPlan = await callGPT(answers)
      console.log('[GENERATE-PLAN] GPT-4 response length:', buildingPlan?.length || 0)
    } catch (gptError) {
      console.error('[GENERATE-PLAN] GPT-4 error:', gptError)
      return NextResponse.json({
        error: 'Failed to generate building plan',
        details: gptError instanceof Error ? gptError.message : 'Unknown error'
      }, { status: 500 })
    }

    if (!buildingPlan) {
      console.error('[GENERATE-PLAN] GPT-4 returned empty plan')
      return NextResponse.json({ error: 'Failed to generate building plan' }, { status: 500 })
    }

    // 6. Save or update plan in database
    console.log('[GENERATE-PLAN] Saving plan to database...')
    if (existingPlan) {
      // Update existing plan
      const { data: updatedPlan, error: updateError } = await supabase
        .from('plans')
        .update({
          content: buildingPlan,
          edited_content: null,
          status: 'generated',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPlan.id)
        .select()
        .single()

      if (updateError) {
        console.error('[GENERATE-PLAN] Error updating plan:', updateError)
        return NextResponse.json({
          error: 'Failed to save plan',
          details: updateError.message
        }, { status: 500 })
      }

      console.log('[GENERATE-PLAN] Plan updated successfully:', updatedPlan.id)
      return NextResponse.json({
        plan: buildingPlan,
        status: 'generated',
        planId: updatedPlan.id
      })
    } else {
      // Create new plan
      const { data: newPlan, error: insertError } = await supabase
        .from('plans')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          content: buildingPlan,
          status: 'generated'
        })
        .select()
        .single()

      if (insertError) {
        console.error('[GENERATE-PLAN] Error inserting plan:', insertError)
        return NextResponse.json({
          error: 'Failed to save plan',
          details: insertError.message
        }, { status: 500 })
      }

      console.log('[GENERATE-PLAN] New plan created successfully:', newPlan.id)
      return NextResponse.json({
        plan: buildingPlan,
        status: 'generated',
        planId: newPlan.id
      })
    }

  } catch (error) {
    console.error('[GENERATE-PLAN] Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Plan generation failed. Please try again.',
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function callGPT(answers: Array<{ phase_number: number; answer_text: string; question_text: string }>) {
  console.log('[CALL-GPT] Starting GPT-4 call with', answers.length, 'answers')

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    console.log('[CALL-GPT] OpenAI client created')

    // Load GPT knowledge bases
    console.log('[CALL-GPT] Loading knowledge bases...')
    const kb1 = readFileSync(
      join(process.cwd(), 'ai-workflow/knowledge-base-1.md'),
      'utf-8'
    )
    const kb2 = readFileSync(
      join(process.cwd(), 'ai-workflow/knowledge-base-2.md'),
      'utf-8'
    )
    console.log('[CALL-GPT] Knowledge bases loaded:', { kb1Length: kb1.length, kb2Length: kb2.length })

    // Format answers - group by phase with all questions
    const phaseGroups = answers.reduce((acc, answer) => {
      if (!acc[answer.phase_number]) {
        acc[answer.phase_number] = []
      }
      acc[answer.phase_number].push(`Q: ${answer.question_text}\nA: ${answer.answer_text}`)
      return acc
    }, {} as Record<number, string[]>)

    const formattedAnswers = Object.entries(phaseGroups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([phase, qas]) => `**Phase ${phase}**:\n${qas.join('\n\n')}`)
      .join('\n\n---\n\n')

    console.log('[CALL-GPT] Formatted answers length:', formattedAnswers.length)

    console.log('[CALL-GPT] Calling OpenAI API...')
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are a SaaS planning expert. Use these knowledge bases to transform user answers into a structured building plan:\n\n${kb1}\n\n---\n\n${kb2}`
        },
        {
          role: "user",
          content: `Transform these 12-phase workflow answers into a comprehensive SaaS building plan following the knowledge base instructions:\n\n${formattedAnswers}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })

    console.log('[CALL-GPT] GPT-4 response received:', {
      model: completion.model,
      finishReason: completion.choices[0].finish_reason,
      tokensUsed: completion.usage
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('[CALL-GPT] Error calling GPT-4:', error)
    throw error
  }
}
