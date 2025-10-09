import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', params.id)
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

    // Create ZIP file
    const zip = new JSZip()

    // Generate README.md
    const readme = generateReadme(session, phaseTemplates, answers)
    zip.file('README.md', readme)

    // Generate CLAUDE.md
    const claudeMd = generateClaudeMd(session, phaseTemplates, answers)
    zip.file('CLAUDE.md', claudeMd)

    // Generate phase documentation
    const phasesFolder = zip.folder('phases')
    if (phasesFolder) {
      phaseTemplates.forEach((phase) => {
        const phaseAnswers = answers.filter(a => a.phase_number === phase.phase_number)
        const phaseDoc = generatePhaseDoc(phase, phaseAnswers)
        phasesFolder.file(`phase-${phase.phase_number}-${slugify(phase.title)}.md`, phaseDoc)
      })
    }

    // Generate complete plan view
    const completePlan = generateCompletePlan(session, phaseTemplates, answers)
    zip.file('COMPLETE-PLAN.md', completePlan)

    // Generate the ZIP
    const zipBlob = await zip.generateAsync({ type: 'nodebuffer' })

    // Return the ZIP file
    const filename = `${slugify(session.app_description || 'blueprint')}-${new Date().toISOString().split('T')[0]}.zip`

    return new NextResponse(zipBlob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function generateReadme(session: any, phases: any[], answers: any[]): string {
  return `# ${session.app_description || 'SaaS Blueprint'}

**Generated on:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

## Project Overview

This is a comprehensive SaaS blueprint created through a 12-phase structured workflow. Each phase has been carefully designed to cover essential aspects of building a successful SaaS product.

## Blueprint Status

- **Phases Completed:** ${session.completed_phases}/12
- **Status:** ${session.status}
- **Created:** ${new Date(session.created_at).toLocaleDateString()}
- **Last Updated:** ${new Date(session.updated_at).toLocaleDateString()}

## Contents

This package includes:

- **README.md** - This file, providing an overview
- **CLAUDE.md** - Instructions for Claude Code to build your SaaS
- **COMPLETE-PLAN.md** - Full blueprint with all answers in one document
- **phases/** - Individual phase documentation

## Phase Summary

${phases.map(phase => `### Phase ${phase.phase_number}: ${phase.title}

${phase.description}

**Estimated Time:** ${phase.estimated_time} minutes
**Status:** ${phase.phase_number <= session.completed_phases ? '✅ Completed' : '⏳ Pending'}
`).join('\n')}

## Next Steps

1. Review the COMPLETE-PLAN.md for your full blueprint
2. Use CLAUDE.md with Claude Code to start building
3. Refer to individual phase documents for detailed guidance

---

*Generated with [SaaS Blueprint Generator](https://yoursaasblueprint.com)*
`
}

function generateClaudeMd(session: any, phases: any[], answers: any[]): string {
  const appName = session.app_name || session.app_description || 'SaaS Application'

  return `# CLAUDE.md

This file provides guidance to Claude Code when building **${appName}**.

## Project Overview

${session.app_description || 'A SaaS application'}

## Architecture & Stack

Based on your blueprint answers, here are the key technical decisions:

${generateTechStackSection(answers)}

## Database Schema

${generateDatabaseSection(answers)}

## Feature Implementation Plan

${phases.map((phase, idx) => {
  const phaseAnswers = answers.filter(a => a.phase_number === phase.phase_number)
  if (phaseAnswers.length === 0) return ''

  return `### Phase ${phase.phase_number}: ${phase.title}

${phaseAnswers.map(answer => `**${answer.question_text}**
${answer.answer_text}
`).join('\n')}
`
}).filter(Boolean).join('\n')}

## Implementation Guidelines

1. **Security First**: Implement authentication and authorization from the start
2. **Modular Design**: Break features into reusable components
3. **Testing**: Write tests for critical business logic
4. **Documentation**: Keep code well-documented
5. **Performance**: Optimize database queries and API responses

## Development Commands

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
\`\`\`

---

*Generated with SaaS Blueprint Generator on ${new Date().toLocaleDateString()}*
`
}

function generatePhaseDoc(phase: any, answers: any[]): string {
  return `# Phase ${phase.phase_number}: ${phase.title}

${phase.description}

**Estimated Time:** ${phase.estimated_time} minutes

${phase.help_text ? `## Guidelines

${phase.help_text}` : ''}

## Questions & Answers

${answers.map((answer, idx) => `### ${idx + 1}. ${answer.question_text}

${answer.answer_text}

---
`).join('\n')}

${answers.length === 0 ? '*No answers provided for this phase yet.*' : ''}
`
}

function generateCompletePlan(session: any, phases: any[], answers: any[]): string {
  return `# Complete SaaS Blueprint: ${session.app_description || 'Untitled'}

**Generated:** ${new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}

---

## Table of Contents

${phases.map(p => `- [Phase ${p.phase_number}: ${p.title}](#phase-${p.phase_number}-${slugify(p.title)})`).join('\n')}

---

${phases.map(phase => {
  const phaseAnswers = answers.filter(a => a.phase_number === phase.phase_number)

  return `## Phase ${phase.phase_number}: ${phase.title}

> ${phase.description}

${phaseAnswers.map((answer, idx) => `### ${answer.question_text}

${answer.answer_text}
`).join('\n')}

${phaseAnswers.length === 0 ? '*This phase has not been completed yet.*' : ''}

---
`
}).join('\n')}

## Summary

This blueprint was created using the SaaS Blueprint Generator, a comprehensive 12-phase workflow designed to transform your SaaS idea into a detailed technical plan.

**Next Steps:**
1. Review each phase thoroughly
2. Use this blueprint with Claude Code to start implementation
3. Iterate and refine as you build

---

*Generated with [SaaS Blueprint Generator](https://yoursaasblueprint.com)*
`
}

function generateTechStackSection(answers: any[]): string {
  // Extract tech stack from Phase 3 answers
  const techAnswers = answers.filter(a => a.phase_number === 3)

  if (techAnswers.length === 0) {
    return '*Tech stack not defined in blueprint.*'
  }

  return techAnswers.map(a => `**${a.question_text}**\n${a.answer_text}`).join('\n\n')
}

function generateDatabaseSection(answers: any[]): string {
  // Extract database schema from Phase 4 answers
  const dbAnswers = answers.filter(a => a.phase_number === 4)

  if (dbAnswers.length === 0) {
    return '*Database schema not defined in blueprint.*'
  }

  return dbAnswers.map(a => `**${a.question_text}**\n${a.answer_text}`).join('\n\n')
}
