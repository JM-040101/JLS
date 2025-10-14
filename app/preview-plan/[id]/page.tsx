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
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportInfo, setExportInfo] = useState<string | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [planStatus, setPlanStatus] = useState<string>('generated')
  const [exportStartTime, setExportStartTime] = useState<number | null>(null)
  const [exportProgress, setExportProgress] = useState(0)

  useEffect(() => {
    checkAuthAndGenerate()
  }, [params.id])

  // Progress tracking effect - updates progress percentage based on elapsed time
  useEffect(() => {
    if (!exportStartTime || !exportInfo) return

    const interval = setInterval(() => {
      const elapsed = Date.now() - exportStartTime
      const minutes = elapsed / 1000 / 60

      // Estimate progress based on 5-7 minute expected duration
      // Use 6 minutes as the midpoint for calculation
      const estimatedProgress = Math.min(95, (minutes / 6) * 100)
      setExportProgress(estimatedProgress)
    }, 500) // Update every 500ms for smooth progress

    return () => clearInterval(interval)
  }, [exportStartTime, exportInfo])

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

        // Reset progress tracking on successful download
        setExportStartTime(null)
        setExportProgress(100)
      } else {
        // Got a status message (still processing)
        const data = await response.json()
        console.log('[PREVIEW-PLAN] Export status:', data)
        setExportInfo(data.message || 'Export is being generated. Please try again in a moment.')

        // Set start time if not already set
        if (!exportStartTime) {
          setExportStartTime(Date.now())
          setExportProgress(0)
        }
      }
    } catch (err) {
      console.error('[PREVIEW-PLAN] Export error:', err)
      setError(err instanceof Error ? err.message : 'Failed to export plan')
      setExportStartTime(null)
    } finally {
      setIsExporting(false)
    }
  }

  // Helper function to format elapsed time
  function formatElapsedTime(startTime: number | null): string {
    if (!startTime) return '0m 0s'
    const elapsed = Date.now() - startTime
    const minutes = Math.floor(elapsed / 1000 / 60)
    const seconds = Math.floor((elapsed / 1000) % 60)
    return `${minutes}m ${seconds}s`
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

          {/* Progress bar with percentage */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium" style={{ color: branding.colors.textMuted }}>
                Export Progress
              </span>
              <span className="text-lg font-bold" style={{ color: branding.colors.accent }}>
                {Math.round(exportProgress)}%
              </span>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden mb-3"
              style={{ backgroundColor: branding.colors.primary }}
            >
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${exportProgress}%`,
                  background: `linear-gradient(90deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                  boxShadow: `0 0 10px ${branding.colors.accentGlow}`
                }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs" style={{ color: branding.colors.textMuted }}>
              <span>Elapsed: {formatElapsedTime(exportStartTime)}</span>
              <span>Estimated: 5-7 minutes</span>
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
                setIsCheckingStatus(true)
                setExportInfo(null)
                await handleExport()
                setIsCheckingStatus(false)
              }}
              disabled={isCheckingStatus}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 glow-button"
              style={{
                background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                color: branding.colors.background,
                border: `1px solid ${branding.colors.accent}`,
                boxShadow: `0 0 20px ${branding.colors.accentGlow}`,
                opacity: isCheckingStatus ? 0.7 : 1,
                cursor: isCheckingStatus ? 'not-allowed' : 'pointer'
              }}
            >
              {isCheckingStatus ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    style={{ color: branding.colors.background }}
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Checking...
                </span>
              ) : (
                'Check Status'
              )}
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
    <div className="min-h-screen" style={{ background: branding.colors.background }}>
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{
            color: branding.colors.textHeading,
            fontFamily: branding.fonts.heading
          }}>
            📋 Your SaaS Building Plan
          </h1>
          <p className="text-lg" style={{ color: branding.colors.text }}>
            Review and edit your plan before generating the final documentation
          </p>
        </div>

        {/* Plan Content */}
        <div className="rounded-2xl overflow-hidden mb-8 border" style={{
          backgroundColor: branding.colors.surface,
          borderColor: branding.colors.divider,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
        }}>
          {!isEditing ? (
            <>
              {/* Plan Display with Beautiful Markdown Rendering */}
              <div className="p-8 sm:p-10 lg:p-12">
                <article className="prose prose-lg prose-invert max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:pb-3 prose-h1:border-b-4 prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:pb-2 prose-h2:border-b-2 prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6 prose-h4:text-xl prose-h4:mb-2 prose-h4:mt-4 prose-p:leading-relaxed prose-p:mb-4 prose-strong:font-semibold prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:shadow-lg prose-pre:rounded-lg prose-pre:border prose-ul:my-4 prose-ol:my-4 prose-li:my-1 prose-a:no-underline hover:prose-a:underline prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r prose-hr:my-8 prose-table:border-collapse prose-th:border prose-th:px-4 prose-th:py-2 prose-td:border prose-td:px-4 prose-td:py-2" style={{
                  '--tw-prose-body': branding.colors.text,
                  '--tw-prose-headings': branding.colors.textHeading,
                  '--tw-prose-bold': branding.colors.textHeading,
                  '--tw-prose-code': branding.colors.accent,
                  '--tw-prose-pre-bg': branding.colors.primary,
                  '--tw-prose-pre-code': branding.colors.text,
                  '--tw-prose-links': branding.colors.accent,
                  '--tw-prose-quotes': branding.colors.textMuted,
                  '--tw-prose-quote-borders': branding.colors.accent,
                  '--tw-prose-hr': branding.colors.divider,
                  '--tw-prose-th-borders': branding.colors.divider,
                  '--tw-prose-td-borders': branding.colors.divider,
                } as React.CSSProperties}>
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
              <div className="px-8 py-6 border-t" style={{
                backgroundColor: branding.colors.primary,
                borderColor: branding.colors.divider
              }}>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: branding.colors.secondary,
                    color: branding.colors.text,
                    border: `1px solid ${branding.colors.divider}`,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = branding.colors.secondaryLight
                    e.currentTarget.style.borderColor = branding.colors.accent
                    e.currentTarget.style.boxShadow = `0 10px 15px -3px rgba(0, 0, 0, 0.5)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = branding.colors.secondary
                    e.currentTarget.style.borderColor = branding.colors.divider
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                  }}
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
                  <label className="block text-sm font-medium mb-2" style={{ color: branding.colors.text }}>
                    Edit your building plan (Markdown supported)
                  </label>
                  <textarea
                    value={editedPlan}
                    onChange={(e) => setEditedPlan(e.target.value)}
                    className="w-full h-[600px] p-4 border-2 rounded-lg focus:ring-2 font-mono text-sm resize-y transition-all"
                    style={{
                      backgroundColor: branding.colors.background,
                      borderColor: branding.colors.divider,
                      color: branding.colors.text,
                      fontFamily: branding.fonts.mono
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = branding.colors.accent
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${branding.colors.accentGlow}`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = branding.colors.divider
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    placeholder="Edit your plan using Markdown formatting..."
                  />
                  <p className="mt-2 text-sm" style={{ color: branding.colors.textMuted }}>
                    Tip: Use Markdown syntax for formatting (# headers, **bold**, `code`, etc.)
                  </p>
                </div>

                {/* Edit Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={savePlanEdits}
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                      background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                      color: branding.colors.background,
                      border: `1px solid ${branding.colors.accent}`,
                      boxShadow: `0 0 20px ${branding.colors.accentGlow}`
                    }}
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: branding.colors.background }}>
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
                    className="px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: branding.colors.secondary,
                      color: branding.colors.text,
                      border: `1px solid ${branding.colors.divider}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = branding.colors.secondaryLight
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = branding.colors.secondary
                    }}
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
                  className="flex-1 px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5"
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
                  ← Back to Workflow
                </button>
                <button
                  onClick={generatePlan}
                  disabled={isGenerating}
                  className="flex-1 px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    backgroundColor: branding.colors.warning,
                    color: branding.colors.background,
                    border: `1px solid ${branding.colors.warningDark}`,
                    boxShadow: `0 0 15px ${branding.colors.warning}33`
                  }}
                >
                  {isGenerating ? 'Regenerating...' : '🔄 Regenerate Plan'}
                </button>
                <button
                  onClick={approvePlan}
                  disabled={isApproving}
                  className="flex-1 px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                    color: branding.colors.background,
                    border: `1px solid ${branding.colors.accent}`,
                    boxShadow: `0 0 20px ${branding.colors.accentGlow}`
                  }}
                >
                  {isApproving ? 'Approving...' : '✅ Approve Plan'}
                </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5"
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
                  ← Back to Dashboard
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{
                    background: `linear-gradient(135deg, ${branding.colors.success}, ${branding.colors.successLight})`,
                    color: branding.colors.background,
                    border: `1px solid ${branding.colors.successDark}`,
                    boxShadow: `0 0 20px ${branding.colors.success}66`
                  }}
                >
                  {isExporting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: branding.colors.background }}>
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
        <div className="mt-8 rounded-lg p-6 border" style={{
          backgroundColor: `${branding.colors.info}15`,
          borderColor: branding.colors.info
        }}>
          <h3 className="font-semibold mb-2" style={{
            color: branding.colors.textHeading,
            fontFamily: branding.fonts.heading
          }}>💡 What happens next?</h3>
          {planStatus !== 'approved' ? (
            <ul className="space-y-2 text-sm" style={{ color: branding.colors.text }}>
              <li>• <strong style={{ color: branding.colors.textHeading }}>Edit:</strong> Modify the plan to match your exact requirements</li>
              <li>• <strong style={{ color: branding.colors.textHeading }}>Regenerate:</strong> Generate a fresh plan if you want a different approach</li>
              <li>• <strong style={{ color: branding.colors.textHeading }}>Approve:</strong> Lock in this plan so you can export the documentation files</li>
            </ul>
          ) : (
            <ul className="space-y-2 text-sm" style={{ color: branding.colors.text }}>
              <li>✅ <strong style={{ color: branding.colors.success }}>Plan Approved!</strong> Your plan is ready for export</li>
              <li>• <strong style={{ color: branding.colors.textHeading }}>Export Files:</strong> Click the Export button to generate README, Claude instructions, and prompt files</li>
              <li>• <strong style={{ color: branding.colors.textHeading }}>Download:</strong> Files will be packaged as a ZIP and downloaded automatically</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
