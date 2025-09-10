'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createSupabaseClient } from '@/lib/supabase'
import { Rocket, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const formSchema = z.object({
  app_description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  app_name: z.string()
    .min(2, 'App name must be at least 2 characters')
    .max(50, 'App name must be less than 50 characters')
    .optional(),
  target_audience: z.string()
    .min(10, 'Target audience must be at least 10 characters')
    .max(200, 'Target audience must be less than 200 characters')
    .optional(),
})

type FormData = z.infer<typeof formSchema>

export default function NewWorkflowForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const descriptionLength = watch('app_description')?.length || 0

  const onSubmit = async (data: FormData) => {
    setLoading(true)

    try {
      // Create new session
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          app_description: data.app_description,
          app_name: data.app_name || null,
          target_audience: data.target_audience || null,
          status: 'in_progress',
          completed_phases: 0,
          current_phase: 1,
        })
        .select()
        .single()

      if (error) {
        if (error.message.includes('subscription')) {
          toast.error('Active subscription required')
          router.push('/pricing')
        } else if (error.message.includes('concurrent')) {
          toast.error('Maximum session limit reached')
          router.push('/dashboard')
        } else {
          toast.error('Failed to create workflow')
        }
        return
      }

      if (session) {
        toast.success('Blueprint created successfully!')
        router.push(`/workflow/${session.id}`)
      }
    } catch (err) {
      console.error('Error creating workflow:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <label htmlFor="app_description" className="block text-sm font-medium text-blueprint-navy-700 mb-2">
            Describe Your SaaS Idea *
          </label>
          <textarea
            id="app_description"
            {...register('app_description')}
            rows={4}
            className={`input ${errors.app_description ? 'border-red-500' : ''}`}
            placeholder="I want to build a SaaS that helps small businesses manage their inventory by..."
            disabled={loading}
          />
          <div className="mt-1 flex justify-between items-start">
            <div>
              {errors.app_description && (
                <p className="text-sm text-red-600">{errors.app_description.message}</p>
              )}
            </div>
            <span className={`text-xs ${descriptionLength > 400 ? 'text-yellow-600' : 'text-blueprint-navy-500'}`}>
              {descriptionLength}/500
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="app_name" className="block text-sm font-medium text-blueprint-navy-700 mb-2">
            App Name (Optional)
          </label>
          <input
            id="app_name"
            type="text"
            {...register('app_name')}
            className={`input ${errors.app_name ? 'border-red-500' : ''}`}
            placeholder="e.g., InventoryPro"
            disabled={loading}
          />
          {errors.app_name && (
            <p className="mt-1 text-sm text-red-600">{errors.app_name.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="target_audience" className="block text-sm font-medium text-blueprint-navy-700 mb-2">
            Target Audience (Optional)
          </label>
          <input
            id="target_audience"
            type="text"
            {...register('target_audience')}
            className={`input ${errors.target_audience ? 'border-red-500' : ''}`}
            placeholder="e.g., Small retail businesses with 10-50 employees"
            disabled={loading}
          />
          {errors.target_audience && (
            <p className="mt-1 text-sm text-red-600">{errors.target_audience.message}</p>
          )}
        </div>

        <div className="bg-blueprint-navy-50 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blueprint-cyan-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blueprint-navy-700">
              <p className="font-semibold mb-1">What happens next?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You'll be guided through 12 comprehensive phases</li>
                <li>Each phase takes 15-30 minutes to complete</li>
                <li>Your progress is automatically saved</li>
                <li>You can pause and resume anytime</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Start Blueprint Journey
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}