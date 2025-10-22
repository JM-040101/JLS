import { NextRequest, NextResponse } from 'next/server'
import {
  loadAllAIInstructions,
  buildSystemPrompt,
  validateAIInstructions
} from '@/lib/ai-instructions'

/**
 * GET /api/ai/instructions
 *
 * Returns AI workflow instructions and knowledge base files
 * Optional query param: phase (1-12) to get phase-specific system prompt
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phase = searchParams.get('phase')

    // Validate that instructions are properly configured
    const validation = validateAIInstructions()
    if (!validation.valid) {
      return NextResponse.json({
        error: 'AI instructions not configured',
        missing: validation.missing,
        message: 'Please add your workflow instructions and knowledge base content to the files in /ai-workflow directory'
      }, { status: 503 })
    }

    // If phase is specified, return phase-specific system prompt
    if (phase) {
      const phaseNumber = parseInt(phase)
      if (isNaN(phaseNumber) || phaseNumber < 1 || phaseNumber > 12) {
        return NextResponse.json({
          error: 'Invalid phase number',
          message: 'Phase must be between 1 and 12'
        }, { status: 400 })
      }

      return NextResponse.json({
        phase: phaseNumber,
        systemPrompt: buildSystemPrompt(phaseNumber)
      })
    }

    // Otherwise return all raw instructions
    const instructions = loadAllAIInstructions()
    return NextResponse.json({
      instructions,
      validation: {
        valid: true,
        message: 'AI instructions loaded successfully'
      }
    })

  } catch (error: any) {
    console.error('Error loading AI instructions:', error)
    return NextResponse.json({
      error: 'Failed to load AI instructions',
      message: error.message
    }, { status: 500 })
  }
}

/**
 * POST /api/ai/instructions/validate
 *
 * Validates that all required instruction files are present and properly configured
 */
export async function POST(request: NextRequest) {
  try {
    const validation = validateAIInstructions()

    return NextResponse.json({
      valid: validation.valid,
      missing: validation.missing,
      message: validation.valid
        ? 'All AI instruction files are properly configured'
        : 'Some AI instruction files are missing or empty'
    }, {
      status: validation.valid ? 200 : 400
    })

  } catch (error: any) {
    console.error('Error validating AI instructions:', error)
    return NextResponse.json({
      error: 'Validation failed',
      message: error.message
    }, { status: 500 })
  }
}
