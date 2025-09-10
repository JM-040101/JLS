import { requireSubscription } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NewWorkflowForm from '@/components/workflow/new-workflow-form'

export default async function NewWorkflowPage() {
  const user = await requireSubscription()
  
  // Check if user has reached session limit
  const { createSupabaseServerClient } = await import('@/lib/supabase-server')
  const supabase = createSupabaseServerClient()
  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'in_progress')

  if (count && count >= 3) {
    redirect('/dashboard?error=session_limit')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blueprint-navy-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-blueprint-navy-900 mb-2">
            Create New Blueprint
          </h1>
          <p className="text-blueprint-navy-600 mb-8">
            Start your SaaS blueprint journey by describing your idea
          </p>
          
          <NewWorkflowForm userId={user.id} />
        </div>
      </div>
    </div>
  )
}