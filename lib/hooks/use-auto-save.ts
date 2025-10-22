import { useEffect, useRef, useCallback } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface UseAutoSaveOptions {
  sessionId: string
  data: any
  delay?: number
  onSave?: () => void
  onError?: (error: Error) => void
}

export function useAutoSave({
  sessionId,
  data,
  delay = 2000,
  onSave,
  onError,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedDataRef = useRef<string>()
  const supabase = createSupabaseServerClient()

  const save = useCallback(async () => {
    const dataString = JSON.stringify(data)
    
    // Skip if data hasn't changed
    if (dataString === lastSavedDataRef.current) {
      return
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          metadata: { lastAutoSave: new Date().toISOString(), ...data },
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      if (error) throw error

      lastSavedDataRef.current = dataString
      onSave?.()
    } catch (error) {
      console.error('Auto-save failed:', error)
      onError?.(error as Error)
      toast.error('Failed to auto-save. Your changes may not be preserved.')
    }
  }, [sessionId, data, supabase, onSave, onError])

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(save, delay)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay, save])

  // Save immediately on unmount
  useEffect(() => {
    return () => {
      save()
    }
  }, [save])

  return { save }
}