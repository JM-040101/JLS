import { requireAuth } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, FileText, Package, Eye } from 'lucide-react'
import UserMenu from '@/components/auth/user-menu'
import CompletedPlanView from '@/components/export/completed-plan-view'

interface ExportPageProps {
  params: {
    id: string
  }
}

export default async function ExportPage({ params }: ExportPageProps) {
  const user = await requireAuth()
  const supabase = createSupabaseServerClient()

  // Get session data
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !session) {
    notFound()
  }

  // Check if session is completed
  const isCompleted = session.status === 'completed'

  // Fetch phase templates and answers for completed plans
  let phaseTemplates = []
  let answers = []

  if (isCompleted) {
    const { data: templates } = await supabase
      .from('phase_templates')
      .select('*')
      .order('phase_number', { ascending: true })

    const { data: sessionAnswers } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', session.id)
      .order('phase_number', { ascending: true })

    phaseTemplates = templates || []
    answers = sessionAnswers || []
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blueprint-navy-50 to-white">
      {/* Header */}
      <header className="border-b border-blueprint-navy-100 bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-blueprint-navy-600 hover:text-blueprint-navy-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <UserMenu />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blueprint-navy-900 mb-2">
            Export Blueprint
          </h1>
          <p className="text-blueprint-navy-600">
            Download your comprehensive SaaS blueprint package
          </p>
        </div>

        {!isCompleted ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Blueprint Not Ready</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  This blueprint hasn't been completed yet. Complete all 12 phases to export your documentation.
                </p>
                <Link
                  href={`/workflow/${params.id}`}
                  className="inline-block mt-4 btn-primary text-sm"
                >
                  Continue Blueprint
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Blueprint Info */}
            <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
              <h2 className="text-xl font-semibold text-blueprint-navy-900 mb-4">
                Blueprint Details
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blueprint-navy-600">Project Name</span>
                  <span className="font-medium text-blueprint-navy-900">
                    {session.app_description || 'Untitled Blueprint'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blueprint-navy-600">Phases Completed</span>
                  <span className="font-medium text-blueprint-navy-900">
                    {session.completed_phases}/12
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blueprint-navy-600">Created</span>
                  <span className="font-medium text-blueprint-navy-900">
                    {new Date(session.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Package className="w-5 h-5 text-blueprint-navy-600" />
                <h2 className="text-xl font-semibold text-blueprint-navy-900">
                  Export Package
                </h2>
              </div>

              <p className="text-blueprint-navy-600 mb-6">
                Your blueprint will be exported as a ZIP file containing:
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <FileText className="w-4 h-4 text-blueprint-cyan-600 mr-2 mt-1" />
                  <span className="text-blueprint-navy-700">README.md - Main project overview</span>
                </li>
                <li className="flex items-start">
                  <FileText className="w-4 h-4 text-blueprint-cyan-600 mr-2 mt-1" />
                  <span className="text-blueprint-navy-700">CLAUDE.md - Claude Code instructions</span>
                </li>
                <li className="flex items-start">
                  <FileText className="w-4 h-4 text-blueprint-cyan-600 mr-2 mt-1" />
                  <span className="text-blueprint-navy-700">Module documentation (under 50KB each)</span>
                </li>
                <li className="flex items-start">
                  <FileText className="w-4 h-4 text-blueprint-cyan-600 mr-2 mt-1" />
                  <span className="text-blueprint-navy-700">Executable Claude Code prompts</span>
                </li>
              </ul>

              <a
                href={`/api/export/${params.id}`}
                className="btn-primary inline-flex items-center"
                download
              >
                <Download className="w-5 h-5 mr-2" />
                Download Blueprint Package
              </a>
              <p className="text-xs text-blueprint-navy-500 mt-2">
                Download includes README, CLAUDE.md, and all phase documentation
              </p>
            </div>

            {/* Completed Plan View */}
            <CompletedPlanView
              phaseTemplates={phaseTemplates}
              answers={answers}
              sessionName={session.app_description || 'Untitled Blueprint'}
            />

            {/* View/Edit Answers Section */}
            <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Eye className="w-5 h-5 text-blueprint-navy-600" />
                <h2 className="text-xl font-semibold text-blueprint-navy-900">
                  Interactive View
                </h2>
              </div>

              <p className="text-blueprint-navy-600 mb-4">
                Want to navigate through your blueprint in the full workflow interface? View all phases with the original questions and your answers.
              </p>

              <Link
                href={`/workflow/${params.id}`}
                className="btn-secondary inline-flex items-center"
              >
                <FileText className="w-5 h-5 mr-2" />
                View in Workflow Interface
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
