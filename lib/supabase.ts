import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Client component client (for use in client components)
export const createSupabaseServerClient = () => {
  return createClientComponentClient()
}

// Database types (to be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'past_due'
          subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          app_description: string
          status: 'in_progress' | 'completed' | 'archived'
          completed_phases: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          app_description: string
          status?: 'in_progress' | 'completed' | 'archived'
          completed_phases?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          app_description?: string
          status?: 'in_progress' | 'completed' | 'archived'
          completed_phases?: number
          created_at?: string
          updated_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          session_id: string
          phase_number: number
          question_id: string
          answer_text: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          phase_number: number
          question_id: string
          answer_text: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          phase_number?: number
          question_id?: string
          answer_text?: string
          created_at?: string
        }
      }
      outputs: {
        Row: {
          id: string
          session_id: string
          file_name: string
          file_content: string
          file_type: 'md' | 'json' | 'txt' | 'prompt'
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          file_name: string
          file_content: string
          file_type: 'md' | 'json' | 'txt' | 'prompt'
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          file_name?: string
          file_content?: string
          file_type?: 'md' | 'json' | 'txt' | 'prompt'
          created_at?: string
        }
      }
    }
  }
}