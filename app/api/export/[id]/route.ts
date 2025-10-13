import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import JSZip from 'jszip'
import { readFileSync } from 'fs'
import { join } from 'path'

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
      console.error('Error fetching plan:', planError)
      return NextResponse.json({ error: 'Plan not found. Please generate and approve a plan first.' }, { status: 404 })
    }

    if (plan.status !== 'approved') {
      return NextResponse.json(
        { error: 'Plan must be approved before export. Please review and approve your plan first.' },
        { status: 400 }
      )
    }

    // Use edited content if available, otherwise use original content
    const buildingPlan = plan.edited_content || plan.content

    console.log('Using approved building plan for export...')

    // 5. Call Claude to transform plan into files
    console.log('Calling Claude to generate export files...')
    const files = await callClaude(buildingPlan)

    if (!files.readme && !files.claude) {
      return NextResponse.json({ error: 'Failed to generate export files' }, { status: 500 })
    }

    // 7. Create ZIP file
    console.log('Creating ZIP file...')
    const zipBuffer = await createZip(files)

    // 8. Track export in database
    await supabase.from('exports').insert({
      user_id: user.id,
      session_id: sessionId
    })

    // 9. Return ZIP file
    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="saas-blueprint.zip"'
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed. Please try again.' },
      { status: 500 }
    )
  }
}

async function callClaude(buildingPlan: string) {
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

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
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

  return parseClaudeOutput(message.content)
}

function parseClaudeOutput(content: any) {
  // Extract text from Claude response
  const text = typeof content === 'string' ? content : content[0]?.text || ''

  const files = {
    readme: '',
    claude: '',
    modules: {} as Record<string, string>,
    prompts: {} as Record<string, string>
  }

  // Parse files from Claude output
  // Format: ## File: path/to/file.md
  const fileMatches = text.matchAll(/## File: (.+?)\n```(?:markdown)?\n([\s\S]+?)\n```/g)

  let matchCount = 0
  for (const match of fileMatches) {
    matchCount++
    const filePath = match[1].trim()
    const fileContent = match[2]

    console.log(`Parsing file: ${filePath}`)

    if (filePath === 'README.md' || filePath.endsWith('/README.md')) {
      files.readme = fileContent
    } else if (filePath === 'CLAUDE.md' || filePath.endsWith('/CLAUDE.md')) {
      files.claude = fileContent
    } else if (filePath.includes('modules/') || filePath.includes('Claude-')) {
      const moduleName = filePath.split('/').pop()?.replace(/\.(md|MD)$/, '') || 'module'
      files.modules[moduleName] = fileContent
    } else if (filePath.includes('prompts/')) {
      const promptName = filePath.split('/').pop()?.replace(/\.(md|MD)$/, '') || 'prompt'
      files.prompts[promptName] = fileContent
    }
  }

  console.log(`Parsed ${matchCount} files: ${files.readme ? 'README' : ''} ${files.claude ? 'CLAUDE' : ''} modules=${Object.keys(files.modules).length} prompts=${Object.keys(files.prompts).length}`)

  // If no files were parsed, try to extract at least README and CLAUDE from full text
  if (matchCount === 0) {
    console.warn('No files parsed in expected format. Extracting from full text...')
    files.readme = text.substring(0, Math.min(5000, text.length))
    files.claude = 'See README.md for full content.'
  }

  return files
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
