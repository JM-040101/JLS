# Supabase Setup Guide

## Project Details
- **Project ID**: rtycsgxcsedvdbhehcjs
- **Project URL**: https://rtycsgxcsedvdbhehcjs.supabase.co
- **Region**: eu-west-2

## Required Database Tables

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Create profiles table (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workflow sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  app_description TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'archived')),
  completed_phases INTEGER DEFAULT 0 CHECK (completed_phases >= 0 AND completed_phases <= 12),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create phase answers table
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1 AND phase_number <= 12),
  question_id TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, phase_number, question_id)
);

-- Create generated outputs table
CREATE TABLE outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_content TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('md', 'json', 'txt', 'prompt')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_answers_session_id ON answers(session_id);
CREATE INDEX idx_answers_phase ON answers(session_id, phase_number);
CREATE INDEX idx_outputs_session_id ON outputs(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS) Policies

Enable RLS and create policies for multi-tenant access:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE outputs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Sessions policies
CREATE POLICY "Users can view own sessions" 
ON sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" 
ON sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" 
ON sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" 
ON sessions FOR DELETE 
USING (auth.uid() = user_id);

-- Answers policies
CREATE POLICY "Users can view answers for own sessions" 
ON answers FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM sessions 
    WHERE sessions.id = answers.session_id 
    AND sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create answers for own sessions" 
ON answers FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sessions 
    WHERE sessions.id = answers.session_id 
    AND sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update answers for own sessions" 
ON answers FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM sessions 
    WHERE sessions.id = answers.session_id 
    AND sessions.user_id = auth.uid()
  )
);

-- Outputs policies
CREATE POLICY "Users can view outputs for own sessions" 
ON outputs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM sessions 
    WHERE sessions.id = outputs.session_id 
    AND sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create outputs for own sessions" 
ON outputs FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sessions 
    WHERE sessions.id = outputs.session_id 
    AND sessions.user_id = auth.uid()
  )
);
```

## Google OAuth Setup

1. Go to your Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret from Google Cloud Console
4. Set redirect URL: `https://rtycsgxcsedvdbhehcjs.supabase.co/auth/v1/callback`
5. Add this URL to your Google OAuth authorized redirect URIs

## Environment Variables

Copy `.env.local.example` to `.env.local` and update:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rtycsgxcsedvdbhehcjs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Get your keys from Supabase Dashboard > Settings > API

## Testing Authentication

1. Start the development server: `npm run dev`
2. Visit http://localhost:3000
3. Test sign up with email/password
4. Test Google OAuth sign in
5. Verify protected routes redirect to sign-in
6. Check subscription validation on /workflow routes