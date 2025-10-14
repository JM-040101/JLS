import { inngest } from './client'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

// Inngest function to generate plan (no timeout limits!)
export const generatePlanFunction = inngest.createFunction(
  { id: 'generate-plan' },
  { event: 'plan/generate.requested' },
  async ({ event, step }) => {
    const { jobId, sessionId, userId } = event.data

    console.log('[INNGEST] Starting plan generation for job:', jobId)

    // Initialize Supabase with service role key (for server-side operations)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
      // Step 1: Update job status to processing
      await step.run('update-job-to-processing', async () => {
        console.log('[INNGEST] Updating job status to processing')
        await supabase
          .from('jobs')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId)
      })

      // Step 2: Fetch answers
      const answers = await step.run('fetch-answers', async () => {
        console.log('[INNGEST] Fetching answers for session:', sessionId)
        const { data, error } = await supabase
          .from('answers')
          .select('phase_number, answer_text, question_text')
          .eq('session_id', sessionId)
          .order('phase_number', { ascending: true })

        if (error || !data) {
          throw new Error(`Failed to fetch answers: ${error?.message}`)
        }

        const uniquePhases = new Set(data.map(a => a.phase_number)).size
        if (uniquePhases !== 12) {
          throw new Error(`Incomplete workflow. Expected 12 phases, found ${uniquePhases}`)
        }

        console.log('[INNGEST] Found 12 complete phases')
        return data
      })

      // Step 3: Call GPT-4 (this can take as long as needed!)
      const buildingPlan = await step.run('call-gpt-4', async () => {
        console.log('[INNGEST] Calling GPT-4...')
        const plan = await callGPT(answers)
        console.log('[INNGEST] GPT-4 response received, length:', plan.length)
        return plan
      })

      // Step 4: Save plan to database
      const planId = await step.run('save-plan', async () => {
        console.log('[INNGEST] Saving plan to database')

        // Check if plan already exists
        const { data: existingPlan } = await supabase
          .from('plans')
          .select('id')
          .eq('session_id', sessionId)
          .single()

        if (existingPlan) {
          // Update existing plan
          const { data: updatedPlan, error } = await supabase
            .from('plans')
            .update({
              content: buildingPlan,
              edited_content: null,
              status: 'generated',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPlan.id)
            .select('id')
            .single()

          if (error) throw new Error(`Failed to update plan: ${error.message}`)
          return updatedPlan.id
        } else {
          // Create new plan
          const { data: newPlan, error } = await supabase
            .from('plans')
            .insert({
              session_id: sessionId,
              user_id: userId,
              content: buildingPlan,
              status: 'generated'
            })
            .select('id')
            .single()

          if (error) throw new Error(`Failed to create plan: ${error.message}`)
          return newPlan.id
        }
      })

      // Step 5: Update job status to completed
      await step.run('update-job-to-completed', async () => {
        console.log('[INNGEST] Updating job status to completed')
        await supabase
          .from('jobs')
          .update({
            status: 'completed',
            result: {
              plan: buildingPlan,
              planId: planId,
              status: 'generated'
            },
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId)
      })

      console.log('[INNGEST] Plan generation completed successfully!')
      return { success: true, planId }

    } catch (error) {
      console.error('[INNGEST] Error generating plan:', error)

      // Update job status to failed
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      throw error
    }
  }
)

