'use client'

import { useState } from 'react'
import { PhaseTemplate, Answer } from '@/types/database'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CompletedPlanViewProps {
  phaseTemplates: PhaseTemplate[]
  answers: Answer[]
  sessionName: string
}

export default function CompletedPlanView({
  phaseTemplates,
  answers,
  sessionName,
}: CompletedPlanViewProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]))

  const togglePhase = (phaseNumber: number) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseNumber)) {
      newExpanded.delete(phaseNumber)
    } else {
      newExpanded.add(phaseNumber)
    }
    setExpandedPhases(newExpanded)
  }

  const expandAll = () => {
    setExpandedPhases(new Set(phaseTemplates.map(p => p.phase_number)))
  }

  const collapseAll = () => {
    setExpandedPhases(new Set())
  }

  return (
    <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-blueprint-navy-900">
            Complete Blueprint Plan
          </h2>
          <p className="text-sm text-blueprint-navy-600 mt-1">
            {sessionName}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs btn-ghost text-blueprint-navy-600 hover:text-blueprint-navy-900"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="text-xs btn-ghost text-blueprint-navy-600 hover:text-blueprint-navy-900"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {phaseTemplates.map((phase) => {
          const phaseAnswers = answers.filter(a => a.phase_number === phase.phase_number)
          const isExpanded = expandedPhases.has(phase.phase_number)

          return (
            <div
              key={phase.phase_number}
              className="border border-blueprint-navy-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => togglePhase(phase.phase_number)}
                className="w-full flex items-center justify-between p-4 hover:bg-blueprint-navy-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0 w-8 h-8 bg-blueprint-cyan-100 text-blueprint-cyan-700 rounded-full flex items-center justify-center text-sm font-semibold">
                    {phase.phase_number}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blueprint-navy-900">
                      {phase.title}
                    </h3>
                    <p className="text-sm text-blueprint-navy-600">
                      {phaseAnswers.length} {phaseAnswers.length === 1 ? 'answer' : 'answers'}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-blueprint-navy-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-blueprint-navy-400" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="border-t border-blueprint-navy-200 bg-blueprint-navy-50 p-4">
                      <div className="mb-4">
                        <p className="text-sm text-blueprint-navy-700 italic">
                          {phase.description}
                        </p>
                      </div>

                      {phaseAnswers.length === 0 ? (
                        <div className="text-center py-8 text-blueprint-navy-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No answers provided for this phase yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {phaseAnswers.map((answer, idx) => (
                            <div
                              key={answer.id}
                              className="bg-white rounded-lg p-4 border border-blueprint-navy-200"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-blueprint-navy-900 text-sm">
                                  {answer.question_text}
                                </h4>
                                {answer.answer_type === 'textarea' && (
                                  <span className="text-xs text-blueprint-navy-500 ml-2">
                                    Long answer
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-blueprint-navy-700 whitespace-pre-wrap">
                                {answer.answer_text}
                              </div>
                              <div className="mt-2 text-xs text-blueprint-navy-500">
                                Last updated: {new Date(answer.updated_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
