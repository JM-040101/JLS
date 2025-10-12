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
    // 1. Authenticate
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate session ID
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // 3. Check if plan already exists
    const { data: existingPlan } = await supabase
      .from('plans')
      .select('id, content, edited_content, status')
      .eq('session_id', sessionId)
      .single()

    // If plan exists and is approved, return it
    if (existingPlan && existingPlan.status === 'approved') {
      return NextResponse.json({
        plan: existingPlan.edited_content || existingPlan.content,
        status: existingPlan.status,
        planId: existingPlan.id
      })
    }

    // If plan exists but not approved, regenerate it
    if (existingPlan) {
      console.log('Plan exists but not approved, regenerating...')
    }

    // 4. Fetch all phase answers
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('phase_number, content')
      .eq('session_id', sessionId)
      .order('phase_number', { ascending: true })

    if (answersError) {
      console.error('Error fetching answers:', answersError)
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 })
    }

    if (!answers || answers.length !== 12) {
      return NextResponse.json(
        { error: `Complete all 12 phases before generating plan. Currently have ${answers?.length || 0} phases completed.` },
        { status: 400 }
      )
    }

    // 5. Call GPT-4 to create building plan
    console.log('Calling GPT-4 to create building plan...')
    const buildingPlan = await callGPT(answers)

    if (!buildingPlan) {
      return NextResponse.json({ error: 'Failed to generate building plan' }, { status: 500 })
    }

    // 6. Save or update plan in database
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
        console.error('Error updating plan:', updateError)
        return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 })
      }

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
        console.error('Error inserting plan:', insertError)
        return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 })
      }

      return NextResponse.json({
        plan: buildingPlan,
        status: 'generated',
        planId: newPlan.id
      })
    }

  } catch (error) {
    console.error('Generate plan error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Plan generation failed. Please try again.' },
      { status: 500 }
    )
  }
}

async function callGPT(answers: Array<{ phase_number: number; content: string }>) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  // Load GPT knowledge bases
  const kb1 = readFileSync(
    join(process.cwd(), 'ai-workflow/knowledge-base-1.md'),
    'utf-8'
  )
  const kb2 = readFileSync(
    join(process.cwd(), 'ai-workflow/knowledge-base-2.md'),
    'utf-8'
  )

  // Format answers
  const formattedAnswers = answers
    .map(a => `**Phase ${a.phase_number}**: ${a.content}`)
    .join('\n\n')

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

  return completion.choices[0].message.content
}
