// Generated TypeScript types for Supabase database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_id: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          app_description: string
          app_name: string | null
          target_audience: string | null
          status: 'in_progress' | 'completed' | 'archived'
          completed_phases: number
          current_phase: number
          metadata: Json
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          app_description: string
          app_name?: string | null
          target_audience?: string | null
          status?: 'in_progress' | 'completed' | 'archived'
          completed_phases?: number
          current_phase?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          app_description?: string
          app_name?: string | null
          target_audience?: string | null
          status?: 'in_progress' | 'completed' | 'archived'
          completed_phases?: number
          current_phase?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      answers: {
        Row: {
          id: string
          session_id: string
          phase_number: number
          question_id: string
          question_text: string
          answer_text: string
          answer_type: 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          phase_number: number
          question_id: string
          question_text: string
          answer_text: string
          answer_type: 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          phase_number?: number
          question_id?: string
          question_text?: string
          answer_text?: string
          answer_type?: 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      outputs: {
        Row: {
          id: string
          session_id: string
          file_name: string
          file_path: string
          file_content: string
          file_type: 'md' | 'json' | 'txt' | 'prompt' | 'yaml' | 'ts' | 'js'
          file_size: number
          category: 'readme' | 'module' | 'prompt' | 'config' | 'documentation'
          metadata: Json
          created_at: string
          version: number
        }
        Insert: {
          id?: string
          session_id: string
          file_name: string
          file_path: string
          file_content: string
          file_type: 'md' | 'json' | 'txt' | 'prompt' | 'yaml' | 'ts' | 'js'
          file_size?: number
          category: 'readme' | 'module' | 'prompt' | 'config' | 'documentation'
          metadata?: Json
          created_at?: string
          version?: number
        }
        Update: {
          id?: string
          session_id?: string
          file_name?: string
          file_path?: string
          file_content?: string
          file_type?: 'md' | 'json' | 'txt' | 'prompt' | 'yaml' | 'ts' | 'js'
          file_size?: number
          category?: 'readme' | 'module' | 'prompt' | 'config' | 'documentation'
          metadata?: Json
          created_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "outputs_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      phase_templates: {
        Row: {
          id: string
          phase_number: number
          title: string
          description: string
          estimated_time: number
          questions: Json
          help_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phase_number: number
          title: string
          description: string
          estimated_time?: number
          questions?: Json
          help_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phase_number?: number
          title?: string
          description?: string
          estimated_time?: number
          questions?: Json
          help_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      export_history: {
        Row: {
          id: string
          session_id: string
          user_id: string
          export_type: 'zip' | 'github' | 'gitlab' | 'download'
          file_url: string | null
          file_size: number | null
          metadata: Json
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          export_type: 'zip' | 'github' | 'gitlab' | 'download'
          file_url?: string | null
          file_size?: number | null
          metadata?: Json
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          export_type?: 'zip' | 'github' | 'gitlab' | 'download'
          file_url?: string | null
          file_size?: number | null
          metadata?: Json
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_history_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          changes: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          changes?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          changes?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {
      user_owns_session: {
        Args: {
          session_uuid: string
        }
        Returns: boolean
      }
      user_has_active_subscription: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_user_session_count: {
        Args: {
          status_filter?: string
        }
        Returns: number
      }
    }
    Enums: {
      subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
      session_status: 'in_progress' | 'completed' | 'archived'
      answer_type: 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean'
      file_type: 'md' | 'json' | 'txt' | 'prompt' | 'yaml' | 'ts' | 'js'
      file_category: 'readme' | 'module' | 'prompt' | 'config' | 'documentation'
      export_type: 'zip' | 'github' | 'gitlab' | 'download'
    }
  }
}

// Helper types for better type inference
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Profile = Tables<'profiles'>
export type Session = Tables<'sessions'>
export type Answer = Tables<'answers'>
export type Output = Tables<'outputs'>
export type PhaseTemplate = Tables<'phase_templates'>
export type ExportHistory = Tables<'export_history'>
export type AuditLog = Tables<'audit_log'>

// Insert types
export type ProfileInsert = Inserts<'profiles'>
export type SessionInsert = Inserts<'sessions'>
export type AnswerInsert = Inserts<'answers'>
export type OutputInsert = Inserts<'outputs'>
export type PhaseTemplateInsert = Inserts<'phase_templates'>
export type ExportHistoryInsert = Inserts<'export_history'>
export type AuditLogInsert = Inserts<'audit_log'>

// Update types
export type ProfileUpdate = Updates<'profiles'>
export type SessionUpdate = Updates<'sessions'>
export type AnswerUpdate = Updates<'answers'>
export type OutputUpdate = Updates<'outputs'>
export type PhaseTemplateUpdate = Updates<'phase_templates'>
export type ExportHistoryUpdate = Updates<'export_history'>
export type AuditLogUpdate = Updates<'audit_log'>