// GPT-4 call function (moved from job processor)
async function callGPT(answers: Array<{ phase_number: number; answer_text: string; question_text: string }>) {
  console.log('[CALL-GPT] Starting GPT-4 call with', answers.length, 'answers')

  try {
    // Verify API key exists
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

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
    const phaseGroups = answers.reduce((acc, answer) => {
      if (!acc[answer.phase_number]) {
        acc[answer.phase_number] = []
      }
      acc[answer.phase_number].push(`Q: ${answer.question_text}\nA: ${answer.answer_text}`)
      return acc
    }, {} as Record<number, string[]>)

    const formattedAnswers = Object.entries(phaseGroups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([phase, qas]) => `**Phase ${phase}**:\n${qas.join('\n\n')}`)
      .join('\n\n---\n\n')

    console.log('[CALL-GPT] Calling OpenAI API...')
    const startTime = Date.now()

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert SaaS architect and technical planning consultant. Your role is to transform user's workflow answers into a comprehensive, Claude-ready SaaS building plan by deeply analyzing their requirements and applying the structured knowledge bases provided.

## YOUR CRITICAL TASK

**DO NOT** simply echo or restate the user's answers. That is unacceptable.

**YOU MUST** act as a senior SaaS architect who:
1. Analyzes the user's raw answers to extract the core business requirements
2. Applies proven patterns, rules, and examples from the knowledge bases
3. Makes specific technology and architecture recommendations with clear rationale
4. Synthesizes everything into a comprehensive, actionable building plan

[Full prompt from job processor route - truncated for brevity]

## KNOWLEDGE BASE CONTENT

${kb1}

---

${kb2}`
        },
        {
          role: "user",
          content: `Create a comprehensive SaaS building plan by analyzing these 12-phase workflow answers and synthesizing them with the knowledge base principles, patterns, and best practices.

## USER'S 12-PHASE WORKFLOW ANSWERS

${formattedAnswers}

---

Now generate the complete building plan using the structured format provided in the system instructions. Reference specific knowledge base sections throughout to justify every architectural decision.`
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    })

    const endTime = Date.now()
    const durationSeconds = ((endTime - startTime) / 1000).toFixed(2)

    console.log('[CALL-GPT] GPT-4 response received:', {
      model: completion.model,
      finishReason: completion.choices[0].finish_reason,
      tokensUsed: completion.usage,
      durationSeconds
    })

    const content = completion.choices[0].message.content

    if (!content) {
      throw new Error('GPT-4 returned empty response')
    }

    return content
  } catch (error) {
    console.error('[CALL-GPT] Error calling GPT-4:', error)
    throw error
  }
}

// Inngest function to generate export files (no timeout limits!)
export const generateExportFunction = inngest.createFunction(
  { id: 'generate-export' },
  { event: 'export/generate.requested' },
  async ({ event, step }) => {
    const { exportId, sessionId, userId, planId } = event.data

    console.log('[INNGEST-EXPORT] Starting export generation for session:', sessionId)

    // Initialize Supabase with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
      // Step 1: Update export status to processing
      await step.run('update-export-to-processing', async () => {
        console.log('[INNGEST-EXPORT] Updating export status to processing')
        await supabase
          .from('exports')
          .update({
            status: 'processing',
            progress: 5,
            progress_message: 'Starting export generation...',
            updated_at: new Date().toISOString()
          })
          .eq('id', exportId)
      })

      // Step 2: Fetch approved plan
      const plan = await step.run('fetch-plan', async () => {
        console.log('[INNGEST-EXPORT] Fetching plan:', planId)

        await supabase
          .from('exports')
          .update({
            progress: 10,
            progress_message: 'Loading approved plan...',
            updated_at: new Date().toISOString()
          })
          .eq('id', exportId)

        const { data, error } = await supabase
          .from('plans')
          .select('content, edited_content, status')
          .eq('id', planId)
          .single()

        if (error || !data) {
          throw new Error(`Failed to fetch plan: ${error?.message}`)
        }

        if (data.status !== 'approved') {
          throw new Error('Plan must be approved before export')
        }

        return data.edited_content || data.content
      })

      // Step 3: Call hybrid models (GPT-4 + Claude in parallel, no timeout!)
      const files = await step.run('call-hybrid-models', async () => {
        console.log('[INNGEST-EXPORT] Calling hybrid models (GPT-4 + Claude) to generate files...')

        await supabase
          .from('exports')
          .update({
            progress: 15,
            progress_message: 'Generating documentation with AI...',
            updated_at: new Date().toISOString()
          })
          .eq('id', exportId)

        const exportFiles = await callHybridForExportInParts(plan, exportId, supabase)
        console.log('[INNGEST-EXPORT] Hybrid generation completed:', {
          hasReadme: !!exportFiles.readme,
          hasClaude: !!exportFiles.claude,
          hasUserInstructions: !!exportFiles.userInstructions,
          hasQuickStart: !!exportFiles.quickStart,
          moduleCount: Object.keys(exportFiles.modules).length,
          promptCount: Object.keys(exportFiles.prompts).length
        })
        return exportFiles
      })

      // Step 4: Update to 95% before saving files
      await step.run('update-to-95', async () => {
        console.log('[INNGEST-EXPORT] Updating progress to 95%')
        const { error } = await supabase
          .from('exports')
          .update({
            progress: 95,
            progress_message: 'Finalizing export...',
            updated_at: new Date().toISOString()
          })
          .eq('id', exportId)

        if (error) {
          console.error('[INNGEST-EXPORT] Failed to update to 95%:', error)
          throw new Error(`Failed to update progress: ${error.message}`)
        }
      })

      // Step 5: Validate file sizes before saving
      await step.run('validate-file-sizes', async () => {
        const filesJson = JSON.stringify(files)
        const sizeInMB = filesJson.length / 1024 / 1024

        console.log('[INNGEST-EXPORT] File sizes:', {
          readme: files.readme?.length || 0,
          claude: files.claude?.length || 0,
          userInstructions: files.userInstructions?.length || 0,
          quickStart: files.quickStart?.length || 0,
          moduleCount: Object.keys(files.modules).length,
          promptCount: Object.keys(files.prompts).length,
          totalJsonSizeMB: sizeInMB.toFixed(2)
        })

        // JSONB column limit is typically 1GB, but we should keep it reasonable
        if (sizeInMB > 50) {
          console.warn('[INNGEST-EXPORT] WARNING: Files object is very large:', sizeInMB.toFixed(2), 'MB')
        }
      })

      // Step 6: Save files and mark as completed
      await step.run('save-export-files-and-complete', async () => {
        console.log('[INNGEST-EXPORT] Saving export files and marking as completed')

        const { error } = await supabase
          .from('exports')
          .update({
            status: 'completed',
            progress: 100,
            progress_message: 'Export complete!',
            files: files,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', exportId)

        if (error) {
          console.error('[INNGEST-EXPORT] Failed to save files and complete export:', error)
          throw new Error(`Failed to save export: ${error.message}`)
        }

        console.log('[INNGEST-EXPORT] Export successfully saved to database')
      })

      console.log('[INNGEST-EXPORT] Export generation completed successfully!')
      return { success: true, exportId, files }

    } catch (error) {
      console.error('[INNGEST-EXPORT] Error generating export:', error)

      // Update export status to failed
      await supabase
        .from('exports')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', exportId)

      throw error
    }
  }
)

// Helper function to run promises in batches with delays (avoid rate limits)
async function runInBatches<T>(
  items: T[],
  batchSize: number,
  delayMs: number,
  processFn: (item: T) => Promise<any>
): Promise<any[]> {
  const results: any[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    console.log(`[BATCH] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} (${batch.length} items)`)

    const batchResults = await Promise.all(batch.map(processFn))
    results.push(...batchResults)

    // Wait between batches (except after the last batch)
    if (i + batchSize < items.length) {
      console.log(`[BATCH] Waiting ${delayMs}ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return results
}

