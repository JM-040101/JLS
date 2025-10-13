'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github-dark.css'

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
  const [error, setError] = useState<string | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)

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
    generatePlan()
  }

  async function generatePlan() {
    try {
      console.log('[PREVIEW-PLAN] Starting plan generation for session:', params.id)
      setIsGenerating(true)
      setError(null)

      console.log('[PREVIEW-PLAN] Calling API:', `/api/generate-plan/${params.id}`)
      const response = await fetch(`/api/generate-plan/${params.id}`, {
        method: 'POST',
      })

      console.log('[PREVIEW-PLAN] API response status:', response.status)
      console.log('[PREVIEW-PLAN] API response content-type:', response.headers.get('content-type'))

      if (!response.ok) {
        // Handle both JSON and plain text error responses
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          console.error('[PREVIEW-PLAN] API JSON error response:', data)
          throw new Error(data.error || 'Failed to generate plan')
        } else {
          // Plain text error (likely from Vercel timeout or edge runtime)
          const text = await response.text()
          console.error('[PREVIEW-PLAN] API text error response:', text)
          throw new Error(`API Error: ${text.substring(0, 200)}`)
        }
      }

      // Parse successful response - also handle plain text fallback
      const contentType = response.headers.get('content-type')
      let data

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // Fallback for unexpected plain text response
        const text = await response.text()
        console.error('[PREVIEW-PLAN] Unexpected plain text response:', text.substring(0, 200))
        throw new Error('Received invalid response format from server. This may indicate a timeout.')
      }
      console.log('[PREVIEW-PLAN] Plan received:', {
        planLength: data.plan?.length || 0,
        status: data.status,
        planId: data.planId
      })

      setPlan(data.plan)
      setEditedPlan(data.plan)
      setPlanId(data.planId)
      console.log('[PREVIEW-PLAN] Plan state updated successfully')
    } catch (err) {
      console.error('[PREVIEW-PLAN] Error generating plan:', err)

      // Provide user-friendly error messages with context
      let errorMessage = 'Failed to generate plan'

      if (err instanceof Error) {
        if (err.message.includes('timeout') || err.message.includes('invalid response format')) {
          errorMessage = '⏱️ Generation took too long. This can happen with complex plans. Please try again - it usually works on the second attempt.'
        } else if (err.message.includes('API Error:')) {
          errorMessage = `${err.message}\n\n💡 This may be a temporary server issue. Please try regenerating the plan.`
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
    } finally {
      setIsGenerating(false)
      setIsLoading(false)
      console.log('[PREVIEW-PLAN] Generation complete')
    }
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

      console.log('[PREVIEW-PLAN] Plan approved, redirecting to export...')
      // Redirect to export page
      router.push(`/export/${params.id}`)
    } catch (err) {
      console.error('[PREVIEW-PLAN] Failed to approve plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to approve plan')
    } finally {
      setIsApproving(false)
    }
  }

  function cancelEditing() {
    setEditedPlan(plan)
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          {/* Simple spinner */}
          <div className="mb-6 relative inline-block">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Generating Your Building Plan
          </h2>

          {/* Status Messages */}
          <div className="space-y-2 mb-6 text-gray-600">
            <p>🧠 GPT-4 is analyzing your answers...</p>
            <p className="text-sm">✨ Synthesizing with knowledge base patterns</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-progress"></div>
          </div>
          <p className="text-sm text-gray-500">This usually takes 10-20 seconds...</p>
        </div>

        <style jsx>{`
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 95%; }
          }
          .animate-progress {
            animation: progress 15s ease-out forwards;
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/workflow/${params.id}`)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Workflow
          </button>
        </div>
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
              {isApproving ? 'Approving...' : '✅ Approve & Generate Files'}
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 What happens next?</h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• <strong>Edit:</strong> Modify the plan to match your exact requirements</li>
            <li>• <strong>Regenerate:</strong> Generate a fresh plan if you want a different approach</li>
            <li>• <strong>Approve:</strong> Lock in this plan and have Claude generate your documentation files</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
