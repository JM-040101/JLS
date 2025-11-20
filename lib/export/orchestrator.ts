// Export Orchestrator - Main controller for export generation

import { ClaudeModule, ExportRequest, ExportValidation } from './types'
import { ZipBundler } from './zip-bundler'
import { ExportStorage } from './storage'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export interface ExportVersion {
  version: string
  major: number
  minor: number
  patch: number
  timestamp: Date
  changelog?: string
}

export interface ExportResult {
  success: boolean
  exportId?: string
  downloadUrl?: string
  size?: number
  version?: string
  error?: string
  validation?: ExportValidation
}

export class ExportOrchestrator {
  private storage: ExportStorage
  private currentVersion: ExportVersion

  constructor() {
    this.storage = new ExportStorage()
    this.currentVersion = this.parseVersion('1.0.0')
  }

  // Main export method
  async exportSession(request: ExportRequest): Promise<ExportResult> {
    const supabase = createSupabaseServerClient()
    let exportId: string | undefined

    try {
      // Validate request
      const validation = await this.validateExportRequest(request)
      if (!validation.valid) {
        return {
          success: false,
          error: 'Validation failed',
          validation
        }
      }

      // Fetch session data
      const sessionData = await this.fetchSessionData(request.sessionId, request.userId)
      if (!sessionData) {
        return {
          success: false,
          error: 'Session not found or access denied'
        }
      }

      // Check if session is complete
      if (sessionData.current_phase < 12) {
        return {
          success: false,
          error: 'All phases must be completed before export'
        }
      }

      // Fetch all answers
      const answers = await this.fetchAnswers(request.sessionId)
      if (!answers || Object.keys(answers).length < 12) {
        return {
          success: false,
          error: 'Incomplete workflow data'
        }
      }

      // Create export record immediately with processing status
      const { data: exportRecord, error: exportError } = await supabase
        .from('exports')
        .insert({
          session_id: request.sessionId,
          user_id: request.userId,
          filename: `blueprint-${request.sessionId}.zip`,
          path: `exports/${request.userId}/${request.sessionId}`,
          url: '', // Will update after upload
          size: 0, // Will update after generation
          status: 'processing',
          progress: 0,
          progress_message: 'Initializing export...',
          metadata: {
            format: request.format,
            includePrompts: request.includePrompts,
            includeDocumentation: request.includeDocumentation
          },
          version: request.version || '1.0.0'
        })
        .select()
        .single()

      if (exportError || !exportRecord) {
        throw new Error(`Failed to create export record: ${exportError?.message}`)
      }

      exportId = exportRecord.id

      // Update progress: AI Processing with Claude
      await supabase
        .from('exports')
        .update({
          progress: 10,
          progress_message: 'AI processing blueprint with Claude Sonnet 4...'
        })
        .eq('id', exportId)

      // Call transform-blueprint API to get AI-generated documents
      const aiDocuments = await this.transformBlueprintWithAI(request.sessionId)

      // Update progress: Generating modules
      await supabase
        .from('exports')
        .update({
          progress: 30,
          progress_message: 'Generating module structure...'
        })
        .eq('id', exportId)

      // Generate modules from answers
      const modules = await this.generateModules(answers, sessionData)

      // Update progress: Determining version
      await supabase
        .from('exports')
        .update({
          progress: 50,
          progress_message: 'Preparing export bundle...'
        })
        .eq('id', exportId)

      // Determine version
      const version = await this.determineVersion(request.sessionId, request.version)

      // Update progress: Creating ZIP
      await supabase
        .from('exports')
        .update({
          progress: 70,
          progress_message: 'Bundling files with AI-generated content...'
        })
        .eq('id', exportId)

      // Generate ZIP bundle with AI-generated documents
      const zipBuffer = await ZipBundler.createExportFromSession(
        {
          ...sessionData,
          version: version.version
        },
        modules,
        answers,
        aiDocuments // Pass AI-generated README, CLAUDE.md, COMPLETE-PLAN
      )

      // Validate generated export
      const exportValidation = this.validateExportSize(zipBuffer)
      if (!exportValidation.valid) {
        await supabase
          .from('exports')
          .update({
            status: 'failed',
            error_message: 'Export too large',
            progress: 0
          })
          .eq('id', exportId)

        return {
          success: false,
          error: 'Export too large',
          validation: exportValidation
        }
      }

      // Update progress: Uploading
      await supabase
        .from('exports')
        .update({
          progress: 90,
          progress_message: 'Uploading export...'
        })
        .eq('id', exportId)

      // Upload to storage
      const uploadResult = await this.storage.uploadExport(
        zipBuffer,
        request.sessionId,
        request.userId,
        {
          version: version.version,
          generatedBy: 'SaaS Blueprint Generator',
          businessName: sessionData.name,
          targetAudience: sessionData.target_audience,
          modules: modules.map(m => m.name),
          totalSize: zipBuffer.length,
          fileCount: this.calculateFileCount(modules),
          mcpServers: this.extractMcpServers(modules)
        }
      )

      if (!uploadResult.success) {
        await supabase
          .from('exports')
          .update({
            status: 'failed',
            error_message: uploadResult.error || 'Upload failed',
            progress: 0
          })
          .eq('id', exportId)

        return {
          success: false,
          error: uploadResult.error || 'Upload failed'
        }
      }

      // Update export record with final details
      await supabase
        .from('exports')
        .update({
          status: 'completed',
          progress: 100,
          progress_message: 'Export complete!',
          url: uploadResult.url || '',
          size: uploadResult.size || zipBuffer.length,
          files: modules.map(m => m.name)
        })
        .eq('id', exportId)

      // Track export
      await this.trackExport(request.sessionId, request.userId, version.version, zipBuffer.length)

      return {
        success: true,
        exportId: exportId,
        downloadUrl: uploadResult.url,
        size: uploadResult.size,
        version: version.version,
        validation: exportValidation
      }

    } catch (error: any) {
      console.error('Export orchestration failed:', error)

      // Update export record as failed if it was created
      if (exportId) {
        await supabase
          .from('exports')
          .update({
            status: 'failed',
            error_message: error.message || 'Export generation failed',
            progress: 0
          })
          .eq('id', exportId)
      }

      return {
        success: false,
        error: error.message || 'Export generation failed'
      }
    }
  }

