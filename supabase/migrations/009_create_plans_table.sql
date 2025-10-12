-- Create plans table to store GPT-generated building plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Plan content
  content TEXT NOT NULL,
  edited_content TEXT, -- User-edited version of the plan

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'edited', 'approved')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT unique_session_plan UNIQUE (session_id)
);

-- Create index for faster lookups
CREATE INDEX idx_plans_session_id ON public.plans(session_id);
CREATE INDEX idx_plans_user_id ON public.plans(user_id);
CREATE INDEX idx_plans_status ON public.plans(status);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own plans
CREATE POLICY "Users can view own plans"
  ON public.plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own plans
CREATE POLICY "Users can insert own plans"
  ON public.plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own plans
CREATE POLICY "Users can update own plans"
  ON public.plans
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own plans
CREATE POLICY "Users can delete own plans"
  ON public.plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION update_plans_updated_at();
