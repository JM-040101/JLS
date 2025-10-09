'use client'

import { PhaseTemplate } from '@/types/database'
import { CheckCircle, Circle, Lock, Clock, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface PhaseSidebarProps {
  phaseTemplates: PhaseTemplate[]
  currentPhase: number
  completedPhases: number
  onPhaseSelect: (phase: number) => void
}

export default function PhaseSidebar({
  phaseTemplates,
  currentPhase,
  completedPhases,
  onPhaseSelect,
}: PhaseSidebarProps) {
  const getPhaseStatus = (phaseNumber: number) => {
    if (phaseNumber <= completedPhases) return 'completed'
    if (phaseNumber === currentPhase) return 'current'
    if (phaseNumber === completedPhases + 1) return 'available'
    return 'locked'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'current':
        return <Circle className="w-5 h-5 text-blueprint-cyan-600" />
      case 'available':
        return <Circle className="w-5 h-5 text-blueprint-navy-400" />
      default:
        return <Lock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 hover:bg-green-100 cursor-pointer hover:shadow-md'
      case 'current':
        return 'bg-blueprint-cyan-50 border-blueprint-cyan-300 ring-2 ring-blueprint-cyan-200 cursor-pointer'
      case 'available':
        return 'bg-white border-blueprint-navy-200 hover:bg-blueprint-navy-50 cursor-pointer'
      default:
        return 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sticky top-24">
      <h2 className="text-lg font-semibold text-blueprint-navy-900 mb-4">
        Blueprint Phases
      </h2>
      
      <div className="space-y-2">
        {phaseTemplates.map((template) => {
          const status = getPhaseStatus(template.phase_number)
          const isClickable = status !== 'locked'

          return (
            <motion.div
              key={template.phase_number}
              whileHover={isClickable ? { scale: 1.02 } : {}}
              whileTap={isClickable ? { scale: 0.98 } : {}}
            >
              <button
                onClick={() => isClickable && onPhaseSelect(template.phase_number)}
                disabled={!isClickable}
                className={`
                  w-full text-left p-3 rounded-lg border transition-all
                  ${getStatusStyles(status)}
                `}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {getStatusIcon(status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-blueprint-navy-900">
                        Phase {template.phase_number}
                      </h3>
                      {status === 'current' && (
                        <ChevronRight className="w-4 h-4 text-blueprint-cyan-600" />
                      )}
                    </div>
                    <p className="text-xs text-blueprint-navy-600 mt-0.5 line-clamp-2">
                      {template.title}
                    </p>
                    <div className="flex items-center mt-1">
                      <Clock className="w-3 h-3 text-blueprint-navy-400 mr-1" />
                      <span className="text-xs text-blueprint-navy-500">
                        {template.estimated_time} min
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Total Time Estimate */}
      <div className="mt-4 pt-4 border-t border-blueprint-navy-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blueprint-navy-600">Total time</span>
          <span className="font-medium text-blueprint-navy-900">
            ~{Math.round(phaseTemplates.reduce((sum, t) => sum + t.estimated_time, 0) / 60)}h
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-blueprint-navy-600">Progress</span>
          <span className="font-medium text-green-600">
            {completedPhases}/12 phases
          </span>
        </div>
      </div>
    </div>
  )
}