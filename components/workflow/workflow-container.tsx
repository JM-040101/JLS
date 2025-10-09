'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Session, PhaseTemplate, Answer } from '@/types/database'
import PhaseProgress from './phase-progress'
import PhaseSidebar from './phase-sidebar'
import PhaseContent from './phase-content'
import WorkflowHeader from './workflow-header'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

interface WorkflowContainerProps {
  session: Session
  phaseTemplates: PhaseTemplate[]
  existingAnswers: Answer[]
  userId: string
}

export default function WorkflowContainer({
  session,
  phaseTemplates,
  existingAnswers,
  userId,
}: WorkflowContainerProps) {
  const [currentPhase, setCurrentPhase] = useState(session.current_phase || 1)
  const [completedPhases, setCompletedPhases] = useState(session.completed_phases || 0)
  const [answers, setAnswers] = useState<Record<string, Answer>>(
    existingAnswers.reduce((acc, answer) => ({
      ...acc,
      [`${answer.phase_number}-${answer.question_id}`]: answer,
    }), {})
  )
  const [isSaving, setIsSaving] = useState(false)
  const [sessionStatus, setSessionStatus] = useState(session.status)

  const router = useRouter()
  const supabase = createClientComponentClient()

  // Listen for custom phase change events from child components
  useEffect(() => {
    const handlePhaseChange = (event: CustomEvent) => {
      const targetPhase = event.detail
      if (targetPhase >= 1 && targetPhase <= 12) {
        setCurrentPhase(targetPhase)
      }
    }

    window.addEventListener('changePhase', handlePhaseChange as EventListener)
    return () => {
      window.removeEventListener('changePhase', handlePhaseChange as EventListener)
    }
  }, [])

  // Auto-save answers with debounce
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (Object.keys(answers).length > 0) {
        saveProgress()
      }
    }, 2000) // Save after 2 seconds of inactivity

    return () => clearTimeout(saveTimer)
  }, [answers])

  const saveProgress = async () => {
    setIsSaving(true)
    try {
      // Update session progress
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({
          current_phase: currentPhase,
          completed_phases: completedPhases,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id)

      if (sessionError) {
        console.error('Error updating session:', sessionError)
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAnswerChange = async (
    phaseNumber: number,
    questionId: string,
    questionText: string,
    answerText: string,
    answerType: string
  ) => {
    const key = `${phaseNumber}-${questionId}`
    
    // Update local state immediately
    setAnswers(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        answer_text: answerText,
        updated_at: new Date().toISOString(),
      } as Answer
    }))

    // Save to database
    try {
      const existingAnswer = answers[key]
      
      if (existingAnswer?.id) {
        // Update existing answer
        await supabase
          .from('answers')
          .update({
            answer_text: answerText,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingAnswer.id)
      } else {
        // Insert new answer
        const { data, error } = await supabase
          .from('answers')
          .insert({
            session_id: session.id,
            phase_number: phaseNumber,
            question_id: questionId,
            question_text: questionText,
            answer_text: answerText,
            answer_type: answerType,
          })
          .select()
          .single()

        if (data && !error) {
          setAnswers(prev => ({
            ...prev,
            [key]: data as Answer
          }))
        }
      }
    } catch (error) {
      console.error('Error saving answer:', error)
    }
  }

  const handlePhaseComplete = async () => {
    const currentTemplate = phaseTemplates.find(p => p.phase_number === currentPhase)
    if (!currentTemplate) return

    // Validate all required questions are answered
    const questions = currentTemplate.questions as any[]
    const allAnswered = questions
      .filter(q => q.required)
      .every(q => {
        const answer = answers[`${currentPhase}-${q.id}`]
        return answer && answer.answer_text && answer.answer_text.trim().length > 0
      })

    if (!allAnswered) {
      toast.error('Please answer all required questions')
      return
    }

    // Update completed phases
    const newCompletedPhases = Math.max(completedPhases, currentPhase)
    setCompletedPhases(newCompletedPhases)

    // Move to next phase or complete workflow
    if (currentPhase < 12) {
      setCurrentPhase(currentPhase + 1)
      toast.success(`Phase ${currentPhase} completed!`)
    } else {
      // Complete the entire workflow
      await supabase
        .from('sessions')
        .update({
          status: 'completed',
          completed_phases: 12,
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id)

      toast.success('Blueprint completed! Redirecting to export...')
      setTimeout(() => {
        router.push(`/export/${session.id}`)
      }, 2000)
    }

    await saveProgress()
  }

  const handlePhaseSelect = (phase: number) => {
    // Allow navigation to any completed phase or the next uncompleted phase
    // This enables viewing and editing previous phases
    if (phase <= completedPhases + 1) {
      setCurrentPhase(phase)
    } else {
      toast.error('Complete previous phases first')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blueprint-navy-50 to-white">
      <Toaster position="top-right" />
      
      <WorkflowHeader
        sessionName={session.app_name || session.app_description}
        isSaving={isSaving}
        onExit={() => router.push('/dashboard')}
      />

      <PhaseProgress
        currentPhase={currentPhase}
        completedPhases={completedPhases}
        totalPhases={12}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="hidden lg:block w-80">
            <PhaseSidebar
              phaseTemplates={phaseTemplates}
              currentPhase={currentPhase}
              completedPhases={completedPhases}
              onPhaseSelect={handlePhaseSelect}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPhase}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PhaseContent
                  phaseTemplate={phaseTemplates.find(p => p.phase_number === currentPhase)!}
                  answers={answers}
                  onAnswerChange={handleAnswerChange}
                  onPhaseComplete={handlePhaseComplete}
                  canProceed={currentPhase <= completedPhases + 1}
                  isLastPhase={currentPhase === 12}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}