'use client'

import { useState, useEffect, useRef } from 'react'
import { Info, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface QuestionFormProps {
  question: {
    id: string
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean'
    label: string
    placeholder?: string
    required: boolean
    options?: string[]
    validation?: {
      minLength?: number
      maxLength?: number
      pattern?: string
    }
    tooltip?: string
  }
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function QuestionForm({ question, value, onChange, disabled }: QuestionFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isTouched, setIsTouched] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current && question.type === 'textarea') {
      const textarea = textareaRef.current
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      // Set height to scrollHeight to fit content
      const newHeight = Math.max(96, textarea.scrollHeight) // min 96px (6rem)
      textarea.style.height = `${newHeight}px`
    }
  }, [value, question.type])

  // Validate input
  useEffect(() => {
    if (!isTouched) return

    if (question.required && !value) {
      setError('This field is required')
      return
    }

    if (question.validation) {
      const { minLength, maxLength, pattern } = question.validation
      
      if (minLength && value.length < minLength) {
        setError(`Minimum ${minLength} characters required`)
        return
      }
      
      if (maxLength && value.length > maxLength) {
        setError(`Maximum ${maxLength} characters allowed`)
        return
      }
      
      if (pattern && !new RegExp(pattern).test(value)) {
        setError('Invalid format')
        return
      }
    }

    setError(null)
  }, [value, question, isTouched])

  const handleBlur = () => {
    setIsTouched(true)
  }

  const renderInput = () => {
    switch (question.type) {
      case 'textarea':
        return (
          <textarea
            ref={textareaRef}
            id={question.id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={question.placeholder}
            disabled={disabled}
            className={`input ${error ? 'border-red-500' : ''}`}
            style={{ minHeight: '96px', overflow: 'hidden' }}
          />
        )

      case 'select':
        return (
          <select
            id={question.id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            className={`input ${error ? 'border-red-500' : ''}`}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        const selectedValues = value ? value.split(',') : []
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v) => v !== option)
                    onChange(newValues.join(','))
                    setIsTouched(true)
                  }}
                  disabled={disabled}
                  className="w-4 h-4 text-blueprint-cyan-600 focus:ring-blueprint-cyan-500 border-blueprint-navy-300 rounded"
                />
                <span className="text-sm text-blueprint-navy-700">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'boolean':
        return (
          <div className="flex items-center space-x-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={question.id}
                checked={value === 'true'}
                onChange={() => {
                  onChange('true')
                  setIsTouched(true)
                }}
                disabled={disabled}
                className="w-4 h-4 text-blueprint-cyan-600 focus:ring-blueprint-cyan-500 border-blueprint-navy-300"
              />
              <span className="ml-2 text-sm text-blueprint-navy-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name={question.id}
                checked={value === 'false'}
                onChange={() => {
                  onChange('false')
                  setIsTouched(true)
                }}
                disabled={disabled}
                className="w-4 h-4 text-blueprint-cyan-600 focus:ring-blueprint-cyan-500 border-blueprint-navy-300"
              />
              <span className="ml-2 text-sm text-blueprint-navy-700">No</span>
            </label>
          </div>
        )

      default: // text
        return (
          <input
            id={question.id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={question.placeholder}
            disabled={disabled}
            className={`input ${error ? 'border-red-500' : ''}`}
          />
        )
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <label
          htmlFor={question.id}
          className="block text-sm font-medium text-blueprint-navy-900 mb-1.5"
        >
          {question.label}
          {question.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>

        {question.tooltip && (
          <div className="group relative flex-shrink-0">
            <Info className="w-4 h-4 text-blueprint-navy-400 cursor-help" />
            <div className="absolute right-0 top-6 z-10 w-64 p-3 bg-blueprint-navy-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-lg">
              {question.tooltip}
            </div>
          </div>
        )}
      </div>

      {renderInput()}

      {/* Character count for text/textarea */}
      {(question.type === 'text' || question.type === 'textarea') && question.validation?.maxLength && (
        <div className="flex justify-between items-center">
          <div>
            {error && isTouched && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 flex items-center"
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                {error}
              </motion.p>
            )}
          </div>
          <span className={`text-xs ${
            value.length > question.validation.maxLength * 0.9
              ? 'text-yellow-600'
              : 'text-blueprint-navy-500'
          }`}>
            {value.length}/{question.validation.maxLength}
          </span>
        </div>
      )}

      {/* Error message for other types */}
      {question.type !== 'text' && question.type !== 'textarea' && error && isTouched && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 flex items-center"
        >
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </motion.p>
      )}
    </div>
  )
}