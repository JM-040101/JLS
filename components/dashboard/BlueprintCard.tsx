'use client'

import Link from 'next/link'
import { CheckCircle, Clock, Archive, Calendar, Eye } from 'lucide-react'
import { branding } from '@/branding.config'

interface BlueprintCardProps {
  id: string
  title: string
  status: 'in_progress' | 'completed' | 'archived'
  completedPhases: number
  totalPhases?: number
  createdAt: string
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
      className={`rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group ${
        isWide ? 'col-span-12 md:col-span-8' : 'col-span-12 md:col-span-6 lg:col-span-4'
      }`}
      style={{
        background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))`,
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {isWide ? (
        // Wide Layout
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3
              className="text-xl font-bold mb-3 line-clamp-2"
              style={{ color: branding.colors.textHeading }}
            >
              {title}
            </h3>

            <div className="flex items-center space-x-4 text-sm mb-4" style={{ color: branding.colors.textMuted }}>
              <span className="flex items-center">
                <StatusIcon className="w-4 h-4 mr-1" style={{ color: currentStatus.color }} />
                {currentStatus.label}
              </span>
              <span>Phase {completedPhases}/{totalPhases}</span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(createdAt).toLocaleDateString()}
              </span>
              {views > 0 && (
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {views} views
                </span>
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
          </div>

          <div className="ml-4">
            <Link
              href={status === 'completed' ? `/preview-plan/${id}` : `/workflow/${id}`}
              className="inline-block px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:scale-105"
              style={{
                backgroundColor: branding.colors.secondary,
                color: branding.colors.textHeading,
                border: `1px solid ${branding.colors.divider}`,
              }}
            >
              {status === 'completed' ? 'View Plan' : 'Continue'}
            </Link>
          </div>
        </div>
      ) : (
        // Regular Layout
        <div>
          <h3
            className="text-lg font-bold mb-2 line-clamp-2"
            style={{ color: branding.colors.textHeading }}
          >
            {title}
          </h3>

          <div className="flex items-center space-x-2 text-xs mb-4" style={{ color: branding.colors.textMuted }}>
            <span className="flex items-center">
              <StatusIcon className="w-3 h-3 mr-1" style={{ color: currentStatus.color }} />
              {currentStatus.label}
            </span>
            <span>•</span>
            <span>Phase {completedPhases}/{totalPhases}</span>
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
              {new Date(createdAt).toLocaleDateString()}
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
      )}
    </div>
  )
}
