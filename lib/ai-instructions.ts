/**
 * AI Instructions Loader
 *
 * This module loads and manages AI workflow instructions and knowledge base files.
 * These instructions guide the AI through the 12-phase blueprint creation process.
 */

import fs from 'fs'
import path from 'path'

const AI_WORKFLOW_DIR = path.join(process.cwd(), 'ai-workflow')

/**
 * Load the 12-phase workflow instructions
 */
export function loadWorkflowInstructions(): string {
  try {
    const filePath = path.join(AI_WORKFLOW_DIR, '12-phase-workflow-instructions.md')
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    console.error('Failed to load workflow instructions:', error)
    return ''
  }
}

/**
 * Load knowledge base file 1
 */
export function loadKnowledgeBase1(): string {
  try {
    const filePath = path.join(AI_WORKFLOW_DIR, 'knowledge-base-1.md')
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    console.error('Failed to load knowledge base 1:', error)
    return ''
  }
}

/**
 * Load knowledge base file 2
 */
export function loadKnowledgeBase2(): string {
  try {
    const filePath = path.join(AI_WORKFLOW_DIR, 'knowledge-base-2.md')
    return fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    console.error('Failed to load knowledge base 2:', error)
    return ''
  }
}

/**
 * Load all AI instructions and knowledge base files
 */
export function loadAllAIInstructions(): {
  workflowInstructions: string
  knowledgeBase1: string
  knowledgeBase2: string
} {
  return {
    workflowInstructions: loadWorkflowInstructions(),
    knowledgeBase1: loadKnowledgeBase1(),
    knowledgeBase2: loadKnowledgeBase2(),
  }
}

/**
 * Build the complete system prompt for the AI
 * This combines workflow instructions and knowledge base files
 */
export function buildSystemPrompt(currentPhase: number): string {
  const { workflowInstructions, knowledgeBase1, knowledgeBase2 } = loadAllAIInstructions()

  return `You are an expert SaaS consultant guiding users through a comprehensive 12-phase blueprint creation process.

# Current Phase
You are currently helping the user with Phase ${currentPhase} of 12.

# Workflow Instructions
${workflowInstructions}

# Knowledge Base - Reference Material 1
${knowledgeBase1}

# Knowledge Base - Reference Material 2
${knowledgeBase2}

# Your Instructions
1. Follow the 12-phase workflow instructions strictly
2. Reference the knowledge base files to provide accurate, expert guidance
3. Ask probing questions to ensure thorough responses
4. Validate user answers before allowing progression
5. Be supportive but challenging - ensure quality over speed
6. Adapt your communication style to be conversational and helpful
7. Build on previous phase insights as you progress

# Important Rules
- Only discuss the current phase (Phase ${currentPhase})
- Do not allow skipping ahead or going back
- Ensure all required questions are answered thoroughly
- Use knowledge base examples and frameworks when relevant
- Maintain context from previous answers in this phase
`
}

/**
 * Check if AI instruction files exist and are not empty
 */
export function validateAIInstructions(): {
  valid: boolean
  missing: string[]
} {
  const requiredFiles = [
    '12-phase-workflow-instructions.md',
    'knowledge-base-1.md',
    'knowledge-base-2.md',
  ]

  const missing: string[] = []

  for (const file of requiredFiles) {
    const filePath = path.join(AI_WORKFLOW_DIR, file)
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      // Check if file has actual content (not just template)
      if (content.length < 100 || content.includes('PASTE YOUR')) {
        missing.push(file + ' (empty or contains template placeholder)')
      }
    } catch (error) {
      missing.push(file + ' (file not found)')
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}
