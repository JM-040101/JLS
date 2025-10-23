'use client'

import Link from 'next/link'
import { CheckCircle, Clock, Archive, Calendar, Download } from 'lucide-react'
import { branding } from '@/branding.config'

interface BlueprintCardProps {
  id: string
  title: string
  status: 'in_progress' | 'completed' | 'archived'
  completedPhases: number
  totalPhases?: number
  createdAt: string
  hasBeenExported?: boolean
  lastExported?: string | null
  views?: number
  isWide?: boolean
}

export default function BlueprintCard({
  id,
  title,
  status,
  completedPhases,
  totalPhases = 12,
  createdAt,
  hasBeenExported = false,
  lastExported = null,
  views = 0,
  isWide = false,
}: BlueprintCardProps) {
  const progress = (completedPhases / totalPhases) * 100

  const statusConfig = {
    in_progress: {
      icon: Clock,
      label: 'In Progress',
      color: branding.colors.warning,
      gradient: 'linear-gradient(90deg, #f59e0b, #f97316)',
    },
    completed: {
      icon: CheckCircle,
      label: 'Completed',
      color: branding.colors.success,
      gradient: `linear-gradient(90deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
    },
    archived: {
      icon: Archive,
      label: 'Archived',
      color: branding.colors.textMuted,
      gradient: 'linear-gradient(90deg, #6b7280, #4b5563)',
    },
  }

  const currentStatus = statusConfig[status]
  const StatusIcon = currentStatus.icon

  return (
    <div
      className="col-span-12 md:col-span-6 lg:col-span-4 rounded-3xl p-5 transition-all duration-300 group"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Simplified - All Same Size */}
      <div>
        <h3
          className="text-lg font-bold mb-2 line-clamp-2"
          style={{ color: branding.colors.textHeading }}
        >
          {title}
        </h3>

        <div className="flex items-center flex-wrap gap-2 text-xs mb-4">
          <span className="flex items-center" style={{ color: branding.colors.textMuted }}>
            <StatusIcon className="w-3 h-3 mr-1" style={{ color: currentStatus.color }} />
            {currentStatus.label}
          </span>
          <span style={{ color: branding.colors.textMuted }}>•</span>
          <span style={{ color: branding.colors.textMuted }}>Phase {completedPhases}/{totalPhases}</span>
          {hasBeenExported && (
            <>
              <span style={{ color: branding.colors.textMuted }}>•</span>
              <span
                className="flex items-center px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: `linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(20, 184, 166, 0.15))`,
                  border: `1px solid rgba(6, 182, 212, 0.3)`,
                  color: branding.colors.accent,
                }}
                title={lastExported ? `Exported on ${new Date(lastExported).toLocaleDateString()}` : 'Exported'}
              >
                <Download className="w-3 h-3 mr-1" />
                Exported
              </span>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div
          className="h-2 rounded-full overflow-hidden mb-4"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: currentStatus.gradient,
              boxShadow: `0 0 10px ${currentStatus.color}40`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs" style={{ color: branding.colors.textMuted }}>
          <span className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>

          <Link
            href={status === 'completed' ? `/preview-plan/${id}` : `/workflow/${id}`}
            className="px-4 py-2 rounded-lg font-medium transition-all hover:shadow-md hover:scale-105"
            style={{
              backgroundColor: branding.colors.secondary,
              color: branding.colors.textHeading,
              border: `1px solid ${branding.colors.divider}`,
            }}
          >
            {status === 'completed' ? 'View' : 'Continue'}
          </Link>
        </div>
      </div>
    </div>
  )
}
