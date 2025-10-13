import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import JSZip from 'jszip'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

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

    // 3. Check rate limiting (disabled for testing)
    // const { count } = await supabase
    //   .from('exports')
    //   .select('*', { count: 'exact', head: true })
    //   .eq('user_id', user.id)
    //   .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // if (count && count >= 5) {
    //   return NextResponse.json(
    //     { error: 'Export limit reached. Maximum 5 exports per 24 hours.' },
    //     { status: 429 }
    //   )
    // }

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

    // 6. Create a new export record
    console.log('[EXPORT] Creating new export record...')
    const { data: newExport, error: exportError } = await supabase
      .from('exports')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        status: 'processing'
      })
      .select('id')
      .single()

    if (exportError || !newExport) {
      console.error('[EXPORT] Error creating export:', exportError)
      return NextResponse.json({ error: 'Failed to create export' }, { status: 500 })
    }

    // 7. Call Claude directly to generate files
    console.log('[EXPORT] Calling Claude to generate files...')
    const buildingPlan = plan.edited_content || plan.content

    try {
      const files = await callClaudeForExport(buildingPlan)

      // 8. Save files to database
      await supabase
        .from('exports')
        .update({
          status: 'completed',
          files: files,
          completed_at: new Date().toISOString()
        })
        .eq('id', newExport.id)

      console.log('[EXPORT] Export completed successfully!')

      // 9. Return ZIP file
      const zipBuffer = await createZip(files)

      return new Response(new Uint8Array(zipBuffer), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="saas-blueprint.zip"'
        }
      })

    } catch (claudeError) {
      console.error('[EXPORT] Claude error:', claudeError)

      // Update export status to failed
      await supabase
        .from('exports')
        .update({
          status: 'failed',
          error_message: claudeError instanceof Error ? claudeError.message : 'Unknown error'
        })
        .eq('id', newExport.id)

      return NextResponse.json({
        error: 'Failed to generate export files. Please try again.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('[EXPORT] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed. Please try again.' },
      { status: 500 }
    )
  }
}

// Claude call function for export file generation
async function callClaudeForExport(buildingPlan: string) {
  console.log('[CALL-CLAUDE] Starting Claude call for export generation')

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured')
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    // Load Claude instructions
    const instructions = readFileSync(
      join(process.cwd(), 'claude-instructions/claude-instructions.md'),
      'utf-8'
    )
    const kb1 = readFileSync(
      join(process.cwd(), 'claude-instructions/claude-knowledge-base-1.md'),
      'utf-8'
    )
    const kb2 = readFileSync(
      join(process.cwd(), 'claude-instructions/claude-knowledge-base-2.md'),
      'utf-8'
    )

    const fullInstructions = `${instructions}\n\n---\n\n# Knowledge Base 1\n\n${kb1}\n\n---\n\n# Knowledge Base 2\n\n${kb2}`

    console.log('[CALL-CLAUDE] Calling Anthropic API...')
    const startTime = Date.now()

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      system: fullInstructions,
      messages: [
        {
          role: "user",
          content: `Transform this building plan into a complete project export with README.md, CLAUDE.md, module files, and prompt files. Follow your instructions exactly.

IMPORTANT: Format each file exactly as:
## File: filename.md
\`\`\`markdown
[file content here]
\`\`\`

# Building Plan

${buildingPlan}`
        }
      ]
    })

    const endTime = Date.now()
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(2)

    console.log('[CALL-CLAUDE] Claude response received:', {
      model: message.model,
      stopReason: message.stop_reason,
      durationSeconds
    })

    const content = message.content
    return parseClaudeOutput(content)
  } catch (error) {
    console.error('[CALL-CLAUDE] Error calling Claude:', error)
    throw error
  }
}

