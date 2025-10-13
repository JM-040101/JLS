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
            updated_at: new Date().toISOString()
          })
          .eq('id', exportId)
      })

      // Step 2: Fetch approved plan
      const plan = await step.run('fetch-plan', async () => {
        console.log('[INNGEST-EXPORT] Fetching plan:', planId)
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

      // Step 3: Call Claude to generate export files (no timeout!)
      const files = await step.run('call-claude', async () => {
        console.log('[INNGEST-EXPORT] Calling Claude to generate files...')
        const exportFiles = await callClaudeForExport(plan)
        console.log('[INNGEST-EXPORT] Claude generated files:', {
          hasReadme: !!exportFiles.readme,
          hasClaude: !!exportFiles.claude,
          moduleCount: Object.keys(exportFiles.modules).length,
          promptCount: Object.keys(exportFiles.prompts).length
        })
        return exportFiles
      })

      // Step 4: Store files in database
      await step.run('save-export-files', async () => {
        console.log('[INNGEST-EXPORT] Saving export files to database')
        await supabase
          .from('exports')
          .update({
            status: 'completed',
            files: files,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', exportId)
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
