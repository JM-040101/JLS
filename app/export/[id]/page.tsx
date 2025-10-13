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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center overflow-hidden relative cursor-progress">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center max-w-2xl px-4">
          {/* Animated Claude Icon */}
          <div className="mb-8 relative">
            <div className="inline-block relative">
              {/* Triple rotating rings */}
              <div className="absolute inset-0 rounded-full border-4 border-purple-300 animate-spin" style={{animationDuration: '3s'}}></div>
              <div className="absolute inset-2 rounded-full border-4 border-blue-300 animate-spin" style={{animationDuration: '2s', animationDirection: 'reverse'}}></div>
              <div className="absolute inset-4 rounded-full border-4 border-pink-300 animate-spin" style={{animationDuration: '1.5s'}}></div>

              {/* Center with pulsing Claude emoji */}
              <div className="relative bg-white rounded-full p-8 shadow-2xl animate-pulse-slow">
                <span className="text-6xl">🎨</span>
              </div>
            </div>
          </div>

          {/* Animated Title */}
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 animate-gradient">
            Claude is Crafting Your Files
          </h2>

          <p className="text-lg text-gray-700 mb-8 font-medium">
            ✨ Transforming your approved plan into beautiful documentation
          </p>

          {/* Animated Checklist */}
          <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl p-6 shadow-xl mb-8">
            <h3 className="font-bold text-purple-900 mb-4 text-lg">📝 Generation Progress:</h3>
            <ul className="text-left space-y-3">
              <li className="flex items-center text-gray-700 animate-fade-in">
                <span className="text-green-500 mr-3 text-xl animate-bounce">✓</span>
                Loading your approved building plan
              </li>
              <li className="flex items-center text-gray-700 animate-fade-in animation-delay-500">
                <span className="text-blue-500 mr-3 text-xl animate-spin-slow">⟳</span>
                Claude generating README.md and CLAUDE.md
              </li>
              <li className="flex items-center text-gray-700 animate-fade-in animation-delay-1000">
                <span className="text-purple-500 mr-3 text-xl animate-pulse">●</span>
                Creating module documentation files
              </li>
              <li className="flex items-center text-gray-700 animate-fade-in animation-delay-1500">
                <span className="text-pink-500 mr-3 text-xl animate-bounce animation-delay-2000">↻</span>
                Generating executable Claude Code prompts
              </li>
              <li className="flex items-center text-gray-700 animate-fade-in animation-delay-2000">
                <span className="text-orange-500 mr-3 text-xl">📦</span>
                Packaging everything into a ZIP file
              </li>
            </ul>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-6">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 rounded-full animate-progress-slow shadow-lg"></div>
            </div>
            <p className="text-sm text-gray-600 mt-3 italic font-medium">
              ⏱️ This usually takes 30-60 seconds...
            </p>
          </div>

          {/* Fun floating icons */}
          <div className="flex justify-center gap-4 text-4xl">
            <span className="animate-bounce" style={{animationDelay: '0s'}}>📄</span>
            <span className="animate-bounce" style={{animationDelay: '0.2s'}}>✨</span>
            <span className="animate-bounce" style={{animationDelay: '0.4s'}}>🎯</span>
            <span className="animate-bounce" style={{animationDelay: '0.6s'}}>📦</span>
          </div>
        </div>

        {/* Custom Animations */}
        <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(30px, -40px) scale(1.1); }
            50% { transform: translate(-30px, 30px) scale(0.9); }
            75% { transform: translate(40px, 40px) scale(1.05); }
          }
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes progress-slow {
            0% { width: 0%; }
            30% { width: 40%; }
            60% { width: 65%; }
            100% { width: 90%; }
          }
          @keyframes pulse-slow {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-blob {
            animation: blob 8s infinite;
          }
          .animation-delay-500 {
            animation-delay: 0.5s;
          }
          .animation-delay-1000 {
            animation-delay: 1s;
          }
          .animation-delay-1500 {
            animation-delay: 1.5s;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }
          .animate-progress-slow {
            animation: progress-slow 45s ease-out forwards;
          }
          .animate-pulse-slow {
            animation: pulse-slow 2s ease-in-out infinite;
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
          }
          .animate-spin-slow {
            animation: spin-slow 2s linear infinite;
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
