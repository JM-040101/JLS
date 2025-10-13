import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { inngest } from '@/lib/inngest/client'
import JSZip from 'jszip'

// This endpoint just triggers Inngest - no timeout needed!
export const maxDuration = 30

// GET /api/export/[id]
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  return handleExport(params.id)
}

async function handleExport(sessionId: string) {
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

    console.log('[EXPORT] Starting export for session:', sessionId)

    // 3. Check rate limiting (5 exports per day)
    const { count } = await supabase
      .from('exports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (count && count >= 5) {
      return NextResponse.json(
        { error: 'Export limit reached. Maximum 5 exports per 24 hours.' },
        { status: 429 }
      )
    }

    // 4. Fetch approved plan from database
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, content, edited_content, status')
      .eq('session_id', sessionId)
      .single()

    if (planError || !plan) {
      console.error('[EXPORT] Error fetching plan:', planError)
      return NextResponse.json({ error: 'Plan not found. Please generate and approve a plan first.' }, { status: 404 })
    }

    if (plan.status !== 'approved') {
      return NextResponse.json(
        { error: 'Plan must be approved before export. Please review and approve your plan first.' },
        { status: 400 }
      )
    }

    // 5. Check if there's already a completed export for this session
    const { data: existingExport } = await supabase
      .from('exports')
      .select('id, status, files')
      .eq('session_id', sessionId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingExport && existingExport.files) {
      console.log('[EXPORT] Using existing completed export:', existingExport.id)
      const zipBuffer = await createZip(existingExport.files)

      return new Response(new Uint8Array(zipBuffer), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="saas-blueprint.zip"'
        }
      })
    }

    // 6. Create a new export record and trigger Inngest
    console.log('[EXPORT] Creating new export record...')
    const { data: newExport, error: exportError } = await supabase
      .from('exports')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        status: 'pending'
      })
      .select('id')
      .single()

    if (exportError || !newExport) {
      console.error('[EXPORT] Error creating export:', exportError)
      return NextResponse.json({ error: 'Failed to create export' }, { status: 500 })
    }

    // 7. Trigger Inngest function (no timeout limits!)
    console.log('[EXPORT] Triggering Inngest function for export:', newExport.id)
    await inngest.send({
      name: 'export/generate.requested',
      data: {
        exportId: newExport.id,
        sessionId: sessionId,
        userId: user.id,
        planId: plan.id
      }
    })

    // 8. Poll for completion (max 25 seconds)
    console.log('[EXPORT] Waiting for Inngest to complete...')
    const startTime = Date.now()
    const maxWaitTime = 25000 // 25 seconds

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

      const { data: exportStatus } = await supabase
        .from('exports')
        .select('status, files, error_message')
        .eq('id', newExport.id)
        .single()

      if (exportStatus?.status === 'completed' && exportStatus.files) {
        console.log('[EXPORT] Export completed successfully!')
        const zipBuffer = await createZip(exportStatus.files)

        return new Response(new Uint8Array(zipBuffer), {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="saas-blueprint.zip"'
          }
        })
      }

      if (exportStatus?.status === 'failed') {
        console.error('[EXPORT] Export failed:', exportStatus.error_message)
        return NextResponse.json({
          error: exportStatus.error_message || 'Export generation failed'
        }, { status: 500 })
      }
    }

    // If we get here, the export is still processing
    console.log('[EXPORT] Export still processing after 25 seconds, returning status')
    return NextResponse.json({
      message: 'Export is being generated. This may take a few minutes. Please try downloading again in a moment.',
      exportId: newExport.id,
      status: 'processing'
    }, { status: 202 })

  } catch (error) {
    console.error('[EXPORT] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed. Please try again.' },
      { status: 500 }
    )
  }
}

async function createZip(files: {
  readme: string
  claude: string
  modules: Record<string, string>
  prompts: Record<string, string>
}) {
  const zip = new JSZip()

  // Add main files
  if (files.readme) {
    zip.file('README.md', files.readme)
  }
  if (files.claude) {
    zip.file('CLAUDE.md', files.claude)
  }

  // Add modules
  if (Object.keys(files.modules).length > 0) {
    const modulesFolder = zip.folder('modules')
    for (const [name, content] of Object.entries(files.modules)) {
      modulesFolder?.file(`${name}.md`, content)
    }
  }

  // Add prompts
  if (Object.keys(files.prompts).length > 0) {
    const promptsFolder = zip.folder('prompts')
    for (const [name, content] of Object.entries(files.prompts)) {
      promptsFolder?.file(`${name}.md`, content)
    }
  }

  return await zip.generateAsync({ type: 'nodebuffer' })
}
