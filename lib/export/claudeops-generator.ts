// ClaudeOps Document Generator

import { 
  ClaudeModule, 
  ClaudePrompt, 
  TemplateVariables,
  ExportedFile 
} from './types'
import {
  CLAUDE_MD_TEMPLATE,
  README_TEMPLATE,
  MODULE_README_TEMPLATE,
  processTemplate,
  generateModuleTree,
  generateDataFlow
} from './templates'

export class ClaudeOpsGenerator {
  private variables: TemplateVariables
  private maxFileSize: number = 50 * 1024 // 50KB limit for ClaudeOps

  constructor(variables: TemplateVariables) {
    this.variables = {
      ...variables,
      timestamp: new Date().toISOString(),
      version: variables.version || '1.0.0'
    }
  }

  // Generate main CLAUDE.md file
  generateClaudeMd(): ExportedFile {
    const moduleTree = generateModuleTree(this.variables.modules)
    const dataFlow = generateDataFlow(this.variables.modules)
    
    const templateVars = {
      ...this.variables,
      moduleCount: this.variables.modules.length,
      moduleTree,
      dataFlow,
      constraints: this.generateConstraints(),
      mcpServers: this.extractMcpServers(),
      moduleDepGraph: this.generateDependencyGraph(),
      implementationOrder: this.calculateImplementationOrder(),
      businessLogic: this.extractBusinessLogic()
    }

    const content = processTemplate(CLAUDE_MD_TEMPLATE, templateVars)
    
    return {
      path: 'CLAUDE.md',
      content: this.ensureSizeLimit(content, 'CLAUDE.md'),
      type: 'markdown',
      size: content.length
    }
  }

  // Generate main README.md
  generateReadme(): ExportedFile {
    const templateVars = {
      ...this.variables,
      projectSlug: this.generateSlug(this.variables.businessName),
      projectStructure: generateModuleTree(this.variables.modules),
      techStack: this.extractTechStack(),
      moduleDescriptions: this.generateModuleDescriptions(),
      envVars: this.extractEnvVars()
    }

    const content = processTemplate(README_TEMPLATE, templateVars)
    
    return {
      path: 'README.md',
      content: this.ensureSizeLimit(content, 'README.md'),
      type: 'markdown',
      size: content.length
    }
  }

  // Generate module-specific READMEs
  generateModuleReadmes(): ExportedFile[] {
    return this.variables.modules.map(module => {
      const templateVars = {
        moduleName: module.title,
        description: module.description,
        features: module.features,
        dependencies: module.dependencies,
        mcpServers: module.mcpServers,
        constraints: module.constraints,
        fileStructure: this.generateModuleFileStructure(module),
        components: this.extractModuleComponents(module),
        endpoints: this.extractModuleEndpoints(module),
        tables: this.extractModuleTables(module),
        envVars: this.extractModuleEnvVars(module),
        deployment: this.extractDeploymentNotes(module)
      }

      const content = processTemplate(MODULE_README_TEMPLATE, templateVars)
      const path = `modules/${module.name}/README.md`
      
      return {
        path,
        content: this.ensureSizeLimit(content, path),
        type: 'markdown',
        size: content.length
      }
    })
  }

  // Generate modular documentation following ClaudeOps methodology
  generateClaudeOpsModules(): ExportedFile[] {
    const files: ExportedFile[] = []
    
    // Split large modules into smaller files if needed
    this.variables.modules.forEach(module => {
      const moduleContent = this.generateModuleContent(module)
      
      if (moduleContent.length > this.maxFileSize) {
        // Split into multiple files
        const parts = this.splitContent(moduleContent, module.name)
        parts.forEach((part, index) => {
          files.push({
            path: `modules/${module.name}/part-${index + 1}.md`,
            content: part,
            type: 'markdown',
            size: part.length
          })
        })
      } else {
        files.push({
          path: `modules/${module.name}/implementation.md`,
          content: moduleContent,
          type: 'markdown',
          size: moduleContent.length
        })
      }
    })
    
    return files
  }

