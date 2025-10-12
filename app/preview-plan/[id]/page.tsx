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
      setIsGenerating(true)
      setError(null)

      const response = await fetch(`/api/generate-plan/${params.id}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate plan')
      }

      const data = await response.json()
      setPlan(data.plan)
      setEditedPlan(data.plan)
      setPlanId(data.planId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan')
    } finally {
      setIsGenerating(false)
      setIsLoading(false)
    }
  }

  async function savePlanEdits() {
    if (!planId) return

    try {
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

      if (updateError) throw updateError

      setPlan(editedPlan)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save edits')
    } finally {
      setIsSaving(false)
    }
  }

  async function approvePlan() {
    if (!planId) return

    try {
      setIsApproving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('plans')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', planId)

      if (updateError) throw updateError

      // Redirect to export page
      router.push(`/export/${params.id}`)
    } catch (err) {
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
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {!isEditing ? (
            <>
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {plan}
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
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