// Hybrid call function - GPT-4 (fast, structured) + Claude (quality, narrative) - SPLIT into individual calls
async function callHybridForExportInParts(buildingPlan: string, exportId: string, supabase: any) {
  console.log('[CALL-HYBRID] Starting hybrid export generation (GPT-4 individual calls + Claude)')

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured')
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 120000, // 2 minutes max per API call
      maxRetries: 2 // Retry twice on failures
    })

    // Load knowledge bases
    const kb1 = readFileSync(
      join(process.cwd(), 'claude-instructions/claude-knowledge-base-1.md'),
      'utf-8'
    )
    const kb2 = readFileSync(
      join(process.cwd(), 'claude-instructions/claude-knowledge-base-2.md'),
      'utf-8'
    )

    console.log('[CALL-HYBRID] Starting generation...')
    await supabase
      .from('exports')
      .update({
        progress: 20,
        progress_message: 'Generating files individually for completeness...',
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId)

    const startTime = Date.now()

    // Define module specs
    const moduleSpecs = [
      { name: 'auth', desc: 'Authentication strategy, user roles, session management, JWT/OAuth flows, security best practices, example middleware code' },
      { name: 'api', desc: 'API architecture, endpoint list, request/response examples, rate limiting, error handling, validation schemas' },
      { name: 'database', desc: 'Complete schema with SQL, multi-tenancy, RLS policies, migrations, indexing, query optimization' },
      { name: 'ui', desc: 'Component hierarchy, design system tokens, routing, state management, responsive design, example code' },
      { name: 'payments', desc: 'Stripe integration, subscription tiers, webhook handling, EU VAT compliance, payment flows, error recovery' },
      { name: 'deployment', desc: 'Vercel deployment checklist, environment variables, CI/CD pipeline, domain config, monitoring, rollback' },
      { name: 'testing', desc: 'Testing strategy, unit/integration/E2E test examples, coverage requirements, mocking strategies' },
      { name: 'security', desc: 'Security checklist, input validation, XSS/CSRF prevention, SQL injection prevention, rate limiting' }
    ]

    // Define prompt specs
    const promptSpecs = [
      { num: '01', name: 'setup-project', desc: 'Context, prerequisites, Next.js 14 setup, dependencies, folder structure, environment variables, success criteria, next steps' },
      { num: '02', name: 'setup-database', desc: 'Context, Supabase setup, schema SQL, RLS policies, migrations, seeding, connection verification, next steps' },
      { num: '03', name: 'setup-auth', desc: 'Context, auth flow diagram, Supabase Auth setup, middleware code, protected routes, session management, testing, next steps' },
      { num: '04', name: 'create-api', desc: 'Context, API architecture, endpoint list, route handlers, input validation with Zod, error handling, rate limiting, testing, next steps' },
      { num: '05', name: 'create-ui', desc: 'Context, component hierarchy, design system, core components, routing, state management, form handling, responsive testing, next steps' },
      { num: '06', name: 'integrate-payments', desc: 'Context, payment flow, Stripe setup, API keys, subscription code, webhooks, payment intents, EU VAT, testing with Stripe CLI, next steps' },
      { num: '07', name: 'testing', desc: 'Context, testing strategy, Jest/Vitest setup, unit tests, integration tests, component tests, E2E with Playwright, coverage, next steps' },
      { num: '08', name: 'security', desc: 'Context, security checklist, input validation, XSS prevention, CSRF tokens, rate limiting with Upstash, security headers, penetration testing, next steps' },
      { num: '09', name: 'deploy', desc: 'Context, deployment architecture, Vercel setup, environment variables, production migrations, domain/SSL, monitoring, rollback, post-deployment checklist, maintenance' }
    ]

    // Generate modules in batches (4 at a time to avoid rate limits)
    console.log('[CALL-HYBRID-GPT] Generating 8 modules in batches of 4...')

    await supabase
      .from('exports')
      .update({
        progress: 25,
        progress_message: 'Generating 8 modules (4 at a time)...',
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId)

    const moduleResultsArray = await runInBatches(
      moduleSpecs,
      4, // Batch size: 4 calls at a time (4 × 7k tokens = 28k < 30k limit)
      60000, // Wait 60 seconds between batches (rate limit resets per minute)
      async (spec) => {
        console.log(`[CALL-HYBRID-GPT] Generating module: ${spec.name}`)

        const modulePrompt = `You are an expert software architect. Generate ONE COMPLETE, DETAILED module README file.

**CRITICAL: This module must be 600-900 words with ALL sections completed. Include real code examples.**

Generate this file:

**modules/${spec.name}/README.md** - ${spec.desc}

Format EXACTLY as:
## File: modules/${spec.name}/README.md
\`\`\`markdown
[COMPLETE content with code examples - minimum 600 words]
\`\`\`

# Knowledge Base 1
${kb1}

# Knowledge Base 2
${kb2}

# Building Plan
${buildingPlan}

**Write COMPLETE module with ALL code examples. DO NOT truncate.**`

        const moduleResponse = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [{ role: "user", content: modulePrompt }],
          max_tokens: 4096,
          temperature: 0.7
        })

        console.log(`[CALL-HYBRID-GPT] Module ${spec.name} completed:`, {
          finishReason: moduleResponse.choices[0].finish_reason,
          tokensUsed: moduleResponse.usage
        })

        const content = moduleResponse.choices[0].message.content || ''
        const parsed = parseClaudeOutput(content)

        return {
          name: spec.name,
          content: parsed.modules[spec.name] || content
        }
      }
    )

    const moduleResults: Record<string, string> = {}
    moduleResultsArray.forEach(({ name, content }) => {
      moduleResults[name] = content
    })

    console.log('[CALL-HYBRID-GPT] All modules completed')

    // Generate prompts in batches (4 at a time to avoid rate limits)
    console.log('[CALL-HYBRID-GPT] Generating 9 prompts in batches of 4...')

    await supabase
      .from('exports')
      .update({
        progress: 45,
        progress_message: 'Generating 9 prompts (4 at a time)...',
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId)

    const promptResultsArray = await runInBatches(
      promptSpecs,
      4, // Batch size: 4 calls at a time (4 × 7k tokens = 28k < 30k limit)
      60000, // Wait 60 seconds between batches
      async (spec) => {
        console.log(`[CALL-HYBRID-GPT] Generating prompt: ${spec.num}-${spec.name}`)

        const promptPrompt = `You are an expert developer coach. Generate ONE COMPLETE, ACTIONABLE implementation prompt.

**CRITICAL: This prompt must be 500-750 words with DETAILED steps and code examples.**

Generate this file:

**prompts/${spec.num}-${spec.name}.md** - ${spec.desc}

Format EXACTLY as:
## File: prompts/${spec.num}-${spec.name}.md
\`\`\`markdown
[COMPLETE prompt with ALL code examples and commands - minimum 500 words]
\`\`\`

# Knowledge Base 1
${kb1}

# Knowledge Base 2
${kb2}

# Building Plan
${buildingPlan}

**Write COMPLETE prompt with ALL code examples. DO NOT truncate.**`

        const promptResponse = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [{ role: "user", content: promptPrompt }],
          max_tokens: 4096,
          temperature: 0.7
        })

        console.log(`[CALL-HYBRID-GPT] Prompt ${spec.num}-${spec.name} completed:`, {
          finishReason: promptResponse.choices[0].finish_reason,
          tokensUsed: promptResponse.usage
        })

        const content = promptResponse.choices[0].message.content || ''
        const parsed = parseClaudeOutput(content)
        const promptKey = `${spec.num}-${spec.name}`

        return {
          key: promptKey,
          content: parsed.prompts[promptKey] || content
        }
      }
    )

    const promptResults: Record<string, string> = {}
    promptResultsArray.forEach(({ key, content }) => {
      promptResults[key] = content
    })

    console.log('[CALL-HYBRID-GPT] All prompts completed')

    // GPT-4 calls complete, now run Claude for core docs
    const [claudeDocsResult] = await Promise.all([

      // Claude Call: Generate 4 core documentation files (quality, narrative)
      (async () => {
        console.log('[CALL-HYBRID-CLAUDE] Generating 4 core documentation files...')
        const docsPrompt = `You are an expert technical writer. Generate 4 COMPLETE, COMPREHENSIVE, POLISHED documentation files. These are the most important user-facing docs, so quality is critical.

**CRITICAL INSTRUCTIONS:**
- Each file must be 1000-2500 words with exceptional detail and clarity
- Include ALL sections with complete paragraphs
- Write in a clear, professional, engaging tone
- Include practical examples and diagrams where helpful
- End each file with clear next steps
- DO NOT truncate or use placeholders

Generate EXACTLY 4 files:

1. **USER_INSTRUCTIONS.md** (2000+ words)
   - Warm welcome explaining what they received
   - Complete inventory of all files in the export
   - How to navigate the documentation structure
   - Detailed step-by-step guide to using Claude Code with CLAUDE.md
   - How to use the numbered prompt files in sequence (01-09)
   - Prerequisites and setup requirements
   - Tips for customization and adaptation
   - Troubleshooting common issues
   - Where to get help and additional resources

2. **README.md** (1500+ words)
   - Compelling project name and tagline
   - Detailed problem statement with context
   - Target audience analysis with use cases
   - Core features broken down by MVP/Growth/Enterprise phases
   - Complete tech stack with rationale for each choice
   - Architecture overview with ASCII diagram
   - Getting started guide with prerequisites
   - Project structure overview
   - Development workflow
   - Contributing guidelines
   - License and credits

3. **CLAUDE.md** (1200+ words)
   - Comprehensive project overview
   - Module structure with detailed links to each module README
   - Development workflow and best practices
   - Code standards and conventions
   - Testing requirements and strategies
   - Database schema with relationships diagram
   - API endpoint documentation with examples
   - Security requirements and implementation notes
   - Performance considerations and optimization tips
   - Deployment and monitoring guidance

4. **QUICK_START.md** (800+ words)
   - Prerequisites checklist
   - 5-minute setup guide (step-by-step commands)
   - Environment variables template with explanations
   - Database setup and migration commands
   - First-time run instructions
   - Verification steps to confirm everything works
   - Common first-run issues and fixes
   - Next steps after successful setup

Format each file EXACTLY as:
## File: filename.md
\`\`\`markdown
[COMPLETE file content - exceptional quality]
\`\`\`

# Knowledge Base 1
${kb1}

# Knowledge Base 2
${kb2}

# Building Plan
${buildingPlan}

**REMINDER: These are the primary user-facing docs. Exceptional quality required.**`

        const docsResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192,
          messages: [{ role: "user", content: docsPrompt }]
        })

        console.log('[CALL-HYBRID-CLAUDE] Docs completed:', {
          stopReason: docsResponse.stop_reason,
          tokensUsed: docsResponse.usage
        })

        if (docsResponse.stop_reason === 'max_tokens') {
          console.warn('[CALL-HYBRID-CLAUDE] WARNING: Hit max_tokens - docs may be incomplete')
        }

        await supabase
          .from('exports')
          .update({
            progress: 80,
            progress_message: 'Generated core documentation files...',
            updated_at: new Date().toISOString()
          })
          .eq('id', exportId)

        return docsResponse.content
      })()
    ])

    const endTime = Date.now()
    const totalDuration = ((endTime - startTime) / 1000).toFixed(2)
    console.log(`[CALL-HYBRID] All sequential calls completed in ${totalDuration}s`)

    // Parse Claude response
    console.log('[CALL-HYBRID] Parsing Claude response...')
    await supabase
      .from('exports')
      .update({
        progress: 85,
        progress_message: 'Processing generated content...',
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId)

    const docsParsed = parseClaudeOutput(claudeDocsResult)

    // Combine results from individual calls
    const combinedFiles = {
      readme: docsParsed.readme,
      claude: docsParsed.claude,
      userInstructions: docsParsed.userInstructions,
      quickStart: docsParsed.quickStart || '',
      modules: { ...moduleResults },
      prompts: { ...promptResults }
    }

    await supabase
      .from('exports')
      .update({
        progress: 90,
        progress_message: 'Packaging 21 files...',
        updated_at: new Date().toISOString()
      })
      .eq('id', exportId)

    // Validate completeness
    const totalFiles = 4 + Object.keys(combinedFiles.modules).length + Object.keys(combinedFiles.prompts).length
    const expectedFiles = 21 // 4 core docs + 8 modules + 9 prompts

    console.log('[CALL-HYBRID] Generation summary:', {
      hasReadme: !!combinedFiles.readme,
      hasClaude: !!combinedFiles.claude,
      hasUserInstructions: !!combinedFiles.userInstructions,
      hasQuickStart: !!combinedFiles.quickStart,
      moduleCount: Object.keys(combinedFiles.modules).length,
      moduleNames: Object.keys(combinedFiles.modules).sort(),
      promptCount: Object.keys(combinedFiles.prompts).length,
      promptNames: Object.keys(combinedFiles.prompts).sort(),
      totalFilesGenerated: totalFiles,
      expectedFiles: expectedFiles,
      completeness: `${Math.round((totalFiles / expectedFiles) * 100)}%`,
      totalDurationSeconds: totalDuration
    })

    // Warn about missing files
    const expectedModules = ['auth', 'api', 'database', 'ui', 'payments', 'deployment', 'testing', 'security']
    const missingModules = expectedModules.filter(m => !combinedFiles.modules[m])
    if (missingModules.length > 0) {
      console.warn('[CALL-HYBRID] Missing modules:', missingModules)
    }

    const expectedPrompts = ['01-setup-project', '02-setup-database', '03-setup-auth', '04-create-api', '05-create-ui', '06-integrate-payments', '07-testing', '08-security', '09-deploy']
    const missingPrompts = expectedPrompts.filter(p => !combinedFiles.prompts[p])
    if (missingPrompts.length > 0) {
      console.warn('[CALL-HYBRID] Missing prompts:', missingPrompts)
    }

    // Check for truncated files
    const shortFiles: string[] = []
    if (combinedFiles.readme && combinedFiles.readme.length < 300) shortFiles.push('README.md')
    if (combinedFiles.claude && combinedFiles.claude.length < 300) shortFiles.push('CLAUDE.md')
    if (combinedFiles.userInstructions && combinedFiles.userInstructions.length < 300) shortFiles.push('USER_INSTRUCTIONS.md')

    Object.entries(combinedFiles.modules).forEach(([name, content]) => {
      if (content.length < 200) shortFiles.push(`modules/${name}/README.md`)
    })

    Object.entries(combinedFiles.prompts).forEach(([name, content]) => {
      if (content.length < 200) shortFiles.push(`prompts/${name}.md`)
    })

    if (shortFiles.length > 0) {
      console.warn('[CALL-HYBRID] Potentially incomplete files (< 300 chars):', shortFiles)
    }

    return combinedFiles
  } catch (error) {
    console.error('[CALL-HYBRID] Error:', error)
    throw error
  }
}

