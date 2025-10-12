'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
    generatePlan()
  }, [params.id])

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

      if (!response.ok) {
        const data = await response.json()
        console.error('[PREVIEW-PLAN] API error response:', data)
        throw new Error(data.error || 'Failed to generate plan')
      }

      const data = await response.json()
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
      setError(err instanceof Error ? err.message : 'Failed to generate plan')
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

  // Format plan content for beautiful display
  function formatPlanForDisplay(content: string): string {
    if (!content) return ''

    let formatted = content

    // Convert markdown-style headers to HTML with styling
    formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="text-4xl font-bold text-gray-900 mb-6 mt-8 pb-3 border-b-4 border-blue-600">$1</h1>')
    formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="text-3xl font-bold text-gray-800 mb-4 mt-8 pb-2 border-b-2 border-blue-400">$1</h2>')
    formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="text-2xl font-semibold text-gray-700 mb-3 mt-6">$1</h3>')
    formatted = formatted.replace(/^#### (.+)$/gm, '<h4 class="text-xl font-semibold text-gray-600 mb-2 mt-4">$4</h4>')

    // Convert bold text
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')

    // Convert lists with better styling
    formatted = formatted.replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 text-gray-700">$1</li>')
    formatted = formatted.replace(/^\* (.+)$/gm, '<li class="ml-6 mb-2 text-gray-700">$1</li>')
    formatted = formatted.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-6 mb-2 text-gray-700"><span class="font-semibold text-blue-600">$1.</span> $2</li>')

    // Wrap consecutive list items in ul/ol tags
    formatted = formatted.replace(/(<li class="ml-6 mb-2 text-gray-700">(?:(?!<li).)*<\/li>\s*)+/g, match => {
      if (match.includes('<span class="font-semibold')) {
        return `<ol class="list-decimal mb-4">${match}</ol>`
      }
      return `<ul class="list-disc mb-4">${match}</ul>`
    })

    // Convert code blocks
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-4 font-mono text-sm"><code>$2</code></pre>')

    // Convert inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-red-600 px-2 py-1 rounded font-mono text-sm">$1</code>')

    // Convert horizontal rules
    formatted = formatted.replace(/^---$/gm, '<hr class="my-8 border-t-2 border-gray-300" />')

    // Convert paragraphs (double line breaks)
    formatted = formatted.split('\n\n').map(para => {
      if (para.trim() &&
          !para.startsWith('<h') &&
          !para.startsWith('<li') &&
          !para.startsWith('<ul') &&
          !para.startsWith('<ol') &&
          !para.startsWith('<pre') &&
          !para.startsWith('<hr')) {
        return `<p class="mb-4 text-gray-700 leading-relaxed">${para}</p>`
      }
      return para
    }).join('\n')

    return formatted
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Your Building Plan</h2>
          <p className="text-gray-600">GPT-4 is analyzing your answers...</p>
        </div>
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
              {/* Plan Display with Enhanced Formatting */}
              <div className="p-8">
                <div className="prose prose-lg max-w-none">
                  <div
                    className="plan-content text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: formatPlanForDisplay(plan)
                    }}
                  />
                </div>
              </div>

              {/* Edit Button */}
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-medium shadow-md"
                >
                  ✏️ Edit Plan
                </button>
              </div>
            </>
          ) : (
            <>
              <textarea
                value={editedPlan}
                onChange={(e) => setEditedPlan(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Edit your plan..."
              />

              {/* Edit Actions */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={savePlanEdits}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
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