function parseClaudeOutput(content: any) {
  // Extract text from Claude response
  const text = typeof content === 'string' ? content : content[0]?.text || ''

  const files = {
    readme: '',
    claude: '',
    userInstructions: '',
    modules: {} as Record<string, string>,
    prompts: {} as Record<string, string>
  }

  // Parse files from Claude output
  const fileMatches = text.matchAll(/## File: (.+?)\n```(?:markdown)?\n([\s\S]+?)\n```/g)

  let matchCount = 0
  const parsedFiles: string[] = []

  for (const match of fileMatches) {
    matchCount++
    const filePath = match[1].trim()
    const fileContent = match[2]

    console.log(`[PARSE-CLAUDE] Parsing file: ${filePath}`)
    parsedFiles.push(filePath)

    // Handle top-level files
    if (filePath === 'README.md' || filePath.endsWith('/README.md')) {
      files.readme = fileContent
    } else if (filePath === 'CLAUDE.md' || filePath.endsWith('/CLAUDE.md')) {
      files.claude = fileContent
    } else if (filePath === 'USER_INSTRUCTIONS.md' || filePath.endsWith('/USER_INSTRUCTIONS.md')) {
      files.userInstructions = fileContent
    }
    // Handle module files (must contain 'modules/' in path)
    else if (filePath.includes('modules/')) {
      const moduleName = filePath.split('/').pop()?.replace(/\.(md|MD)$/, '') || 'module'
      files.modules[moduleName] = fileContent
    }
    // Handle prompt files (must contain 'prompts/' in path OR start with number)
    else if (filePath.includes('prompts/') || /^\d{2}-/.test(filePath.split('/').pop() || '')) {
      const fileName = filePath.split('/').pop()?.replace(/\.(md|MD)$/, '') || 'prompt'
      files.prompts[fileName] = fileContent
    }
  }

  console.log(`[PARSE-CLAUDE] Parsed ${matchCount} files:`, {
    hasReadme: !!files.readme,
    hasClaude: !!files.claude,
    hasUserInstructions: !!files.userInstructions,
    moduleCount: Object.keys(files.modules).length,
    promptCount: Object.keys(files.prompts).length,
    allParsedFiles: parsedFiles
  })

  // Validation warnings for expected files
  const expectedModules = ['auth-module', 'api-module', 'database-module', 'ui-module', 'payments-module']
  const missingModules = expectedModules.filter(m => !files.modules[m])
  if (missingModules.length > 0) {
    console.warn('[PARSE-CLAUDE] Missing expected modules:', missingModules)
  }

  const expectedPromptCount = 7 // 01-setup through 07-deploy
  if (Object.keys(files.prompts).length < expectedPromptCount) {
    console.warn(`[PARSE-CLAUDE] Expected ${expectedPromptCount} prompts, found ${Object.keys(files.prompts).length}`)
  }

  if (!files.userInstructions) {
    console.warn('[PARSE-CLAUDE] Missing USER_INSTRUCTIONS.md')
  }

  // If no files were parsed, try to extract at least README from full text
  if (matchCount === 0) {
    console.warn('[PARSE-CLAUDE] No files parsed in expected format. Using fallback...')
    files.readme = text.substring(0, Math.min(5000, text.length))
    files.claude = 'See README.md for full content.'
  }

  return files
}

async function createZip(files: {
  readme: string
  claude: string
  userInstructions: string
  modules: Record<string, string>
  prompts: Record<string, string>
}) {
  const zip = new JSZip()

  // Add main files in order
  if (files.userInstructions) {
    zip.file('USER_INSTRUCTIONS.md', files.userInstructions)
  }
  if (files.readme) {
    zip.file('README.md', files.readme)
  }
  if (files.claude) {
    zip.file('CLAUDE.md', files.claude)
  }

  // Add modules folder
  if (Object.keys(files.modules).length > 0) {
    const modulesFolder = zip.folder('modules')
    // Sort module files alphabetically for consistency
    const sortedModules = Object.entries(files.modules).sort(([a], [b]) => a.localeCompare(b))
    for (const [name, content] of sortedModules) {
      modulesFolder?.file(`${name}.md`, content)
    }
    console.log(`[CREATE-ZIP] Added ${sortedModules.length} module files`)
  }

  // Add prompts folder
  if (Object.keys(files.prompts).length > 0) {
    const promptsFolder = zip.folder('prompts')
    // Sort prompt files by number prefix to maintain order (01-, 02-, etc.)
    const sortedPrompts = Object.entries(files.prompts).sort(([a], [b]) => {
      const aNum = parseInt(a.match(/^\d+/)?.[0] || '999')
      const bNum = parseInt(b.match(/^\d+/)?.[0] || '999')
      return aNum - bNum
    })
    for (const [name, content] of sortedPrompts) {
      promptsFolder?.file(`${name}.md`, content)
    }
    console.log(`[CREATE-ZIP] Added ${sortedPrompts.length} prompt files`)
  }

  console.log('[CREATE-ZIP] ZIP structure created successfully')
  return await zip.generateAsync({ type: 'nodebuffer' })
}
