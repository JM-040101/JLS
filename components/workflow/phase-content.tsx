'use client'

import { PhaseTemplate, Answer } from '@/types/database'
import QuestionForm from './question-form'
import { HelpCircle, ArrowRight, Trophy } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface PhaseContentProps {
  phaseTemplate: PhaseTemplate
  answers: Record<string, Answer>
  onAnswerChange: (
    phaseNumber: number,
    questionId: string,
    questionText: string,
    answerText: string,
    answerType: string
  ) => void
  onPhaseComplete: () => void
  canProceed: boolean
  isLastPhase: boolean
  isViewOnly?: boolean
}

export default function PhaseContent({
  phaseTemplate,
  answers,
  onAnswerChange,
  onPhaseComplete,
  canProceed,
  isLastPhase,
  isViewOnly = false,
}: PhaseContentProps) {
  const [showHelp, setShowHelp] = useState(false)
  const questions = phaseTemplate.questions as any[]

  // Check if all required questions are answered
  const allRequiredAnswered = questions
    .filter(q => q.required)
    .every(q => {
      const answer = answers[`${phaseTemplate.phase_number}-${q.id}`]
      return answer && answer.answer_text && answer.answer_text.trim().length > 0
    })

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Phase Header */}
      <div className="border-b border-blueprint-navy-100 px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-blueprint-navy-900 mb-3">
              Phase {phaseTemplate.phase_number}: {phaseTemplate.title}
            </h2>
            <p className="text-blueprint-navy-600 text-base leading-relaxed">
              {phaseTemplate.description}
            </p>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="btn-ghost p-2 flex-shrink-0 transition-all hover:scale-110"
            title="Show help"
          >
            <HelpCircle className="w-5 h-5 text-blueprint-cyan-600 transition-transform" />
          </button>
        </div>

        {/* Help Text */}
        {showHelp && phaseTemplate.help_text && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-5 bg-blueprint-cyan-50 rounded-lg border border-blueprint-cyan-200"
          >
            <p className="text-sm text-blueprint-navy-700 leading-relaxed">
              <strong className="font-semibold">💡 Tip:</strong> {phaseTemplate.help_text}
            </p>
          </motion.div>
        )}
      </div>

      {/* Questions */}
      <div className="px-6 py-8 space-y-8">
        {questions.map((question, index) => {
          const answer = answers[`${phaseTemplate.phase_number}-${question.id}`]

          // Map question format to QuestionForm format
          const formQuestion = {
            id: question.id,
            type: question.type,
            label: question.text, // Map 'text' to 'label'
            tooltip: question.help_text, // Map 'help_text' to 'tooltip'
            required: question.required,
            options: question.options,
            placeholder: question.placeholder,
            validation: question.validation
          }

          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <QuestionForm
                question={formQuestion}
                value={answer?.answer_text || ''}
                onChange={(value) =>
                  onAnswerChange(
                    phaseTemplate.phase_number,
                    question.id,
                    question.text, // Use 'text' instead of 'label'
                    value,
                    question.type
                  )
                }
                disabled={!canProceed || isViewOnly}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Phase Actions */}
      <div className="border-t border-blueprint-navy-100 px-6 py-6 bg-blueprint-navy-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {phaseTemplate.phase_number > 1 && (
              <button
                onClick={() => {
                  const prevPhase = phaseTemplate.phase_number - 1
                  // Trigger phase change through parent component
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent('changePhase', { detail: prevPhase })
                    window.dispatchEvent(event)
                  }
                }}
                className="btn-ghost flex items-center text-blueprint-navy-600 hover:text-blueprint-navy-900 transition-all hover:-translate-x-1"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180 transition-transform group-hover:-translate-x-1" />
                Previous Phase
              </button>
            )}
            <div className="text-sm">
              {isViewOnly ? (
                <span className="text-blue-600 font-medium flex items-center gap-2">
                  📖 Viewing completed blueprint
                </span>
              ) : allRequiredAnswered ? (
                <span className="text-green-600 font-medium flex items-center gap-2">
                  ✓ All required questions answered
                </span>
              ) : (
                <span className="text-blueprint-navy-600">
                  Answer all required questions to proceed
                </span>
              )}
            </div>
          </div>

          {!isViewOnly && (
            <button
              onClick={onPhaseComplete}
              disabled={!allRequiredAnswered || !canProceed}
              className={`
                btn-primary flex items-center transition-all
                ${!allRequiredAnswered || !canProceed ? 'opacity-50 cursor-not-allowed' : 'hover:translate-x-1'}
              `}
            >
              {isLastPhase ? (
                <>
                  <Trophy className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                  Complete Blueprint
                </>
              ) : (
                <>
                  Next Phase
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          )}

          {isViewOnly && phaseTemplate.phase_number < 12 && (
            <button
              onClick={() => {
                const nextPhase = phaseTemplate.phase_number + 1
                if (typeof window !== 'undefined') {
                  const event = new CustomEvent('changePhase', { detail: nextPhase })
                  window.dispatchEvent(event)
                }
              }}
              className="btn-secondary flex items-center"
            >
              Next Phase
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}