  // Generate module content with ClaudeOps structure
  private generateModuleContent(module: ClaudeModule): string {
    const sections = [
      `# ${module.title} Implementation`,
      '',
      '## Purpose',
      module.description,
      '',
      '## Constraints',
      module.constraints.map(c => `- **Must** ${c}`).join('\n'),
      '',
      '## State / Flow',
      this.generateStateFlow(module),
      '',
      '## MCP Servers',
      module.mcpServers.length > 0 
        ? module.mcpServers.map(s => `- ${s}`).join('\n')
        : '- None required',
      '',
      '## Dependencies',
      module.dependencies.length > 0
        ? module.dependencies.map(d => `- ${d}`).join('\n')
        : '- None',
      '',
      '## Implementation Details',
      module.content,
      '',
      '## Features',
      module.features.map(f => `### ${f}`).join('\n\n'),
      '',
      '## Testing Requirements',
      this.generateTestingRequirements(module),
      '',
      '## Security Considerations',
      this.generateSecurityConsiderations(module),
      '',
      '## Performance Optimization',
      this.generatePerformanceNotes(module)
    ]
    
    return sections.join('\n')
  }

  // Helper methods
  private generateConstraints(): string[] {
    const constraints = [
      'All modules must use TypeScript with strict mode',
      'Data access must use Row Level Security (RLS)',
      'API endpoints must implement proper error handling',
      'Environment variables must never be committed',
      'All user inputs must be validated and sanitized'
    ]
    
    // Add module-specific constraints
    this.variables.modules.forEach(module => {
      module.constraints.forEach(c => {
        if (!constraints.includes(c)) {
          constraints.push(c)
        }
      })
    })
    
    return constraints
  }

  private extractMcpServers(): Array<{name: string, purpose: string}> {
    const servers = new Map<string, string>()
    
    this.variables.modules.forEach(module => {
      module.mcpServers.forEach(server => {
        if (!servers.has(server)) {
          servers.set(server, this.getMcpServerPurpose(server))
        }
      })
    })
    
    return Array.from(servers).map(([name, purpose]) => ({ name, purpose }))
  }

  private getMcpServerPurpose(server: string): string {
    const purposes: Record<string, string> = {
      'supabase': 'Database operations, authentication, and storage',
      'playwright': 'E2E testing and browser automation',
      'stripe': 'Payment processing and subscription management',
      'resend': 'Email sending and transactional emails'
    }
    
    return purposes[server] || 'Custom MCP server integration'
  }

  private generateDependencyGraph(): string {
    const lines: string[] = []
    
    this.variables.modules.forEach(module => {
      if (module.dependencies.length > 0) {
        lines.push(`${module.name}:`)
        module.dependencies.forEach(dep => {
          lines.push(`  → ${dep}`)
        })
      }
    })
    
    return lines.length > 0 ? lines.join('\n') : 'No inter-module dependencies'
  }

  private calculateImplementationOrder(): Array<{order: number, name: string, reason: string}> {
    const order: Array<{order: number, name: string, reason: string}> = []
    const implemented = new Set<string>()
    let orderNum = 1
    
    // First implement modules with no dependencies
    this.variables.modules
      .filter(m => m.dependencies.length === 0)
      .forEach(module => {
        order.push({
          order: orderNum++,
          name: module.name,
          reason: 'No dependencies - can be implemented immediately'
        })
        implemented.add(module.name)
      })
    
    // Then implement modules whose dependencies are satisfied
    let remaining = this.variables.modules.filter(m => !implemented.has(m.name))
    while (remaining.length > 0) {
      const ready = remaining.filter(m => 
        m.dependencies.every(dep => implemented.has(dep))
      )
      
      if (ready.length === 0) {
        // Circular dependency or unresolved dependency
        remaining.forEach(m => {
          order.push({
            order: orderNum++,
            name: m.name,
            reason: 'Circular or external dependencies - implement with stubs'
          })
        })
        break
      }
      
      ready.forEach(module => {
        order.push({
          order: orderNum++,
          name: module.name,
          reason: `Dependencies satisfied: ${module.dependencies.join(', ')}`
        })
        implemented.add(module.name)
      })
      
      remaining = remaining.filter(m => !implemented.has(m.name))
    }
    
    return order
  }

  private extractBusinessLogic(): Array<{feature: string, logic: string}> {
    const logic: Array<{feature: string, logic: string}> = []
    
    this.variables.modules.forEach(module => {
      module.features.forEach(feature => {
        logic.push({
          feature: `${module.name}/${feature}`,
          logic: this.generateBusinessLogicDescription(module, feature)
        })
      })
    })
    
    return logic.slice(0, 10) // Limit to top 10 for brevity
  }

