// Export Orchestrator - Main controller for export generation

import { ClaudeModule, ExportRequest, ExportValidation } from './types'
import { ZipBundler } from './zip-bundler'
import { ExportStorage } from './storage'
import { createSupabaseClient } from '@/lib/supabase-server'

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

      // Generate modules from answers
      const modules = await this.generateModules(answers, sessionData)

      // Determine version
      const version = await this.determineVersion(request.sessionId, request.version)

      // Generate ZIP bundle
      const zipBuffer = await ZipBundler.createExportFromSession(
        {
          ...sessionData,
          version: version.version
        },
        modules,
        answers
      )

      // Validate generated export
      const exportValidation = this.validateExportSize(zipBuffer)
      if (!exportValidation.valid) {
        return {
          success: false,
          error: 'Export too large',
          validation: exportValidation
        }
      }

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
        return {
          success: false,
          error: uploadResult.error || 'Upload failed'
        }
      }

      // Track export
      await this.trackExport(request.sessionId, request.userId, version.version, zipBuffer.length)

      return {
        success: true,
        exportId: request.sessionId,
        downloadUrl: uploadResult.url,
        size: uploadResult.size,
        version: version.version,
        validation: exportValidation
      }

    } catch (error: any) {
      console.error('Export orchestration failed:', error)
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
    const supabase = createSupabaseClient()
    
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
    const supabase = createSupabaseClient()
    
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    return data
  }

  private async fetchAnswers(sessionId: string): Promise<Record<number, any>> {
    const supabase = createSupabaseClient()
    
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
      const supabase = createSupabaseClient()
      
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