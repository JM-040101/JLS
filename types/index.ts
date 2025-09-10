// Core workflow types
export interface WorkflowSession {
  id: string
  user_id: string
  app_description: string
  status: 'in_progress' | 'completed' | 'archived'
  completed_phases: number
  created_at: string
  updated_at: string
}

export interface PhaseAnswer {
  id: string
  session_id: string
  phase_number: number
  question_id: string
  answer_text: string
  created_at: string
}

export interface GeneratedOutput {
  id: string
  session_id: string
  file_name: string
  file_content: string
  file_type: 'md' | 'json' | 'txt' | 'prompt'
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  subscription_id: string | null
  created_at: string
  updated_at: string
}

// Workflow phase definitions
export interface WorkflowPhase {
  id: number
  title: string
  description: string
  questions: PhaseQuestion[]
  estimatedTime: number // in minutes
}

export interface PhaseQuestion {
  id: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
  }
  tooltip?: string
}

// AI processing types
export interface GPTWorkflowRequest {
  phase: number
  sessionId: string
  answers: Record<string, string>
}

export interface ClaudeProcessingRequest {
  sessionId: string
  gptPlan: string
  userAnswers: PhaseAnswer[]
}

// Export types
export interface ExportBundle {
  files: ExportFile[]
  metadata: ExportMetadata
}

export interface ExportFile {
  name: string
  content: string
  type: 'md' | 'json' | 'txt' | 'prompt'
  path: string
}

export interface ExportMetadata {
  sessionId: string
  appDescription: string
  generatedAt: string
  version: string
  stack: string
}

// Stripe/Payment types
export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  stripePrice: string
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
  }
}

// Component prop types
export interface ProgressBarProps {
  current: number
  total: number
  className?: string
}

export interface PhaseCardProps {
  phase: WorkflowPhase
  isActive: boolean
  isCompleted: boolean
  isLocked: boolean
  onSelect: () => void
}