  // Get export history for a session
  async getExportHistory(sessionId: string): Promise<Array<{
    version: string
    createdAt: Date
    size: number
    url: string
  }>> {
    const supabase = createSupabaseServerClient()
    
    const { data } = await supabase
      .from('export_versions')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    return data?.map(record => ({
      version: record.version,
      createdAt: new Date(record.created_at),
      size: record.size,
      url: record.url
    })) || []
  }

  // Re-export with updated content
  async reExport(sessionId: string, userId: string): Promise<ExportResult> {
    // Get the latest version
    const history = await this.getExportHistory(sessionId)
    const latestVersion = history[0]?.version || '1.0.0'
    
    // Increment version
    const newVersion = this.incrementVersion(this.parseVersion(latestVersion), 'patch')
    
    // Export with new version
    return this.exportSession({
      sessionId,
      userId,
      format: 'zip',
      includePrompts: true,
      includeDocumentation: true,
      version: newVersion.version
    })
  }

  // Private methods

  private async transformBlueprintWithAI(sessionId: string): Promise<{
    readme: string
    claudeMd: string
    completePlan: string
  }> {
    // Import the AI transformation logic from transform-blueprint API
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const fs = await import('fs/promises')
    const path = await import('path')

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    const supabase = createSupabaseServerClient()

    // Fetch session
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session) {
      throw new Error('Session not found')
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
      .eq('session_id', sessionId)
      .order('phase_number', { ascending: true })

    if (!phaseTemplates || !answers) {
      throw new Error('Failed to fetch data for AI transformation')
    }

    // Load knowledge base files
    const workflowInstructions = await this.loadKnowledgeFile('ai-workflow/12-phase-workflow-instructions.md')
    const knowledgeBase1 = await this.loadKnowledgeFile('ai-workflow/knowledge-base-1.md')
    const knowledgeBase2 = await this.loadKnowledgeFile('ai-workflow/knowledge-base-2.md')

    // Transform answers into structured blueprint data
    const blueprintData = this.formatBlueprintData(session, phaseTemplates, answers)

    // Generate documents in parallel using Claude Sonnet 4
    const [readme, claudeMd, completePlan] = await Promise.all([
      this.generateWithClaude(anthropic, 'README', blueprintData, workflowInstructions, knowledgeBase1, knowledgeBase2),
      this.generateWithClaude(anthropic, 'CLAUDE', blueprintData, workflowInstructions, knowledgeBase1, knowledgeBase2),
      this.generateWithClaude(anthropic, 'COMPLETE_PLAN', blueprintData, workflowInstructions, knowledgeBase1, knowledgeBase2)
    ])

    return { readme, claudeMd, completePlan }
  }

