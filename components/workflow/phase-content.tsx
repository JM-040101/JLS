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
}

export default function PhaseContent({
  phaseTemplate,
  answers,
  onAnswerChange,
  onPhaseComplete,
  canProceed,
  isLastPhase,
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
      <div className="border-b border-blueprint-navy-100 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blueprint-navy-900 mb-2">
              Phase {phaseTemplate.phase_number}: {phaseTemplate.title}
            </h2>
            <p className="text-blueprint-navy-600">
              {phaseTemplate.description}
            </p>
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="btn-ghost p-2"
            title="Show help"
          >
            <HelpCircle className="w-5 h-5 text-blueprint-cyan-600" />
          </button>
        </div>

        {/* Help Text */}
        {showHelp && phaseTemplate.help_text && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-blueprint-cyan-50 rounded-lg border border-blueprint-cyan-200"
          >
            <p className="text-sm text-blueprint-navy-700">
              <strong>💡 Tip:</strong> {phaseTemplate.help_text}
            </p>
          </motion.div>
        )}
      </div>

      {/* Questions */}
      <div className="p-6 space-y-6">
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
                disabled={!canProceed}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Phase Actions */}
      <div className="border-t border-blueprint-navy-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
                className="btn-ghost flex items-center text-blueprint-navy-600 hover:text-blueprint-navy-900"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Previous Phase
              </button>
            )}
            <div className="text-sm text-blueprint-navy-600">
              {allRequiredAnswered ? (
                <span className="text-green-600 font-medium">
                  ✓ All required questions answered
                </span>
              ) : (
                <span>
                  Answer all required questions to proceed
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onPhaseComplete}
            disabled={!allRequiredAnswered || !canProceed}
            className={`
              btn-primary flex items-center
              ${!allRequiredAnswered || !canProceed ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isLastPhase ? (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                Complete Blueprint
              </>
            ) : (
              <>
                Next Phase
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}