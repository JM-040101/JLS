import { requireSubscription } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import WorkflowContainer from '@/components/workflow/workflow-container'

export default async function WorkflowPage({ params }: { params: { id: string } }) {
  const user = await requireSubscription()
  const supabase = createSupabaseServerClient()

  // Fetch session and verify ownership
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    notFound()
  }

  // Allow viewing completed sessions in read-only mode
  // The WorkflowContainer component handles isViewOnly state

  // Fetch phase templates
  const { data: phaseTemplates } = await supabase
    .from('phase_templates')
    .select('*')
    .order('phase_number', { ascending: true })

  // Fetch existing answers
  const { data: existingAnswers } = await supabase
    .from('answers')
    .select('*')
    .eq('session_id', session.id)
    .order('phase_number', { ascending: true })

  return (
    <WorkflowContainer
      session={session}
      phaseTemplates={phaseTemplates || []}
      existingAnswers={existingAnswers || []}
      userId={user.id}
    />
  )
}