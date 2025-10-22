'use client'

import { X, Save, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

interface WorkflowHeaderProps {
  sessionName: string
  isSaving: boolean
  onExit: () => void
}

export default function WorkflowHeader({ sessionName, isSaving, onExit }: WorkflowHeaderProps) {
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0)
  const [showSaved, setShowSaved] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)

  const handleExit = () => {
    const confirmed = window.confirm(
      'Are you sure you want to exit?\n\nYour progress is automatically saved, but you will leave this workflow session.'
    )
    if (confirmed) {
      onExit()
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpentSeconds(prev => prev + 1)
    }, 1000) // Update every second

    return () => clearInterval(timer)
  }, [])

  // Show "Saved ✓" indicator for 2 seconds after saving completes
  useEffect(() => {
    if (!isSaving && lastSavedTime) {
      setShowSaved(true)
      const timer = setTimeout(() => {
        setShowSaved(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isSaving, lastSavedTime])

  // Track when saving completes
  useEffect(() => {
    if (!isSaving) {
      setLastSavedTime(new Date())
    }
  }, [isSaving])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  return (
    <header className="bg-white border-b border-blueprint-navy-100 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-blueprint-navy-900 truncate max-w-md">
              {sessionName.substring(0, 50)}
            </h1>
            <div className="flex items-center text-sm text-blueprint-navy-600">
              <Clock className="w-4 h-4 mr-1" />
              {formatTime(timeSpentSeconds)}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isSaving ? (
              <div className="flex items-center text-sm text-blueprint-cyan-600">
                <Save className="w-4 h-4 mr-1 animate-pulse" />
                Saving...
              </div>
            ) : showSaved ? (
              <div className="flex items-center text-sm text-green-600 transition-opacity duration-300">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </div>
            ) : null}

            <button
              onClick={handleExit}
              className="btn-ghost flex items-center"
              title="Save and exit"
            >
              <X className="w-4 h-4 mr-1" />
              Exit
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}