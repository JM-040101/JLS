// Claude Sonnet 4 Plan Processing API

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { AIClient } from '@/lib/ai/client'
import { AI_MODELS, SYSTEM_INSTRUCTIONS, TIMEOUT_CONFIG } from '@/lib/ai/config'
import { 
  PlanProcessingRequest, 
  ProcessedPlan, 
  ModuleStructure,
  ClaudePrompt 
} from '@/lib/ai/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      )
    }

    // Verify session ownership and check completion
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.current_phase < 12) {
      return NextResponse.json(
        { error: 'All phases must be completed before generating the plan' },
        { status: 400 }
      )
    }

    // Get all answers for the session
    const { data: answers } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('phase_number')

    if (!answers || answers.length < 12) {
      return NextResponse.json(
        { error: 'Incomplete workflow data' },
        { status: 400 }
      )
    }

    // Build the full plan from all answers
    const fullPlan = answers.reduce((acc, answer) => {
      acc[answer.phase_number] = answer.answers
      return acc
    }, {} as Record<number, Record<string, any>>)

    // Process the plan using Claude Sonnet 4
    const processedPlan = await processPlanWithClaude(
      sessionId,
      fullPlan,
      session.business_idea,
      session.target_audience,
      user.id
    )

    // Store the processed plan
    const { error: storeError } = await supabase
      .from('outputs')
      .upsert({
        session_id: sessionId,
        output_type: 'claudeops_plan',
        content: processedPlan,
        metadata: {
          modules: processedPlan.structure.length,
          prompts: processedPlan.prompts.length,
          generatedAt: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })

    if (storeError) {
      console.error('Error storing processed plan:', storeError)
    }

    return NextResponse.json(processedPlan)

  } catch (error: any) {
    console.error('Error processing plan:', error)
    
    if (error.code === 'RATE_LIMIT') {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: error.retryAfter },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process plan' },
      { status: 500 }
    )
  }
}

async function processPlanWithClaude(
  sessionId: string,
  fullPlan: Record<number, Record<string, any>>,
  businessIdea: string,
  targetAudience: string,
  userId: string
): Promise<ProcessedPlan> {
  const aiClient = new AIClient(userId, sessionId)

  // Generate module structure
  const moduleStructure = await generateModuleStructure(
    aiClient,
    fullPlan,
    businessIdea,
    targetAudience
  )

  // Generate Claude prompts
  const prompts = await generateClaudePrompts(
    aiClient,
    moduleStructure,
    businessIdea
  )

  // Generate README
  const readme = await generateReadme(
    aiClient,
    businessIdea,
    targetAudience,
    moduleStructure
  )

  // Generate CLAUDE.md
  const claudeMd = await generateClaudeMd(
    aiClient,
    moduleStructure,
    prompts,
    businessIdea
  )

  return {
    id: sessionId,
    sessionId,
    structure: moduleStructure,
    prompts,
    readme,
    claudeMd
  }
}

async function generateModuleStructure(
  aiClient: AIClient,
  fullPlan: Record<number, Record<string, any>>,
  businessIdea: string,
  targetAudience: string
): Promise<ModuleStructure[]> {
  const structurePrompt = `
Transform this SaaS blueprint into a modular ClaudeOps structure.

Business Idea: ${businessIdea}
Target Audience: ${targetAudience}

Blueprint Data:
${JSON.stringify(fullPlan, null, 2)}

Create a module structure following these rules:
1. Each module must be under 50KB
2. Modules should be logically grouped (auth, api, database, ui, payments, etc.)
3. Each module needs clear constraints and dependencies
4. Reference appropriate MCP servers (supabase for database/auth, playwright for testing)
5. Follow the ClaudeOps methodology

Return JSON array of modules:
[
  {
    "name": "auth",
    "path": "modules/auth/README.md",
    "content": "Module documentation content...",
    "dependencies": ["database", "api"],
    "mcpServers": ["supabase"],
    "constraints": ["Must use Supabase Auth", "RLS required", "etc"]
  }
]
`

  const response = await aiClient.generate({
    model: AI_MODELS.CLAUDE_SONNET,
    systemInstructions: {
      role: 'system',
      content: SYSTEM_INSTRUCTIONS.planProcessing
    },
    messages: [{ role: 'user', content: structurePrompt }],
    timeout: TIMEOUT_CONFIG.planProcessing,
    trackCost: true
  })

  try {
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse module structure:', error)
    return getDefaultModuleStructure(businessIdea)
  }
}