  private async loadKnowledgeFile(relativePath: string): Promise<string> {
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      const filePath = path.join(process.cwd(), relativePath)
      return await fs.readFile(filePath, 'utf-8')
    } catch (error) {
      console.error(`Failed to load knowledge file: ${relativePath}`, error)
      return ''
    }
  }

  private formatBlueprintData(session: any, phases: any[], answers: any[]): string {
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

  private async generateWithClaude(
    anthropic: any,
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

    const textContent = message.content.find((block: any) => block.type === 'text')
    return textContent ? textContent.text : ''
  }

  private async validateExportRequest(request: ExportRequest): Promise<ExportValidation> {
    const errors: string[] = []
    const warnings: string[] = []

    if (!request.sessionId) {
      errors.push('Session ID is required')
    }

    if (!request.userId) {
      errors.push('User ID is required')
    }

    if (!['zip', 'json', 'markdown'].includes(request.format)) {
      errors.push('Invalid export format')
    }

    // Check user quota
    const usage = await this.storage.getUserStorageUsage(request.userId)
    if (usage.fileCount >= 100) {
      warnings.push('Approaching export limit (100 files)')
    }

    if (usage.totalSize > 500 * 1024 * 1024) { // 500MB
      warnings.push('Approaching storage limit')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      fileCount: 0,
      totalSize: 0,
      oversizedFiles: []
    }
  }

  private async fetchSessionData(sessionId: string, userId: string): Promise<any> {
    const supabase = createSupabaseServerClient()
    
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    return data
  }

  private async fetchAnswers(sessionId: string): Promise<Record<number, any>> {
    const supabase = createSupabaseServerClient()
    
    const { data } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('phase_number')

    if (!data) return {}

    return data.reduce((acc, answer) => {
      acc[answer.phase_number] = answer.answers
      return acc
    }, {} as Record<number, any>)
  }

  private async generateModules(answers: Record<number, any>, sessionData: any): Promise<ClaudeModule[]> {
    // Generate modules based on answers
    const modules: ClaudeModule[] = []

    // Always include core modules
    modules.push({
      name: 'auth',
      title: 'Authentication',
      description: 'User authentication and authorization',
      path: 'modules/auth',
      dependencies: [],
      mcpServers: ['supabase'],
      constraints: [
        'Use Supabase Auth for authentication',
        'Implement Row Level Security',
        'Support email/password and OAuth'
      ],
      features: [
        'User registration',
        'Login/logout',
        'Password reset',
        'Session management'
      ],
      content: this.generateModuleContent('auth', answers)
    })

    modules.push({
      name: 'database',
      title: 'Database',
      description: 'Database schema and data access layer',
      path: 'modules/database',
      dependencies: [],
      mcpServers: ['supabase'],
      constraints: [
        'Use PostgreSQL via Supabase',
        'Implement proper indexes',
        'Use RLS for data isolation'
      ],
      features: [
        'Schema migrations',
        'Data models',
        'Query builders',
        'Connection pooling'
      ],
      content: this.generateModuleContent('database', answers)
    })

    modules.push({
      name: 'api',
      title: 'API',
      description: 'RESTful API endpoints',
      path: 'modules/api',
      dependencies: ['auth', 'database'],
      mcpServers: [],
      constraints: [
        'Use Next.js API routes',
        'Implement proper error handling',
        'Add rate limiting',
        'Type-safe request/response'
      ],
      features: [
        'CRUD operations',
        'Data validation',
        'Error handling',
        'Response formatting'
      ],
      content: this.generateModuleContent('api', answers)
    })

    modules.push({
      name: 'ui',
      title: 'User Interface',
      description: 'React components and pages',
      path: 'modules/ui',
      dependencies: ['api', 'auth'],
      mcpServers: [],
      constraints: [
        'Use React with TypeScript',
        'Implement responsive design',
        'Follow accessibility standards',
        'Use Tailwind CSS'
      ],
      features: [
        'Component library',
        'Page layouts',
        'Forms and inputs',
        'Data visualization'
      ],
      content: this.generateModuleContent('ui', answers)
    })

    // Add optional modules based on answers
    if (this.requiresPayments(answers)) {
      modules.push({
        name: 'payments',
        title: 'Payments',
        description: 'Subscription and payment processing',
        path: 'modules/payments',
        dependencies: ['database', 'api'],
        mcpServers: [],
        constraints: [
          'Use Stripe for payments',
          'PCI compliance',
          'Webhook handling',
          'EU VAT support'
        ],
        features: [
          'Subscription management',
          'Payment processing',
          'Invoice generation',
          'Usage tracking'
        ],
        content: this.generateModuleContent('payments', answers)
      })
    }

    if (this.requiresAnalytics(answers)) {
      modules.push({
        name: 'analytics',
        title: 'Analytics',
        description: 'Usage tracking and analytics',
        path: 'modules/analytics',
        dependencies: ['database', 'api'],
        mcpServers: [],
        constraints: [
          'Privacy-compliant tracking',
          'Real-time metrics',
          'Custom events',
          'Data aggregation'
        ],
        features: [
          'Event tracking',
          'User analytics',
          'Performance metrics',
          'Custom dashboards'
        ],
        content: this.generateModuleContent('analytics', answers)
      })
    }

    return modules
  }

  private generateModuleContent(moduleName: string, answers: Record<number, any>): string {
    // Generate content based on module type and answers
    const relevantAnswers = this.extractRelevantAnswers(moduleName, answers)
    
    return `
## Implementation Details

Based on your requirements:
${Object.entries(relevantAnswers).map(([phase, data]) => 
  `- Phase ${phase}: ${JSON.stringify(data).substring(0, 100)}...`
).join('\n')}

## Technical Specifications

### Data Models
Define your data models based on the business requirements.

### Business Logic
Implement the core business logic for ${moduleName}.

### Integration Points
Connect with other modules as specified in dependencies.
    `.trim()
  }

  private extractRelevantAnswers(moduleName: string, answers: Record<number, any>): Record<number, any> {
    // Extract answers relevant to specific module
    const relevant: Record<number, any> = {}
    
    const modulePhaseMap: Record<string, number[]> = {
      'auth': [1, 2, 10],
      'database': [3, 4, 5],
      'api': [6, 7],
      'ui': [8, 9],
      'payments': [11],
      'analytics': [12]
    }
    
    const phases = modulePhaseMap[moduleName] || []
    phases.forEach(phase => {
      if (answers[phase]) {
        relevant[phase] = answers[phase]
      }
    })
    
    return relevant
  }

  private requiresPayments(answers: Record<number, any>): boolean {
    // Check if any answers indicate need for payment processing
    const phase11 = answers[11]
    return phase11 && (
      phase11.monetization === 'subscription' ||
      phase11.monetization === 'one-time' ||
      phase11.pricing_model
    )
  }

  private requiresAnalytics(answers: Record<number, any>): boolean {
    // Check if analytics module is needed
    const phase12 = answers[12]
    return phase12 && (
      phase12.tracking === true ||
      phase12.analytics === 'enabled' ||
      phase12.metrics
    )
  }

  private async determineVersion(sessionId: string, requestedVersion?: string): Promise<ExportVersion> {
    if (requestedVersion) {
      return this.parseVersion(requestedVersion)
    }

    // Get existing versions
    const history = await this.getExportHistory(sessionId)
    
    if (history.length === 0) {
      return this.parseVersion('1.0.0')
    }

    // Auto-increment patch version
    const latestVersion = this.parseVersion(history[0].version)
    return this.incrementVersion(latestVersion, 'patch')
  }

  private parseVersion(versionString: string): ExportVersion {
    const [major, minor, patch] = versionString.split('.').map(Number)
    return {
      version: versionString,
      major: major || 1,
      minor: minor || 0,
      patch: patch || 0,
      timestamp: new Date()
    }
  }

  private incrementVersion(version: ExportVersion, type: 'major' | 'minor' | 'patch'): ExportVersion {
    let { major, minor, patch } = version

    switch (type) {
      case 'major':
        major++
        minor = 0
        patch = 0
        break
      case 'minor':
        minor++
        patch = 0
        break
      case 'patch':
        patch++
        break
    }

    return {
      version: `${major}.${minor}.${patch}`,
      major,
      minor,
      patch,
      timestamp: new Date(),
      changelog: `Auto-incremented ${type} version`
    }
  }

  private validateExportSize(buffer: Buffer): ExportValidation {
    const maxSize = 50 * 1024 * 1024 // 50MB
    const size = buffer.length

    return {
      valid: size <= maxSize,
      errors: size > maxSize ? [`Export size (${size} bytes) exceeds maximum (${maxSize} bytes)`] : [],
      warnings: size > maxSize * 0.8 ? ['Export size approaching limit'] : [],
      fileCount: 0, // Would need to unzip to count
      totalSize: size,
      oversizedFiles: []
    }
  }

  private calculateFileCount(modules: ClaudeModule[]): number {
    // Base files
    let count = 10 // README, CLAUDE.md, package.json, etc.
    
    // Module files
    count += modules.length * 5 // Each module has ~5 files
    
    // Prompts
    count += modules.length * 3 // ~3 prompts per module
    
    return count
  }

  private extractMcpServers(modules: ClaudeModule[]): string[] {
    const servers = new Set<string>()
    modules.forEach(module => {
      module.mcpServers.forEach(server => servers.add(server))
    })
    return Array.from(servers)
  }

  private async trackExport(
    sessionId: string,
    userId: string,
    version: string,
    size: number
  ): Promise<void> {
    try {
      const supabase = createSupabaseServerClient()
      
      await supabase
        .from('export_versions')
        .insert({
          session_id: sessionId,
          user_id: userId,
          version,
          size,
          exported_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error tracking export:', error)
    }
  }
}