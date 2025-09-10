'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Circle, Lock } from 'lucide-react'

interface PhaseProgressProps {
  currentPhase: number
  completedPhases: number
  totalPhases: number
}

export default function PhaseProgress({ currentPhase, completedPhases, totalPhases }: PhaseProgressProps) {
  const progressPercentage = (completedPhases / totalPhases) * 100

  return (
    <div className="bg-white border-b border-blueprint-navy-100 py-4">
      <div className="container mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blueprint-navy-700">
              Phase {currentPhase} of {totalPhases}
            </span>
            <span className="text-sm text-blueprint-navy-600">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <div className="phase-progress">
            <motion.div
              className="phase-progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Phase Dots */}
        <div className="flex justify-between items-center">
          {Array.from({ length: totalPhases }, (_, i) => i + 1).map((phase) => {
            const isCompleted = phase <= completedPhases
            const isCurrent = phase === currentPhase
            const isLocked = phase > completedPhases + 1

            return (
              <div
                key={phase}
                className="flex flex-col items-center"
              >
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: isCurrent ? 1.2 : 1 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                    ${isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-blueprint-cyan-600 text-white ring-4 ring-blueprint-cyan-200' 
                        : isLocked
                          ? 'bg-gray-200 text-gray-400'
                          : 'bg-blueprint-navy-100 text-blueprint-navy-600'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    phase
                  )}
                </motion.div>
                
                {/* Phase line connector */}
                {phase < totalPhases && (
                  <div
                    className={`
                      absolute w-full h-0.5 top-4 left-1/2 -z-10
                      ${phase <= completedPhases 
                        ? 'bg-green-500' 
                        : 'bg-blueprint-navy-200'
                      }
                    `}
                    style={{
                      width: `calc(100% / ${totalPhases - 1})`,
                      transform: 'translateX(50%)',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Phase Labels (show only on larger screens) */}
        <div className="hidden md:flex justify-between mt-2">
          {Array.from({ length: totalPhases }, (_, i) => i + 1).map((phase) => (
            <div
              key={`label-${phase}`}
              className="text-xs text-blueprint-navy-500 text-center"
              style={{ width: `${100 / totalPhases}%` }}
            >
              P{phase}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}