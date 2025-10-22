import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

    // 3. Check if there's already a pending/processing job
    console.log('[GENERATE-PLAN] Checking for existing jobs...')
    const { data: existingJobs, error: jobCheckError } = await supabase
      .from('jobs')
      .select('id, status, updated_at')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })

    if (existingJobs && existingJobs.length > 0) {
      const existingJob = existingJobs[0]

      // Check if job is stuck (processing for more than 5 minutes)
      const updatedAt = new Date(existingJob.updated_at)
      const now = new Date()
      const minutesElapsed = (now.getTime() - updatedAt.getTime()) / 1000 / 60

      if (existingJob.status === 'processing' && minutesElapsed > 5) {
        console.log('[GENERATE-PLAN] Found stuck job (processing for', minutesElapsed.toFixed(1), 'minutes), marking as failed')
        await supabase
          .from('jobs')
          .update({
            status: 'failed',
            error_message: 'Job timed out after 5 minutes',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingJob.id)

        // Continue to create a new job below
      } else {
        console.log('[GENERATE-PLAN] Found existing active job:', existingJob.id, existingJob.status)
        return NextResponse.json({
          jobId: existingJob.id,
          status: existingJob.status,
          message: 'Job already in progress'
        })
      }
    }

    // 4. Check if plan already exists and is approved
    console.log('[GENERATE-PLAN] Checking for existing plan...')
    const { data: existingPlan, error: planCheckError } = await supabase
      .from('plans')
      .select('id, content, edited_content, status')
      .eq('session_id', sessionId)
      .single()

    if (planCheckError && planCheckError.code !== 'PGRST116') {
      console.error('[GENERATE-PLAN] Error checking existing plan:', planCheckError)
    }

    // If plan exists and is approved, return it directly
    if (existingPlan && existingPlan.status === 'approved') {
      console.log('[GENERATE-PLAN] Returning existing approved plan:', existingPlan.id)
      return NextResponse.json({
        plan: existingPlan.edited_content || existingPlan.content,
        status: existingPlan.status,
        planId: existingPlan.id
      })
    }

    // 5. Verify 12 phases are complete before creating job
    console.log('[GENERATE-PLAN] Verifying 12 phases complete...')
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('phase_number')
      .eq('session_id', sessionId)

    if (answersError) {
      console.error('[GENERATE-PLAN] Error fetching answers:', answersError)
      return NextResponse.json({
        error: 'Failed to verify workflow completion',
        details: answersError.message
      }, { status: 500 })
    }

    const uniquePhases = answers ? new Set(answers.map(a => a.phase_number)).size : 0
    if (uniquePhases !== 12) {
      console.error('[GENERATE-PLAN] Incomplete workflow:', uniquePhases)
      return NextResponse.json({
        error: `Complete all 12 phases before generating plan. Currently have ${uniquePhases} phases completed.`
      }, { status: 400 })
    }

    // 6. Create a new job for async processing
    console.log('[GENERATE-PLAN] Creating new job for async processing...')
    const { data: newJob, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        job_type: 'plan_generation',
        status: 'pending'
      })
      .select('id')
      .single()

    if (jobError || !newJob) {
      console.error('[GENERATE-PLAN] Error creating job:', jobError)
      return NextResponse.json({
        error: 'Failed to create generation job',
        details: jobError?.message
      }, { status: 500 })
    }

    console.log('[GENERATE-PLAN] Job created successfully:', newJob.id)

    // Return job ID immediately - frontend will poll for completion
    return NextResponse.json({
      jobId: newJob.id,
      status: 'pending',
      message: 'Plan generation started. Poll /api/jobs/[job_id] for status.'
    })

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

