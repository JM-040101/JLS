// Export System Types

export interface ExportRequest {
  sessionId: string
  userId: string
  format: 'zip' | 'json' | 'markdown'
  includePrompts: boolean
  includeDocumentation: boolean
  version?: string
}

export interface ExportedFile {
  path: string
  content: string
  type: 'markdown' | 'json' | 'yaml' | 'typescript' | 'sql'
  size: number
}

export interface ExportStructure {
  id: string
  sessionId: string
  files: ExportedFile[]
  metadata: ExportMetadata
  createdAt: Date
}

export interface ExportMetadata {
  version: string
  generatedBy: string
  businessName: string
  targetAudience: string
  modules: string[]
  totalSize: number
  fileCount: number
  mcpServers: string[]
}

export interface ClaudeModule {
  name: string
  title: string
  description: string
  path: string
  dependencies: string[]
  mcpServers: string[]
  constraints: string[]
  features: string[]
  content: string
}

export interface ClaudePrompt {
  id: string
  title: string
  description: string
  context: string
  mcpServers: string[]
  model: 'claude-3-5-sonnet' | 'claude-3-opus'
  prompt: string
  expectedOutput: string
  dependencies: string[]
  category: 'setup' | 'implementation' | 'testing' | 'deployment'
}

export interface ReadmeSection {
  title: string
  content: string
  order: number
  subsections?: ReadmeSection[]
}

export interface TemplateVariables {
  businessName: string
  businessIdea: string
  targetAudience: string
  techStack: string[]
  modules: ClaudeModule[]
  prompts: ClaudePrompt[]
  features: string[]
  constraints: string[]
  timestamp: string
  version: string
}

export interface FileTemplate {
  name: string
  path: string
  template: string
  variables: Partial<TemplateVariables>
  maxSize: number // in KB
}

export interface ExportValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  fileCount: number
  totalSize: number
  oversizedFiles: string[]
}