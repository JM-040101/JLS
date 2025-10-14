'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github-dark.css'
import { branding } from '@/branding.config'

interface PlanPreviewProps {
  params: {
    id: string
  }
}

export default function PlanPreview({ params }: PlanPreviewProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [plan, setPlan] = useState<string>('')
  const [editedPlan, setEditedPlan] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportInfo, setExportInfo] = useState<string | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [planStatus, setPlanStatus] = useState<string>('generated')

  useEffect(() => {
    checkAuthAndGenerate()
  }, [params.id])

  async function checkAuthAndGenerate() {
    // Check authentication first
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[PREVIEW-PLAN] User not authenticated, redirecting to login')
      router.push('/auth/sign-in')
      return
    }

    console.log('[PREVIEW-PLAN] User authenticated:', user.id)

    // Check if a plan already exists before generating a new one
    const { data: existingPlan } = await supabase
      .from('plans')
      .select('id, content, edited_content, status')
      .eq('session_id', params.id)
      .maybeSingle()

    if (existingPlan) {
      console.log('[PREVIEW-PLAN] Found existing plan:', existingPlan.id, 'Status:', existingPlan.status)
      setPlan(existingPlan.edited_content || existingPlan.content)
      setEditedPlan(existingPlan.edited_content || existingPlan.content)
      setPlanId(existingPlan.id)
      setPlanStatus(existingPlan.status || 'generated')
      setIsLoading(false)
      return
    }

    console.log('[PREVIEW-PLAN] No existing plan found, generating new one...')
    generatePlan()
  }

  async function generatePlan() {
    try {
      console.log('[PREVIEW-PLAN] Starting plan generation for session:', params.id)
      setIsGenerating(true)
      setError(null)

      // Step 1: Initiate job creation
      console.log('[PREVIEW-PLAN] Calling API to create job:', `/api/generate-plan/${params.id}`)
      const response = await fetch(`/api/generate-plan/${params.id}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('[PREVIEW-PLAN] Error creating job:', data)
        throw new Error(data.error || 'Failed to start plan generation')
      }

      const jobData = await response.json()
      console.log('[PREVIEW-PLAN] Job created:', jobData)

      // If plan already exists (approved), return it directly
      if (jobData.plan && jobData.planId) {
        console.log('[PREVIEW-PLAN] Received existing plan directly')
        setPlan(jobData.plan)
        setEditedPlan(jobData.plan)
        setPlanId(jobData.planId)
        return
      }

      // Step 2: Immediately trigger job processing
      const jobId = jobData.jobId
      console.log('[PREVIEW-PLAN] Triggering job processing:', jobId)

      // Fire and forget - don't await this
      fetch(`/api/jobs/process/${jobId}`, {
        method: 'POST'
      }).catch(err => {
        console.error('[PREVIEW-PLAN] Error triggering job processor:', err)
      })

      // Step 3: Poll for job completion
      console.log('[PREVIEW-PLAN] Starting to poll for job completion...')
      await pollForJobCompletion(jobId)

    } catch (err) {
      console.error('[PREVIEW-PLAN] Error generating plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate plan')
    } finally {
      setIsGenerating(false)
      setIsLoading(false)
    }
  }

  async function pollForJobCompletion(jobId: string) {
    const maxAttempts = 150 // 150 attempts * 2 seconds = 5 minutes max (matches backend timeout)
    let attempts = 0

    while (attempts < maxAttempts) {
      attempts++
      console.log(`[PREVIEW-PLAN] Polling attempt ${attempts}/${maxAttempts}`)

      try {
        const response = await fetch(`/api/jobs/${jobId}`)

        if (!response.ok) {
          console.error('[PREVIEW-PLAN] Error fetching job status')
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }

        const jobStatus = await response.json()
        console.log('[PREVIEW-PLAN] Job status:', jobStatus.status)

        if (jobStatus.status === 'completed') {
          console.log('[PREVIEW-PLAN] Job completed successfully!')

          if (jobStatus.result && jobStatus.result.plan) {
            setPlan(jobStatus.result.plan)
            setEditedPlan(jobStatus.result.plan)
            setPlanId(jobStatus.result.planId)
            console.log('[PREVIEW-PLAN] Plan loaded from job result')
          } else {
            throw new Error('Job completed but no plan data returned')
          }

          return
        }

        if (jobStatus.status === 'failed') {
          const errorMsg = jobStatus.error_message || 'Job failed without error message'
          console.error('[PREVIEW-PLAN] Job failed:', errorMsg)
          throw new Error(errorMsg)
        }

        // Still processing, wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (err) {
        console.error('[PREVIEW-PLAN] Error during polling:', err)
        throw err
      }
    }

    // Timeout after max attempts
    throw new Error('Plan generation timed out. Please try again.')
  }

  async function savePlanEdits() {
    if (!planId) {
      console.error('[PREVIEW-PLAN] No planId available for saving')
      return
    }

    try {
      console.log('[PREVIEW-PLAN] Saving plan edits for plan:', planId)
      setIsSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('plans')
        .update({
          edited_content: editedPlan,
          status: 'edited',
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)

      if (updateError) {
        console.error('[PREVIEW-PLAN] Error saving edits:', updateError)
        throw updateError
      }

      console.log('[PREVIEW-PLAN] Edits saved successfully')
      setPlan(editedPlan)
      setIsEditing(false)
    } catch (err) {
      console.error('[PREVIEW-PLAN] Failed to save edits:', err)
      setError(err instanceof Error ? err.message : 'Failed to save edits')
    } finally {
      setIsSaving(false)
    }
  }

  async function approvePlan() {
    if (!planId) {
      console.error('[PREVIEW-PLAN] No planId available for approval')
      return
    }

    try {
      console.log('[PREVIEW-PLAN] Approving plan:', planId)
      setIsApproving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('plans')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', planId)

      if (updateError) {
        console.error('[PREVIEW-PLAN] Error approving plan:', updateError)
        throw updateError
      }

      console.log('[PREVIEW-PLAN] Plan approved successfully!')
      setPlanStatus('approved')
    } catch (err) {
      console.error('[PREVIEW-PLAN] Failed to approve plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to approve plan')
    } finally {
      setIsApproving(false)
    }
  }

  async function handleExport() {
    if (!planId) {
      console.error('[PREVIEW-PLAN] No planId available for export')
      return
    }

    try {
      console.log('[PREVIEW-PLAN] Starting export for session:', params.id)
      setIsExporting(true)
      setError(null)

      // Call the export API endpoint
      const response = await fetch(`/api/export/${params.id}`, {
        method: 'GET',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate export')
      }

      // Check if we got a ZIP file or a status message
      const contentType = response.headers.get('content-type')

      if (contentType === 'application/zip') {
        // Download the ZIP file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'saas-blueprint.zip'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        console.log('[PREVIEW-PLAN] Export downloaded successfully!')
      } else {
        // Got a status message (still processing)
        const data = await response.json()
        console.log('[PREVIEW-PLAN] Export status:', data)
        setExportInfo(data.message || 'Export is being generated. Please try again in a moment.')
      }
    } catch (err) {
      console.error('[PREVIEW-PLAN] Export error:', err)
      setError(err instanceof Error ? err.message : 'Failed to export plan')
    } finally {
      setIsExporting(false)
    }
  }

  function cancelEditing() {
    setEditedPlan(plan)
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div style={{ background: branding.colors.background }} className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
        </div>

        <div className="text-center max-w-xl px-6 relative z-10">
          {/* Glowing spinner with pulse effect */}
          <div className="mb-8 relative inline-block">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full blur-xl animate-pulse"
              style={{
                background: branding.colors.accentGlow,
                transform: 'scale(1.5)'
              }}
            ></div>

            {/* Middle rotating ring */}
            <div
              className="w-24 h-24 border-4 rounded-full animate-spin relative"
              style={{
                borderColor: `${branding.colors.divider} ${branding.colors.divider} ${branding.colors.accent} ${branding.colors.accent}`,
              }}
            ></div>

            {/* Inner rotating ring (opposite direction) */}
            <div
              className="absolute inset-3 border-4 rounded-full animate-spin-reverse"
              style={{
                borderColor: `${branding.colors.accent} transparent ${branding.colors.accentLight} transparent`,
              }}
            ></div>

            {/* Center dot */}
            <div
              className="absolute inset-0 m-auto w-8 h-8 rounded-full animate-pulse"
              style={{ background: branding.colors.accent }}
            ></div>
          </div>

          {/* Title with gradient text */}
          <h2
            className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r"
            style={{
              backgroundImage: `linear-gradient(135deg, ${branding.colors.textHeading} 0%, ${branding.colors.accent} 100%)`,
              fontFamily: branding.fonts.heading
            }}
          >
            Generating Your Building Plan
          </h2>

          {/* Status Messages with icons */}
          <div className="space-y-3 mb-8">
            <div
              className="flex items-center justify-center gap-3 p-3 rounded-lg backdrop-blur-sm border"
              style={{
                backgroundColor: `${branding.colors.surface}CC`,
                borderColor: branding.colors.divider,
                color: branding.colors.text
              }}
            >
              <span className="text-2xl animate-bounce">🧠</span>
              <span className="text-sm">GPT-4 is analyzing your answers...</span>
            </div>
            <div
              className="flex items-center justify-center gap-3 p-3 rounded-lg backdrop-blur-sm border"
              style={{
                backgroundColor: `${branding.colors.surface}CC`,
                borderColor: branding.colors.divider,
                color: branding.colors.text
              }}
            >
              <span className="text-2xl animate-pulse">✨</span>
              <span className="text-sm">Synthesizing with knowledge base patterns</span>
            </div>
          </div>

          {/* Animated progress bar with glow */}
          <div
            className="w-full rounded-full h-3 mb-3 relative overflow-hidden"
            style={{ backgroundColor: branding.colors.surface }}
          >
            {/* Glow effect behind bar */}
            <div
              className="absolute inset-0 blur-md opacity-50"
              style={{
                background: `linear-gradient(90deg, transparent, ${branding.colors.accent}, transparent)`,
              }}
            ></div>

            {/* Progress bar */}
            <div
              className="h-3 rounded-full animate-progress relative"
              style={{
                background: `linear-gradient(90deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                boxShadow: `0 0 20px ${branding.colors.accentGlow}`
              }}
            ></div>

            {/* Shimmer effect */}
            <div className="absolute inset-0 shimmer"></div>
          </div>

          <p
            className="text-sm"
            style={{ color: branding.colors.textMuted }}
          >
            This usually takes 10-20 seconds...
          </p>
        </div>

        <style jsx>{`
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 95%; }
          }
          .animate-progress {
            animation: progress 15s ease-out forwards;
          }

          @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          .animate-spin-reverse {
            animation: spin-reverse 2s linear infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-20px) translateX(10px); }
          }

          .particle {
            position: absolute;
            border-radius: 50%;
            opacity: 0.1;
            animation: float 10s ease-in-out infinite;
          }

          .particle-1 {
            width: 100px;
            height: 100px;
            background: ${branding.colors.accent};
            top: 10%;
            left: 10%;
            animation-delay: 0s;
          }

          .particle-2 {
            width: 150px;
            height: 150px;
            background: ${branding.colors.gradientTo};
            top: 60%;
            right: 10%;
            animation-delay: 2s;
          }

          .particle-3 {
            width: 80px;
            height: 80px;
            background: ${branding.colors.accent};
            bottom: 20%;
            left: 20%;
            animation-delay: 4s;
          }

          .particle-4 {
            width: 120px;
            height: 120px;
            background: ${branding.colors.gradientTo};
            top: 30%;
            right: 30%;
            animation-delay: 1s;
          }

          .particle-5 {
            width: 90px;
            height: 90px;
            background: ${branding.colors.accent};
            bottom: 40%;
            right: 20%;
            animation-delay: 3s;
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }

          .shimmer {
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.1),
              transparent
            );
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background: branding.colors.background }} className="min-h-screen flex items-center justify-center p-4">
        <div
          className="max-w-md w-full rounded-2xl p-8 border"
          style={{
            backgroundColor: branding.colors.surface,
            borderColor: branding.colors.error,
            boxShadow: `0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px ${branding.colors.error}33`
          }}
        >
          {/* Error icon with glow */}
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center border-2"
              style={{
                backgroundColor: branding.colors.primary,
                borderColor: branding.colors.error,
                boxShadow: `0 0 20px ${branding.colors.error}66`
              }}
            >
              <span className="text-4xl" style={{ color: branding.colors.error }}>⚠️</span>
            </div>
          </div>

          <h2
            className="text-2xl font-bold mb-3 text-center"
            style={{
              color: branding.colors.textHeading,
              fontFamily: branding.fonts.heading
            }}
          >
            Error
          </h2>

          <p
            className="mb-6 text-center"
            style={{ color: branding.colors.text }}
          >
            {error}
          </p>

          <button
            onClick={() => router.push(`/workflow/${params.id}`)}
            className="w-full px-6 py-3 rounded-lg font-medium transition-all duration-200"
            style={{
              background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
              color: branding.colors.background,
              border: `1px solid ${branding.colors.accent}`,
              boxShadow: `0 0 20px ${branding.colors.accentGlow}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 0 30px ${branding.colors.accentGlow}`
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = `0 0 20px ${branding.colors.accentGlow}`
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Back to Workflow
          </button>
        </div>
      </div>
    )
  }

  if (exportInfo) {
    return (
      <div style={{ background: branding.colors.background }} className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="floating-orb orb-1"></div>
          <div className="floating-orb orb-2"></div>
          <div className="floating-orb orb-3"></div>
        </div>

        <div
          className="max-w-lg w-full rounded-2xl p-8 relative z-10 backdrop-blur-sm border"
          style={{
            backgroundColor: `${branding.colors.surface}EE`,
            borderColor: branding.colors.divider,
            boxShadow: `0 20px 50px rgba(0, 0, 0, 0.5), 0 0 50px ${branding.colors.accentGlow}`
          }}
        >
          {/* Animated hourglass icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-full blur-2xl animate-pulse"
                style={{
                  background: branding.colors.accentGlow,
                  transform: 'scale(1.5)'
                }}
              ></div>

              {/* Icon container */}
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center border-2"
                style={{
                  backgroundColor: branding.colors.primary,
                  borderColor: branding.colors.accent,
                  boxShadow: `0 0 30px ${branding.colors.accentGlow}`
                }}
              >
                <span className="text-5xl animate-pulse" style={{ color: branding.colors.accent }}>⏳</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2
            className="text-3xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r"
            style={{
              backgroundImage: `linear-gradient(135deg, ${branding.colors.textHeading} 0%, ${branding.colors.accent} 100%)`,
              fontFamily: branding.fonts.heading
            }}
          >
            Export Processing
          </h2>

          {/* Message with info styling */}
          <div
            className="mb-6 p-4 rounded-lg border"
            style={{
              backgroundColor: branding.colors.primary,
              borderColor: branding.colors.info,
              color: branding.colors.text
            }}
          >
            <p className="text-sm leading-relaxed">{exportInfo}</p>
          </div>

          {/* Animated progress indicator */}
          <div className="mb-8">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: branding.colors.primary }}
            >
              <div
                className="h-2 rounded-full pulse-bar"
                style={{
                  background: `linear-gradient(90deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                  boxShadow: `0 0 10px ${branding.colors.accentGlow}`
                }}
              ></div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setExportInfo(null)}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: branding.colors.secondary,
                color: branding.colors.text,
                border: `1px solid ${branding.colors.divider}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = branding.colors.secondaryLight
                e.currentTarget.style.borderColor = branding.colors.accent
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = branding.colors.secondary
                e.currentTarget.style.borderColor = branding.colors.divider
              }}
            >
              Close
            </button>
            <button
              onClick={async () => {
                setExportInfo(null)
                await handleExport()
              }}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 glow-button"
              style={{
                background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                color: branding.colors.background,
                border: `1px solid ${branding.colors.accent}`,
                boxShadow: `0 0 20px ${branding.colors.accentGlow}`
              }}
            >
              Check Status
            </button>
          </div>

          {/* Helper text */}
          <p
            className="text-xs text-center mt-4"
            style={{ color: branding.colors.textMuted }}
          >
            Tip: Come back in 7 minutes for your completed export
          </p>
        </div>

        <style jsx>{`
          @keyframes float-orb {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -30px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }

          .floating-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(60px);
            animation: float-orb 15s ease-in-out infinite;
          }

          .orb-1 {
            width: 200px;
            height: 200px;
            background: ${branding.colors.accent};
            top: 10%;
            left: 10%;
            animation-delay: 0s;
          }

          .orb-2 {
            width: 250px;
            height: 250px;
            background: ${branding.colors.gradientTo};
            bottom: 10%;
            right: 10%;
            animation-delay: 5s;
          }

          .orb-3 {
            width: 180px;
            height: 180px;
            background: ${branding.colors.accent};
            top: 50%;
            left: 50%;
            animation-delay: 10s;
          }

          @keyframes pulse-bar {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
          }

          .pulse-bar {
            animation: pulse-bar 2s ease-in-out infinite;
          }

          .glow-button:hover {
            box-shadow: 0 0 30px ${branding.colors.accentGlow} !important;
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📋 Your SaaS Building Plan
          </h1>
          <p className="text-lg text-gray-600">
            Review and edit your plan before generating the final documentation
          </p>
        </div>

        {/* Plan Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {!isEditing ? (
            <>
              {/* Plan Display with Beautiful Markdown Rendering */}
              <div className="p-8 sm:p-10 lg:p-12">
                <article className="prose prose-lg prose-slate max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:pb-3 prose-h1:border-b-4 prose-h1:border-blue-600 prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b-2 prose-h2:border-blue-400 prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6 prose-h3:text-gray-800 prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-4 prose-h4:text-gray-700 prose-p:leading-relaxed prose-p:text-gray-700 prose-p:mb-4 prose-strong:text-gray-900 prose-strong:font-semibold prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:shadow-lg prose-pre:rounded-lg prose-pre:border prose-pre:border-gray-700 prose-ul:my-4 prose-ol:my-4 prose-li:my-1 prose-li:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r prose-hr:border-gray-300 prose-hr:my-8 prose-table:border-collapse prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="scroll-mt-20" {...props} />,
                      h2: ({node, ...props}) => <h2 className="scroll-mt-20" {...props} />,
                      h3: ({node, ...props}) => <h3 className="scroll-mt-20" {...props} />,
                      code: ({node, inline, className, children, ...props}: any) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline ? (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {plan}
                  </ReactMarkdown>
                </article>
              </div>

              {/* Edit Button */}
              <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200"
                >
                  ✏️ Edit Plan
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edit your building plan (Markdown supported)
                  </label>
                  <textarea
                    value={editedPlan}
                    onChange={(e) => setEditedPlan(e.target.value)}
                    className="w-full h-[600px] p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-y transition-colors"
                    placeholder="Edit your plan using Markdown formatting..."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Tip: Use Markdown syntax for formatting (# headers, **bold**, `code`, etc.)
                  </p>
                </div>

                {/* Edit Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={savePlanEdits}
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:-translate-y-0.5 duration-200"
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      '💾 Save Changes'
                    )}
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <>
            {planStatus !== 'approved' ? (
              <div className="flex gap-4">
                <button
                  onClick={() => router.push(`/workflow/${params.id}`)}
                  className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  ← Back to Workflow
                </button>
                <button
                  onClick={generatePlan}
                  disabled={isGenerating}
                  className="flex-1 px-8 py-4 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Regenerating...' : '🔄 Regenerate Plan'}
                </button>
                <button
                  onClick={approvePlan}
                  disabled={isApproving}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApproving ? 'Approving...' : '✅ Approve Plan'}
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  ← Back to Dashboard
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Export...
                    </span>
                  ) : (
                    '📦 Export Files'
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 What happens next?</h3>
          {planStatus !== 'approved' ? (
            <ul className="text-blue-800 space-y-2 text-sm">
              <li>• <strong>Edit:</strong> Modify the plan to match your exact requirements</li>
              <li>• <strong>Regenerate:</strong> Generate a fresh plan if you want a different approach</li>
              <li>• <strong>Approve:</strong> Lock in this plan so you can export the documentation files</li>
            </ul>
          ) : (
            <ul className="text-blue-800 space-y-2 text-sm">
              <li>✅ <strong>Plan Approved!</strong> Your plan is ready for export</li>
              <li>• <strong>Export Files:</strong> Click the Export button to generate README, Claude instructions, and prompt files</li>
              <li>• <strong>Download:</strong> Files will be packaged as a ZIP and downloaded automatically</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
