'use client'

import { X, Save, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

interface WorkflowHeaderProps {
  sessionName: string
  isSaving: boolean
  onExit: () => void
}

export default function WorkflowHeader({ sessionName, isSaving, onExit }: WorkflowHeaderProps) {
  const [timeSpent, setTimeSpent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1)
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
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
              {formatTime(timeSpent)}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isSaving && (
              <div className="flex items-center text-sm text-blueprint-cyan-600">
                <Save className="w-4 h-4 mr-1 animate-pulse" />
                Saving...
              </div>
            )}
            
            <button
              onClick={onExit}
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