// Claude call function for export file generation (split into 4 parts for completeness)
async function callClaudeForExportInParts(buildingPlan: string) {
  console.log('[CALL-CLAUDE-PARTS] Starting 4-part Claude export generation with enhanced completeness validation')

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured')
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })

    // Load knowledge bases
    const kb1 = readFileSync(
      join(process.cwd(), 'claude-instructions/claude-knowledge-base-1.md'),
      'utf-8'
    )
    const kb2 = readFileSync(
      join(process.cwd(), 'claude-instructions/claude-knowledge-base-2.md'),
      'utf-8'
    )

    // CALL 1: Generate core documentation files (ENHANCED)
    console.log('[CALL-CLAUDE-PARTS] Call 1/4: Generating core documentation...')
    const docsPrompt = `You are an expert technical writer. Generate COMPLETE, COMPREHENSIVE documentation files. DO NOT truncate or summarize - write FULL, DETAILED content for each file.

**CRITICAL INSTRUCTIONS:**
- Each file must be 1500-2500 words minimum
- Include ALL sections listed below
- Write complete paragraphs, not bullet points
- Include code examples where relevant
- End each file with a clear conclusion
- DO NOT use phrases like "..." or "[continue]" or "[more details]"

Generate EXACTLY 4 files:

1. **USER_INSTRUCTIONS.md** (2000+ words)
   - What's included in this export
   - How to navigate the documentation
   - Step-by-step guide to using Claude Code with CLAUDE.md
   - How to use the numbered prompt files in sequence
   - Prerequisites and setup requirements
   - Tips for customization
   - Troubleshooting common issues

2. **README.md** (1500+ words)
   - Project name and tagline
   - Problem statement (detailed)
   - Target audience analysis
   - Core features with detailed descriptions
   - Complete tech stack with rationale
   - Architecture diagram in ASCII art
   - Getting started guide
   - Project structure overview
   - Contributing guidelines

3. **CLAUDE.md** (1000+ words)
   - Comprehensive project overview
   - Module structure with detailed links
   - Development workflow
   - Code standards and conventions
   - Testing requirements
   - Database schema with relationships
   - API endpoint documentation
   - Security requirements
   - Performance considerations

4. **QUICK_START.md** (800+ words)
   - 5-minute setup guide
   - Environment variables template
   - Database setup commands
   - First-time run instructions
   - Verification steps
   - Next steps after setup

Format each file EXACTLY as:
## File: filename.md
\`\`\`markdown
[COMPLETE file content - DO NOT TRUNCATE]
\`\`\`

# Knowledge Base 1
${kb1}

# Knowledge Base 2
${kb2}

# Building Plan
${buildingPlan}

**REMINDER: Write COMPLETE files. No summaries. No truncation.**`

    const docsCall = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      messages: [{ role: "user", content: docsPrompt }]
    })

    const docsStopReason = docsCall.stop_reason
    console.log('[CALL-CLAUDE-PARTS] Call 1/4 completed:', {
      stopReason: docsStopReason,
      inputTokens: docsCall.usage?.input_tokens,
      outputTokens: docsCall.usage?.output_tokens
    })

    if (docsStopReason === 'max_tokens') {
      console.warn('[CALL-CLAUDE-PARTS] WARNING: Call 1/4 hit max_tokens - files may be incomplete')
    }

    // Wait 240 seconds to avoid rate limit (4000 tokens/min = need 4 min between 16k token calls)
    console.log('[CALL-CLAUDE-PARTS] Waiting 240s before next call to avoid rate limit...')
    await new Promise(resolve => setTimeout(resolve, 240000))

    // CALL 2: Generate module README files (ENHANCED - 8 modules)
    console.log('[CALL-CLAUDE-PARTS] Call 2/4: Generating module READMEs...')
    const modulesPrompt = `You are an expert software architect. Generate COMPLETE, DETAILED module documentation. Each module README must be 500-800 words with ALL sections completed.

**CRITICAL INSTRUCTIONS:**
- Write COMPLETE content for each module
- Include real code examples (not pseudo-code)
- Explain WHY and HOW, not just WHAT
- Include file structure diagrams
- DO NOT truncate or use placeholders

Generate EXACTLY 8 module README files:

1. **modules/auth/README.md** (600+ words)
   - Authentication strategy with code examples
   - User roles and permissions matrix
   - Session management implementation
   - JWT/OAuth flow diagrams
   - Security best practices
   - Example middleware code

2. **modules/api/README.md** (600+ words)
   - API architecture with endpoint list
   - Request/response examples
   - Rate limiting implementation
   - Error handling patterns with examples
   - Validation schemas
   - API versioning strategy

3. **modules/database/README.md** (700+ words)
   - Complete schema with SQL
   - Multi-tenancy implementation
   - RLS policy examples
   - Migration strategy with examples
   - Indexing recommendations
   - Query optimization tips

4. **modules/ui/README.md** (600+ words)
   - Component hierarchy diagram
   - Design system tokens
   - Routing structure
   - State management patterns
   - Responsive breakpoints
   - Example component code

5. **modules/payments/README.md** (600+ words)
   - Stripe integration guide
   - Subscription tier implementation
   - Webhook handling with examples
   - EU VAT compliance steps
   - Payment flow diagrams
   - Error recovery patterns

6. **modules/deployment/README.md** (500+ words)
   - Vercel deployment checklist
   - Environment variables guide
   - CI/CD pipeline setup
   - Domain configuration
   - Performance monitoring
   - Rollback procedures

7. **modules/testing/README.md** (500+ words)
   - Testing strategy overview
   - Unit test examples
   - Integration test patterns
   - E2E test setup
   - Test coverage requirements
   - Mocking strategies

8. **modules/security/README.md** (600+ words)
   - Security checklist
   - Input validation patterns
   - XSS prevention examples
   - CSRF protection
   - SQL injection prevention
   - Rate limiting implementation

Format each file EXACTLY as:
## File: modules/module-name/README.md
\`\`\`markdown
[COMPLETE file content with ALL sections]
\`\`\`

# Knowledge Base 1
${kb1}

# Knowledge Base 2
${kb2}

# Building Plan
${buildingPlan}

**REMINDER: Write COMPLETE modules. Include ALL code examples.**`

    const modulesCall = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      messages: [{ role: "user", content: modulesPrompt }]
    })

    const modulesStopReason = modulesCall.stop_reason
    console.log('[CALL-CLAUDE-PARTS] Call 2/4 completed:', {
      stopReason: modulesStopReason,
      inputTokens: modulesCall.usage?.input_tokens,
      outputTokens: modulesCall.usage?.output_tokens
    })

    if (modulesStopReason === 'max_tokens') {
      console.warn('[CALL-CLAUDE-PARTS] WARNING: Call 2/4 hit max_tokens - files may be incomplete')
    }

    // Wait 240 seconds before next call
    console.log('[CALL-CLAUDE-PARTS] Waiting 240s before next call to avoid rate limit...')
    await new Promise(resolve => setTimeout(resolve, 240000))

    // CALL 3: Generate prompt files part 1 (ENHANCED - first 5 prompts)
    console.log('[CALL-CLAUDE-PARTS] Call 3/4: Generating implementation prompts (part 1/2)...')
    const prompts1Prompt = `You are an expert developer coach. Generate COMPLETE, ACTIONABLE implementation prompts. Each prompt must be 400-600 words with DETAILED steps and code examples.

**CRITICAL INSTRUCTIONS:**
- Write COMPLETE implementation guides
- Include actual code snippets (not pseudo-code)
- Provide specific file paths and commands
- Include validation steps to verify success
- Write clear prerequisites

Generate EXACTLY 5 prompt files (part 1 of 2):

1. **prompts/01-setup-project.md** (500+ words)
   - Context: What we're building and why
   - Prerequisites checklist (Node, Git, etc.)
   - Step-by-step Next.js 14 setup
   - Dependency installation with exact versions
   - Folder structure with tree diagram
   - Environment variables template
   - Success criteria with verification commands
   - Next steps link to prompt 02

2. **prompts/02-setup-database.md** (550+ words)
   - Context: Database architecture overview
   - Supabase project creation steps
   - Complete schema SQL code
   - RLS policies with examples
   - Migration setup and commands
   - Seeding test data scripts
   - Connection verification steps
   - Next steps link to prompt 03

3. **prompts/03-setup-auth.md** (600+ words)
   - Context: Authentication flow diagram
   - Supabase Auth setup guide
   - Middleware implementation code
   - Protected route examples
   - Session management code
   - Error handling patterns
   - Testing authentication flow
   - Next steps link to prompt 04

4. **prompts/04-create-api.md** (600+ words)
   - Context: API architecture overview
   - Endpoint list with methods
   - Route handler implementation examples
   - Input validation with Zod
   - Error handling middleware
   - Rate limiting setup
   - API testing with examples
   - Next steps link to prompt 05

5. **prompts/05-create-ui.md** (600+ words)
   - Context: UI component hierarchy
   - Design system setup (Tailwind config)
   - Core component implementations
   - Routing structure
   - State management patterns
   - Form handling with examples
   - Responsive design testing
   - Next steps link to prompt 06

Format each file EXACTLY as:
## File: prompts/##-name.md
\`\`\`markdown
[COMPLETE prompt content with ALL code examples]
\`\`\`

# Knowledge Base 1
${kb1}

# Knowledge Base 2
${kb2}

# Building Plan
${buildingPlan}

**REMINDER: Write COMPLETE prompts. Include ALL code examples and commands.**`

    const prompts1Call = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      messages: [{ role: "user", content: prompts1Prompt }]
    })

    const prompts1StopReason = prompts1Call.stop_reason
    console.log('[CALL-CLAUDE-PARTS] Call 3/4 completed:', {
      stopReason: prompts1StopReason,
      inputTokens: prompts1Call.usage?.input_tokens,
      outputTokens: prompts1Call.usage?.output_tokens
    })

    if (prompts1StopReason === 'max_tokens') {
      console.warn('[CALL-CLAUDE-PARTS] WARNING: Call 3/4 hit max_tokens - files may be incomplete')
    }

    // Wait 240 seconds before final call
    console.log('[CALL-CLAUDE-PARTS] Waiting 240s before final call to avoid rate limit...')
    await new Promise(resolve => setTimeout(resolve, 240000))

    // CALL 4: Generate prompt files part 2 (final 4 prompts)
    console.log('[CALL-CLAUDE-PARTS] Call 4/4: Generating implementation prompts (part 2/2)...')
    const prompts2Prompt = `You are an expert developer coach. Generate COMPLETE, ACTIONABLE implementation prompts. Each prompt must be 400-600 words with DETAILED steps and code examples.

**CRITICAL INSTRUCTIONS:**
- Write COMPLETE implementation guides
- Include actual code snippets (not pseudo-code)
- Provide specific file paths and commands
- Include validation steps to verify success
- Write clear prerequisites

Generate EXACTLY 4 prompt files (part 2 of 2):

6. **prompts/06-integrate-payments.md** (650+ words)
   - Context: Payment flow architecture
   - Stripe account setup guide
   - API keys configuration
   - Subscription creation code
   - Webhook endpoint implementation
   - Payment intent handling
   - EU VAT compliance setup
   - Testing with Stripe CLI
   - Next steps link to prompt 07

7. **prompts/07-testing.md** (550+ words)
   - Context: Testing strategy overview
   - Jest/Vitest setup guide
   - Unit test examples for utilities
   - Integration test for API routes
   - Component testing with React Testing Library
   - E2E test setup with Playwright
   - Coverage requirements
   - Next steps link to prompt 08

8. **prompts/08-security.md** (550+ words)
   - Context: Security checklist
   - Input validation implementation
   - XSS prevention examples
   - CSRF token setup
   - Rate limiting with Upstash
   - Security headers configuration
   - Penetration testing guide
   - Next steps link to prompt 09

9. **prompts/09-deploy.md** (600+ words)
   - Context: Deployment architecture
   - Vercel project setup
   - Environment variables configuration
   - Database migration in production
   - Domain setup and SSL
   - Performance monitoring setup
   - Rollback procedures
   - Post-deployment checklist
   - Maintenance and monitoring

Format each file EXACTLY as:
## File: prompts/##-name.md
\`\`\`markdown
[COMPLETE prompt content with ALL code examples]
\`\`\`

# Knowledge Base 1
${kb1}

# Knowledge Base 2
${kb2}

# Building Plan
${buildingPlan}

**REMINDER: Write COMPLETE prompts. Include ALL code examples and commands.**`

    const prompts2Call = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      messages: [{ role: "user", content: prompts2Prompt }]
    })

    const prompts2StopReason = prompts2Call.stop_reason
    console.log('[CALL-CLAUDE-PARTS] Call 4/4 completed:', {
      stopReason: prompts2StopReason,
      inputTokens: prompts2Call.usage?.input_tokens,
      outputTokens: prompts2Call.usage?.output_tokens
    })

    if (prompts2StopReason === 'max_tokens') {
      console.warn('[CALL-CLAUDE-PARTS] WARNING: Call 4/4 hit max_tokens - files may be incomplete')
    }

    // Parse and combine all 4 calls
    console.log('[CALL-CLAUDE-PARTS] Parsing all responses...')
    const docsParsed = parseClaudeOutput(docsCall.content)
    const modulesParsed = parseClaudeOutput(modulesCall.content)
    const prompts1Parsed = parseClaudeOutput(prompts1Call.content)
    const prompts2Parsed = parseClaudeOutput(prompts2Call.content)

    // Combine all parsed results
    const combinedFiles = {
      readme: docsParsed.readme,
      claude: docsParsed.claude,
      userInstructions: docsParsed.userInstructions,
      quickStart: docsParsed.quickStart || '',
      modules: {
        ...modulesParsed.modules
      },
      prompts: {
        ...prompts1Parsed.prompts,
        ...prompts2Parsed.prompts
      }
    }

    // Validate completeness
    const totalFiles = 1 + 1 + 1 + 1 + Object.keys(combinedFiles.modules).length + Object.keys(combinedFiles.prompts).length
    const expectedFiles = 4 + 8 + 9 // 4 core docs, 8 modules, 9 prompts = 21 total

    console.log('[CALL-CLAUDE-PARTS] File generation summary:', {
      hasReadme: !!combinedFiles.readme,
      hasClaude: !!combinedFiles.claude,
      hasUserInstructions: !!combinedFiles.userInstructions,
      hasQuickStart: !!combinedFiles.quickStart,
      moduleCount: Object.keys(combinedFiles.modules).length,
      moduleNames: Object.keys(combinedFiles.modules).sort(),
      promptCount: Object.keys(combinedFiles.prompts).length,
      promptNames: Object.keys(combinedFiles.prompts).sort(),
      totalFilesGenerated: totalFiles,
      expectedFiles: expectedFiles,
      completeness: `${Math.round((totalFiles / expectedFiles) * 100)}%`
    })

    // Warn about missing files
    const expectedModules = ['auth', 'api', 'database', 'ui', 'payments', 'deployment', 'testing', 'security']
    const missingModules = expectedModules.filter(m => !combinedFiles.modules[m])
    if (missingModules.length > 0) {
      console.warn('[CALL-CLAUDE-PARTS] Missing modules:', missingModules)
    }

    const expectedPrompts = ['01-setup-project', '02-setup-database', '03-setup-auth', '04-create-api', '05-create-ui', '06-integrate-payments', '07-testing', '08-security', '09-deploy']
    const missingPrompts = expectedPrompts.filter(p => !combinedFiles.prompts[p])
    if (missingPrompts.length > 0) {
      console.warn('[CALL-CLAUDE-PARTS] Missing prompts:', missingPrompts)
    }

    // Check for truncated files (less than 300 chars is likely incomplete)
    const shortFiles: string[] = []
    if (combinedFiles.readme && combinedFiles.readme.length < 300) shortFiles.push('README.md')
    if (combinedFiles.claude && combinedFiles.claude.length < 300) shortFiles.push('CLAUDE.md')
    if (combinedFiles.userInstructions && combinedFiles.userInstructions.length < 300) shortFiles.push('USER_INSTRUCTIONS.md')

    Object.entries(combinedFiles.modules).forEach(([name, content]) => {
      if (content.length < 200) shortFiles.push(`modules/${name}/README.md`)
    })

    Object.entries(combinedFiles.prompts).forEach(([name, content]) => {
      if (content.length < 200) shortFiles.push(`prompts/${name}.md`)
    })

    if (shortFiles.length > 0) {
      console.warn('[CALL-CLAUDE-PARTS] Potentially incomplete files (< 300 chars):', shortFiles)
    }

    return combinedFiles
  } catch (error) {
    console.error('[CALL-CLAUDE-PARTS] Error:', error)
    throw error
  }
}

