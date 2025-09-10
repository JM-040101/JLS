'use client'

import { useState } from 'react'
import { PhaseTemplate } from '@/types/database'
import { Menu, X, CheckCircle, Circle, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MobilePhaseMenuProps {
  phaseTemplates: PhaseTemplate[]
  currentPhase: number
  completedPhases: number
  onPhaseSelect: (phase: number) => void
}

export default function MobilePhaseMenu({
  phaseTemplates,
  currentPhase,
  completedPhases,
  onPhaseSelect,
}: MobilePhaseMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getPhaseStatus = (phaseNumber: number) => {
    if (phaseNumber <= completedPhases) return 'completed'
    if (phaseNumber === currentPhase) return 'current'
    if (phaseNumber === completedPhases + 1) return 'available'
    return 'locked'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'current':
        return <Circle className="w-4 h-4 text-blueprint-cyan-600" />
      case 'available':
        return <Circle className="w-4 h-4 text-blueprint-navy-400" />
      default:
        return <Lock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 bg-blueprint-cyan-600 text-white p-4 rounded-full shadow-lg hover:bg-blueprint-cyan-700 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-blueprint-navy-900">
                    Blueprint Phases
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-blueprint-navy-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-blueprint-navy-600" />
                  </button>
                </div>

                <div className="space-y-2">
                  {phaseTemplates.map((template) => {
                    const status = getPhaseStatus(template.phase_number)
                    const isClickable = status !== 'locked'

                    return (
                      <button
                        key={template.phase_number}
                        onClick={() => {
                          if (isClickable) {
                            onPhaseSelect(template.phase_number)
                            setIsOpen(false)
                          }
                        }}
                        disabled={!isClickable}
                        className={`
                          w-full text-left p-3 rounded-lg border transition-all
                          ${status === 'completed' ? 'bg-green-50 border-green-200' : ''}
                          ${status === 'current' ? 'bg-blueprint-cyan-50 border-blueprint-cyan-300 ring-2 ring-blueprint-cyan-200' : ''}
                          ${status === 'available' ? 'bg-white border-blueprint-navy-200 hover:bg-blueprint-navy-50' : ''}
                          ${status === 'locked' ? 'bg-gray-50 border-gray-200 opacity-60' : ''}
                          ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                        `}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5">
                            {getStatusIcon(status)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-blueprint-navy-900">
                              Phase {template.phase_number}
                            </h3>
                            <p className="text-xs text-blueprint-navy-600 mt-0.5">
                              {template.title}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Progress Summary */}
                <div className="mt-4 pt-4 border-t border-blueprint-navy-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blueprint-navy-900">
                      {completedPhases}/12
                    </div>
                    <div className="text-sm text-blueprint-navy-600">
                      Phases Completed
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}