async function generateClaudePrompts(
  aiClient: AIClient,
  modules: ModuleStructure[],
  businessIdea: string
): Promise<ClaudePrompt[]> {
  const promptGenerationRequest = `
Create executable Claude Code prompts for implementing this SaaS:

Business: ${businessIdea}

Modules:
${modules.map(m => `- ${m.name}: ${m.constraints.join(', ')}`).join('\n')}

Generate specific, actionable prompts that:
1. Reference the correct MCP servers
2. Include clear expected outputs
3. Follow a logical implementation order
4. Are copy-pasteable into Claude Code

Return JSON array:
[
  {
    "id": "setup-auth",
    "title": "Set up Supabase authentication",
    "description": "Configure email/password and OAuth",
    "prompt": "Full prompt text here...",
    "mcpServers": ["supabase"],
    "expectedOutput": "What should be created",
    "dependencies": ["database-setup"]
  }
]
`

  const response = await aiClient.generate({
    model: AI_MODELS.CLAUDE_SONNET,
    systemInstructions: {
      role: 'system',
      content: SYSTEM_INSTRUCTIONS.planProcessing
    },
    messages: [{ role: 'user', content: promptGenerationRequest }],
    timeout: TIMEOUT_CONFIG.planProcessing,
    trackCost: true
  })

  try {
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse prompts:', error)
    return getDefaultPrompts(modules)
  }
}

async function generateReadme(
  aiClient: AIClient,
  businessIdea: string,
  targetAudience: string,
  modules: ModuleStructure[]
): Promise<string> {
  const readmePrompt = `
Create a comprehensive README.md for this SaaS project:

Business: ${businessIdea}
Target Audience: ${targetAudience}
Modules: ${modules.map(m => m.name).join(', ')}

Include:
1. Project overview
2. Features list
3. Tech stack
4. Getting started guide
5. Project structure
6. Development workflow
7. Deployment instructions

Use clear markdown formatting with proper headers, lists, and code blocks.
Make it developer-friendly and actionable.
`

  const response = await aiClient.generate({
    model: AI_MODELS.CLAUDE_SONNET,
    systemInstructions: {
      role: 'system',
      content: SYSTEM_INSTRUCTIONS.export
    },
    messages: [{ role: 'user', content: readmePrompt }],
    timeout: TIMEOUT_CONFIG.export,
    trackCost: true
  })

  return response
}

async function generateClaudeMd(
  aiClient: AIClient,
  modules: ModuleStructure[],
  prompts: ClaudePrompt[],
  businessIdea: string
): Promise<string> {
  const claudeMdPrompt = `
Create a CLAUDE.md file for this project that guides Claude Code instances.

Business: ${businessIdea}
Modules: ${modules.length} modules
Prompts: ${prompts.length} implementation prompts

Structure the CLAUDE.md to include:
1. Project context and goals
2. Module architecture overview
3. Key constraints and requirements
4. MCP server configuration needs
5. Implementation order and dependencies
6. Common patterns and conventions
7. Testing and validation requirements

This file will be used by future Claude Code instances to understand the project.
Follow the standard CLAUDE.md format with clear sections and constraints.
`

  const response = await aiClient.generate({
    model: AI_MODELS.CLAUDE_SONNET,
    systemInstructions: {
      role: 'system',
      content: SYSTEM_INSTRUCTIONS.planProcessing
    },
    messages: [{ role: 'user', content: claudeMdPrompt }],
    timeout: TIMEOUT_CONFIG.export,
    trackCost: true
  })

  return response
}

function getDefaultModuleStructure(businessIdea: string): ModuleStructure[] {
  return [
    {
      name: 'auth',
      path: 'modules/auth/README.md',
      content: `# Authentication Module\n\nImplements user authentication for ${businessIdea}`,
      dependencies: ['database'],
      mcpServers: ['supabase'],
      constraints: ['Use Supabase Auth', 'Implement RLS', 'Support OAuth']
    },
    {
      name: 'database',
      path: 'modules/database/README.md',
      content: `# Database Module\n\nDatabase schema and migrations for ${businessIdea}`,
      dependencies: [],
      mcpServers: ['supabase'],
      constraints: ['PostgreSQL with Supabase', 'Row Level Security', 'Audit trails']
    },
    {
      name: 'api',
      path: 'modules/api/README.md',
      content: `# API Module\n\nREST API endpoints for ${businessIdea}`,
      dependencies: ['database', 'auth'],
      mcpServers: [],
      constraints: ['Next.js API routes', 'Type-safe', 'Error handling']
    },
    {
      name: 'ui',
      path: 'modules/ui/README.md',
      content: `# UI Module\n\nUser interface components for ${businessIdea}`,
      dependencies: ['api', 'auth'],
      mcpServers: [],
      constraints: ['React components', 'Tailwind CSS', 'Responsive design']
    },
    {
      name: 'payments',
      path: 'modules/payments/README.md',
      content: `# Payments Module\n\nSubscription and payment processing for ${businessIdea}`,
      dependencies: ['database', 'api'],
      mcpServers: [],
      constraints: ['Stripe integration', 'Webhook handling', 'EU VAT compliance']
    }
  ]
}

function getDefaultPrompts(modules: ModuleStructure[]): ClaudePrompt[] {
  return modules.map((module, index) => ({
    id: `setup-${module.name}`,
    title: `Set up ${module.name} module`,
    description: `Implement the ${module.name} functionality`,
    prompt: `Implement the ${module.name} module following the constraints: ${module.constraints.join(', ')}`,
    mcpServers: module.mcpServers || [],
    expectedOutput: `Complete ${module.name} implementation with all required features`,
    dependencies: index > 0 ? [`setup-${modules[index - 1].name}`] : []
  }))
}