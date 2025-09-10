# Database Module – Purpose
Supabase PostgreSQL schema with RLS for multi-tenant data isolation and workflow state management.

## Features

### Core Tables
#### Constraints
- **Must** use UUIDs for all primary keys
- **Must** implement Row Level Security (RLS) on all tables
- **Must** include created_at and updated_at timestamps
- **Must** set up proper foreign key relationships

#### State / Flow
```sql
-- Users table (managed by Supabase Auth)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow sessions
sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  app_description TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  completed_phases INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase answers
answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  phase_number INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated outputs
outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  file_name TEXT NOT NULL,
  file_content TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
RLS Policies
Constraints

Must restrict access to user's own data only
Must allow authenticated users to CRUD their sessions
Must prevent access to inactive subscription users for new sessions

State / Flow

User authenticated → RLS checks user_id → Allow/deny operation