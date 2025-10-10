import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId } = await request.json()

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Fetch phase templates
    const { data: phaseTemplates } = await supabase
      .from('phase_templates')
      .select('*')
      .order('phase_number', { ascending: true })

    // Fetch answers
    const { data: answers } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', session.id)
      .order('phase_number', { ascending: true })

    if (!phaseTemplates || !answers) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // Load knowledge base files
    const workflowInstructions = await loadFile('/workspaces/JLS/ai-workflow/12-phase-workflow-instructions.md')
    const knowledgeBase1 = await loadFile('/workspaces/JLS/ai-workflow/knowledge-base-1.md')
    const knowledgeBase2 = await loadFile('/workspaces/JLS/ai-workflow/knowledge-base-2.md')

    // Transform answers into structured blueprint data
    const blueprintData = formatBlueprintData(session, phaseTemplates, answers)

    // Generate README.md
    const readme = await generateWithClaude(
      'README',
      blueprintData,
      workflowInstructions,
      knowledgeBase1,
      knowledgeBase2
    )

    // Generate CLAUDE.md
    const claudeMd = await generateWithClaude(
      'CLAUDE',
      blueprintData,
      workflowInstructions,
      knowledgeBase1,
      knowledgeBase2
    )

    // Generate COMPLETE-PLAN.md
    const completePlan = await generateWithClaude(
      'COMPLETE_PLAN',
      blueprintData,
      workflowInstructions,
      knowledgeBase1,
      knowledgeBase2
    )

    return NextResponse.json({
      success: true,
      documents: {
        readme,
        claudeMd,
        completePlan,
      },
    })
  } catch (error) {
    console.error('Transformation error:', error)
    return NextResponse.json({ error: 'Transformation failed' }, { status: 500 })
  }
}

async function loadFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch (error) {
    console.error(`Failed to load file: ${filePath}`, error)
    return ''
  }
}

function formatBlueprintData(session: any, phases: any[], answers: any[]): string {
  let output = `# SaaS Blueprint: ${session.app_description}\n\n`
  output += `**Created**: ${new Date(session.created_at).toLocaleDateString()}\n\n`

  phases.forEach((phase) => {
    const phaseAnswers = answers.filter((a) => a.phase_number === phase.phase_number)

    output += `## Phase ${phase.phase_number}: ${phase.title}\n\n`
    output += `${phase.description}\n\n`

    phaseAnswers.forEach((answer) => {
      output += `**Q: ${answer.question_text}**\n`
      output += `A: ${answer.answer_text}\n\n`
    })

    output += `---\n\n`
  })

  return output
}

async function generateWithClaude(
  docType: 'README' | 'CLAUDE' | 'COMPLETE_PLAN',
  blueprintData: string,
  workflowInstructions: string,
  knowledgeBase1: string,
  knowledgeBase2: string
): Promise<string> {
  const prompts = {
    README: `You are a senior technical writer creating a professional README.md for a SaaS product.

Using the blueprint data below, create an executive summary README that:
- Provides a clear project overview (NOT question/answer format)
- Highlights the problem being solved and target market
- Outlines the core features and value proposition
- Describes the tech stack and architecture at a high level
- Includes a "Getting Started" section with clear next steps
- Is written for developers, investors, and collaborators
- Uses professional markdown formatting with appropriate sections

Make it compelling, concise, and action-oriented. Focus on WHAT the product does and WHY it matters, not the raw Q&A.`,

    CLAUDE: `You are a senior SaaS architect creating Claude Code implementation instructions (CLAUDE.md).

Using the blueprint data and knowledge bases below, create a comprehensive CLAUDE.md that:
- Provides clear guidance for Claude Code to build this SaaS application
- Breaks down implementation into logical modules (auth, database, API, UI, payments, etc.)
- Includes specific technical decisions from the blueprint (framework choices, database schema, etc.)
- Provides executable prompts for each major feature
- References the knowledge base patterns and best practices
- Follows the SaaS Playbook structure for scalability and maintainability
- Includes code organization, file structure, and naming conventions
- Adds security considerations and compliance requirements

Format this as a technical specification that Claude Code can follow to build the complete application.

Reference these knowledge bases for best practices:
${knowledgeBase1.substring(0, 5000)}

${knowledgeBase2.substring(0, 5000)}`,

    COMPLETE_PLAN: `You are a product strategist creating a comprehensive SaaS product plan.

Using the blueprint data below, create a COMPLETE-PLAN.md that:
- Transforms all 12 phases into a cohesive narrative
- Provides strategic context for each major decision
- Includes implementation priorities and trade-offs
- Maps out the roadmap from MVP → V1.5 → Long-term
- Highlights risks, assumptions, and validation plans
- Adds specific metrics and success criteria
- Connects all phases into a unified product vision

Write this as a strategic document that founders can use to:
- Pitch to investors
- Brief their development team
- Make product decisions
- Track progress against the original vision

Make it comprehensive but scannable with clear sections and bullet points.`,
  }

  const systemPrompt = `${prompts[docType]}

IMPORTANT GUIDELINES:
- Transform the Q&A format into professional prose
- Use the knowledge bases to add best practices and patterns
- Be specific and actionable, not generic
- Focus on the unique aspects of this SaaS product
- Write at a senior technical level
- Use markdown formatting for clarity

Workflow Context:
${workflowInstructions.substring(0, 3000)}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Here is the SaaS blueprint data to transform:\n\n${blueprintData}`,
      },
    ],
  })

  const textContent = message.content.find((block) => block.type === 'text')
  return textContent ? (textContent as any).text : ''
}