  private generateBusinessLogicDescription(module: ClaudeModule, feature: string): string {
    // Generate contextual business logic based on module and feature
    const descriptions: Record<string, string> = {
      'auth': 'Secure user authentication with JWT and refresh tokens',
      'api': 'RESTful API with type-safe request/response handling',
      'database': 'Optimized queries with connection pooling and caching',
      'ui': 'Responsive components with accessibility compliance',
      'payments': 'PCI-compliant payment processing with webhook handling'
    }
    
    return descriptions[module.name] || 'Standard implementation following best practices'
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private extractTechStack(): Array<{category: string, technology: string}> {
    return [
      { category: 'Frontend', technology: 'Next.js 14+ with App Router' },
      { category: 'Styling', technology: 'Tailwind CSS' },
      { category: 'Database', technology: 'Supabase (PostgreSQL)' },
      { category: 'Authentication', technology: 'Supabase Auth' },
      { category: 'AI', technology: 'GPT-5 & Claude Sonnet 4' },
      { category: 'Payments', technology: 'Stripe' },
      { category: 'Language', technology: 'TypeScript' },
      { category: 'Deployment', technology: 'Vercel' }
    ]
  }

  private generateModuleDescriptions(): string {
    return this.variables.modules.map(module => 
      `### ${module.title}\n${module.description}\n\n**Key Features:**\n${module.features.map(f => `- ${f}`).join('\n')}`
    ).join('\n\n')
  }

  private extractEnvVars(): Array<{name: string, description: string, required: string}> {
    return [
      { name: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase project URL', required: 'Yes' },
      { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase anonymous key', required: 'Yes' },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key', required: 'Yes' },
      { name: 'OPENAI_API_KEY', description: 'OpenAI API key for GPT-5', required: 'Yes' },
      { name: 'ANTHROPIC_API_KEY', description: 'Anthropic API key for Claude', required: 'Yes' },
      { name: 'STRIPE_SECRET_KEY', description: 'Stripe secret key', required: 'Optional' },
      { name: 'NEXT_PUBLIC_APP_URL', description: 'Application URL', required: 'Yes' }
    ]
  }

  private generateModuleFileStructure(module: ClaudeModule): string {
    const structure = [
      `${module.name}/`,
      '├── README.md',
      '├── index.ts',
      '├── types.ts',
      '├── constants.ts',
      '├── components/',
      '├── hooks/',
      '├── utils/',
      '└── __tests__/'
    ]
    
    return structure.join('\n')
  }

  private extractModuleComponents(module: ClaudeModule): any[] {
    // Extract based on module type
    return []
  }

  private extractModuleEndpoints(module: ClaudeModule): any[] {
    // Extract API endpoints for the module
    return []
  }

  private extractModuleTables(module: ClaudeModule): any[] {
    // Extract database tables for the module
    return []
  }

  private extractModuleEnvVars(module: ClaudeModule): any[] {
    // Extract environment variables for the module
    return []
  }

  private extractDeploymentNotes(module: ClaudeModule): string[] {
    return [
      'Ensure all environment variables are configured',
      'Run database migrations before deployment',
      'Test all API endpoints in staging environment',
      'Verify MCP server connections'
    ]
  }

  private generateStateFlow(module: ClaudeModule): string {
    // Generate state flow diagram for the module
    return 'Input → Validation → Processing → Output'
  }

  private generateTestingRequirements(module: ClaudeModule): string {
    return `
- Unit tests for all exported functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance tests for data operations
- Security tests for authentication flows
    `.trim()
  }

  private generateSecurityConsiderations(module: ClaudeModule): string {
    return `
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token validation
- Rate limiting implementation
    `.trim()
  }

  private generatePerformanceNotes(module: ClaudeModule): string {
    return `
- Implement caching where appropriate
- Use database indexes for frequent queries
- Lazy load components and data
- Optimize bundle size
- Use connection pooling
    `.trim()
  }

  private ensureSizeLimit(content: string, filename: string): string {
    if (content.length <= this.maxFileSize) {
      return content
    }
    
    // Truncate and add note
    const truncated = content.substring(0, this.maxFileSize - 200)
    return truncated + `\n\n---\n*Note: Content truncated to meet 50KB limit. Full content available in ${filename}.full*`
  }

  private splitContent(content: string, moduleName: string): string[] {
    const parts: string[] = []
    const lines = content.split('\n')
    let currentPart = ''
    
    for (const line of lines) {
      if ((currentPart + line + '\n').length > this.maxFileSize - 500) {
        // Leave room for continuation notes
        currentPart += `\n\n---\n*Continued in next part...*`
        parts.push(currentPart)
        currentPart = `# ${moduleName} (Part ${parts.length + 1})\n\n*...continued from previous part*\n\n`
      }
      currentPart += line + '\n'
    }
    
    if (currentPart.trim()) {
      parts.push(currentPart)
    }
    
    return parts
  }
}