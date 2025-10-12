import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
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
        { error: `Complete all 12 phases before exporting. Currently have ${answers?.length || 0} phases completed.` },
        { status: 400 }
      )
    }

    // 5. Call GPT-5 (using GPT-4 for now) to create building plan
    console.log('Calling GPT-4 to create building plan...')
    const buildingPlan = await callGPT(answers)

    if (!buildingPlan) {
      return NextResponse.json({ error: 'Failed to generate building plan' }, { status: 500 })
    }

    // 6. Call Claude to transform plan into files
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
    return new Response(zipBuffer, {
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
    model: "gpt-4-turbo", // Use gpt-4-turbo for now
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
