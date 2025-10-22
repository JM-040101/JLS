import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { inngest } from '@/lib/inngest/client'

// This endpoint just triggers Inngest - no timeout needed!
export const maxDuration = 30

// POST /api/jobs/process/[job_id] - Process the job (called internally by frontend immediately after job creation)
export async function POST(
  req: Request,
  { params }: { params: { job_id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[JOB-PROCESS] Starting job processing:', params.job_id)

    // 1. Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, session_id, status, user_id')
      .eq('id', params.job_id)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      console.error('[JOB-PROCESS] Job not found:', jobError)
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.status !== 'pending') {
      console.log('[JOB-PROCESS] Job already processed:', job.status)
      return NextResponse.json({ message: 'Job already processed', status: job.status })
    }

    // 2. Trigger Inngest function (no timeout limits!)
    console.log('[JOB-PROCESS] Triggering Inngest function for job:', params.job_id)

    await inngest.send({
      name: 'plan/generate.requested',
      data: {
        jobId: params.job_id,
        sessionId: job.session_id,
        userId: job.user_id
      }
    })

    console.log('[JOB-PROCESS] Inngest function triggered successfully')

    return NextResponse.json({
      message: 'Job processing started via Inngest',
      jobId: params.job_id
    })

  } catch (error) {
    console.error('[JOB-PROCESS] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Job processing failed' },
      { status: 500 }
    )
  }
}
