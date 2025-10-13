'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, Download, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ExportPageProps {
  params: {
    id: string
  }
}

export default function ExportPage({ params }: ExportPageProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [status, setStatus] = useState<'checking' | 'generating' | 'ready' | 'error'>('checking')
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  useEffect(() => {
    checkPlanAndExport()
  }, [params.id])

  async function checkPlanAndExport() {
    try {
      // Check if plan is approved
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('id, status')
        .eq('session_id', params.id)
        .single()

      if (planError || !plan) {
        setError('No plan found. Please complete the workflow first.')
        setStatus('error')
        return
      }

      if (plan.status !== 'approved') {
        setError('Plan not approved. Please review and approve your plan first.')
        setStatus('error')
        return
      }

      // Plan is approved, trigger export
      setStatus('generating')

      // Trigger download
      const url = `/api/export/${params.id}`
      setDownloadUrl(url)

      // Auto-download
      window.location.href = url

      // Show success after a delay
      setTimeout(() => {
        setStatus('ready')
      }, 2000)

    } catch (err) {
      console.error('Export error:', err)
      setError(err instanceof Error ? err.message : 'Failed to export')
      setStatus('error')
    }
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Checking Plan Status</h2>
          <p className="text-gray-600">Verifying your approved plan...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Export Error</h2>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <div className="flex gap-4">
            <Link
              href={`/preview-plan/${params.id}`}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              Review Plan
            </Link>
            <Link
              href="/dashboard"
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          {/* Simple spinner */}
          <div className="mb-6 inline-block">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Generating Your Export</h2>
          <p className="text-gray-600 mb-6">
            Claude is transforming your approved plan into documentation files...
          </p>

          {/* Progress checklist */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left mb-4">
            <h3 className="font-semibold text-blue-900 mb-3">✨ What's happening:</h3>
            <ul className="text-blue-800 space-y-2 text-sm">
              <li>• Loading your approved building plan</li>
              <li>• Claude is generating README.md and CLAUDE.md</li>
              <li>• Creating module documentation files</li>
              <li>• Generating executable Claude Code prompts</li>
              <li>• Packaging everything into a ZIP file</li>
            </ul>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full animate-progress-slow"></div>
          </div>
          <p className="text-gray-500 text-sm">This usually takes 30-60 seconds...</p>
        </div>

        <style jsx>{`
          @keyframes progress-slow {
            0% { width: 0%; }
            100% { width: 90%; }
          }
          .animate-progress-slow {
            animation: progress-slow 45s ease-out forwards;
          }
        `}</style>
      </div>
    )
  }

  // Status is 'ready'
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Export Ready!</h2>
        <p className="text-gray-600 mb-6 text-center">
          Your blueprint package has been generated. The download should start automatically.
        </p>

        {downloadUrl && (
          <a
            href={downloadUrl}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg mb-4 flex items-center justify-center"
            download
          >
            <Download className="w-5 h-5 mr-2" />
            Download Again
          </a>
        )}

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">📦 Your package includes:</h3>
          <ul className="text-gray-700 space-y-1 text-sm">
            <li>✓ README.md - Project overview</li>
            <li>✓ CLAUDE.md - Claude Code instructions</li>
            <li>✓ modules/ - Documentation modules</li>
            <li>✓ prompts/ - Executable prompts</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <Link
            href={`/workflow/${params.id}`}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center text-sm"
          >
            View Workflow
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
