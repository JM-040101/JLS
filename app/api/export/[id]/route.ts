import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import { inngest } from '@/lib/inngest/client'

// Use Vercel Pro's max duration (5 minutes)
export const maxDuration = 300

// GET /api/export/[id]
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  return handleExport(params.id)
}

async function handleExport(sessionId: string) {
  try {
    // Use service role to bypass RLS for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Validate session ID
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    console.log('[EXPORT] Starting export for session:', sessionId)

    // 2. Get the plan and validate it's approved
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, content, edited_content, status, user_id')
      .eq('session_id', sessionId)
      .single()

    if (planError || !plan) {
      console.error('[EXPORT] Error fetching plan:', planError)
      return NextResponse.json({
        error: 'Plan not found. Please generate and approve a plan first.'
      }, { status: 404 })
    }

    if (plan.status !== 'approved') {
      return NextResponse.json({
        error: 'Plan must be approved before export. Please review and approve your plan first.'
      }, { status: 400 })
    }

    // 3. Check if there's already a completed export
    const { data: existingExport } = await supabase
      .from('exports')
      .select('id, status, files')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingExport) {
      if (existingExport.status === 'completed' && existingExport.files) {
        console.log('[EXPORT] Returning existing completed export:', existingExport.id)
        const zipBuffer = await createZip(existingExport.files)

        return new Response(new Uint8Array(zipBuffer), {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="saas-blueprint.zip"'
          }
        })
      }

      if (existingExport.status === 'processing') {
        console.log('[EXPORT] Export is still processing:', existingExport.id)
        return NextResponse.json({
          message: 'Export is being generated. This takes 6-8 minutes due to AI processing. Please try again in a few minutes.',
          status: 'processing',
          exportId: existingExport.id
        }, { status: 202 })
      }

      if (existingExport.status === 'failed') {
        console.log('[EXPORT] Previous export failed, creating new one')
        // Will create a new export below
      }
    }

    // 4. No completed export exists, trigger Inngest
    console.log('[EXPORT] Creating new export record and triggering Inngest...')

    const { data: newExport, error: exportError } = await supabase
      .from('exports')
      .insert({
        user_id: plan.user_id,
        session_id: sessionId,
        status: 'processing'
      })
      .select('id')
      .single()

    if (exportError || !newExport) {
      console.error('[EXPORT] Error creating export:', exportError)
      return NextResponse.json({ error: 'Failed to create export' }, { status: 500 })
    }

    // 5. Trigger Inngest event
    console.log('[EXPORT] Triggering Inngest event for export:', newExport.id)

    await inngest.send({
      name: 'export/generate.requested',
      data: {
        exportId: newExport.id,
        sessionId: sessionId,
        userId: plan.user_id,
        planId: plan.id
      }
    })

    console.log('[EXPORT] Inngest event triggered successfully')

    return NextResponse.json({
      message: 'Export generation started. This takes 5-7 minutes using hybrid AI processing (GPT-4 + Claude in parallel). Please check back in 7 minutes.',
      status: 'processing',
      exportId: newExport.id
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
  userInstructions: string
  quickStart?: string
  modules: Record<string, string>
  prompts: Record<string, string>
}) {
  const zip = new JSZip()

  // Add main files in order
  if (files.userInstructions) {
    zip.file('USER_INSTRUCTIONS.md', files.userInstructions)
    console.log(`[CREATE-ZIP] Added USER_INSTRUCTIONS.md (${files.userInstructions.length} chars)`)
  }
  if (files.readme) {
    zip.file('README.md', files.readme)
    console.log(`[CREATE-ZIP] Added README.md (${files.readme.length} chars)`)
  }
  if (files.claude) {
    zip.file('CLAUDE.md', files.claude)
    console.log(`[CREATE-ZIP] Added CLAUDE.md (${files.claude.length} chars)`)
  }
  if (files.quickStart) {
    zip.file('QUICK_START.md', files.quickStart)
    console.log(`[CREATE-ZIP] Added QUICK_START.md (${files.quickStart.length} chars)`)
  }

  // Add modules folder with nested structure (modules/auth/README.md)
  if (Object.keys(files.modules).length > 0) {
    const sortedModules = Object.entries(files.modules).sort(([a], [b]) => a.localeCompare(b))
    for (const [name, content] of sortedModules) {
      // Create nested folder structure: modules/auth/README.md
      const moduleFolder = zip.folder('modules')?.folder(name)
      moduleFolder?.file('README.md', content)
      console.log(`[CREATE-ZIP] Added modules/${name}/README.md (${content.length} chars)`)
    }
    console.log(`[CREATE-ZIP] Total module folders: ${sortedModules.length}`)
  }

  // Add prompts folder
  if (Object.keys(files.prompts).length > 0) {
    const promptsFolder = zip.folder('prompts')
    const sortedPrompts = Object.entries(files.prompts).sort(([a], [b]) => {
      const aNum = parseInt(a.match(/^\d+/)?.[0] || '999')
      const bNum = parseInt(b.match(/^\d+/)?.[0] || '999')
      return aNum - bNum
    })
    for (const [name, content] of sortedPrompts) {
      promptsFolder?.file(`${name}.md`, content)
      console.log(`[CREATE-ZIP] Added prompts/${name}.md (${content.length} chars)`)
    }
    console.log(`[CREATE-ZIP] Total prompt files: ${sortedPrompts.length}`)
  }

  console.log('[CREATE-ZIP] ZIP structure created successfully')
  return await zip.generateAsync({ type: 'nodebuffer' })
}