// Claude call function for export file generation (legacy - single call)
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
    quickStart: '',
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

    console.log(`[PARSE-CLAUDE] Parsing file: ${filePath} (${fileContent.length} chars)`)
    parsedFiles.push(filePath)

    // Handle top-level files
    if (filePath === 'README.md' || filePath.endsWith('/README.md')) {
      files.readme = fileContent
    } else if (filePath === 'CLAUDE.md' || filePath.endsWith('/CLAUDE.md')) {
      files.claude = fileContent
    } else if (filePath === 'USER_INSTRUCTIONS.md' || filePath.endsWith('/USER_INSTRUCTIONS.md')) {
      files.userInstructions = fileContent
    } else if (filePath === 'QUICK_START.md' || filePath.endsWith('/QUICK_START.md')) {
      files.quickStart = fileContent
    }
    // Handle module files with nested structure (e.g., modules/auth/README.md)
    else if (filePath.includes('modules/')) {
      // Extract module name from path like "modules/auth/README.md" -> "auth"
      const pathParts = filePath.split('/')
      const moduleIndex = pathParts.indexOf('modules')
      if (moduleIndex >= 0 && pathParts.length > moduleIndex + 1) {
        const moduleName = pathParts[moduleIndex + 1]
        files.modules[moduleName] = fileContent
      } else {
        // Fallback for old format "modules/auth-module.md"
        const moduleName = filePath.split('/').pop()?.replace(/(-module)?\.(md|MD)$/, '') || 'module'
        files.modules[moduleName] = fileContent
      }
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
    hasQuickStart: !!files.quickStart,
    moduleCount: Object.keys(files.modules).length,
    promptCount: Object.keys(files.prompts).length,
    allParsedFiles: parsedFiles
  })

  // Validation warnings for expected files (updated for new structure)
  const expectedModules = ['auth', 'api', 'database', 'ui', 'payments', 'deployment', 'testing', 'security']
  const missingModules = expectedModules.filter(m => !files.modules[m])
  if (missingModules.length > 0) {
    console.warn('[PARSE-CLAUDE] Missing expected modules:', missingModules)
  }

  const expectedPromptCount = 9 // 01-setup through 09-deploy
  if (Object.keys(files.prompts).length < expectedPromptCount) {
    console.warn(`[PARSE-CLAUDE] Expected ${expectedPromptCount} prompts, found ${Object.keys(files.prompts).length}`)
  }

  if (!files.userInstructions) {
    console.warn('[PARSE-CLAUDE] Missing USER_INSTRUCTIONS.md')
  }

  if (!files.quickStart) {
    console.warn('[PARSE-CLAUDE] Missing QUICK_START.md')
  }

  // If no files were parsed, try to extract at least README from full text
  if (matchCount === 0) {
    console.warn('[PARSE-CLAUDE] No files parsed in expected format. Using fallback...')
    files.readme = text.substring(0, Math.min(5000, text.length))
    files.claude = 'See README.md for full content.'
  }

  return files
}
