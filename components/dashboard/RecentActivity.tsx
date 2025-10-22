'use client'

import { CheckCircle, FileText, Download, Clock, Zap, Play } from 'lucide-react'
import { branding } from '@/branding.config'

interface ActivityItem {
  icon: any
  label: string
  timestamp: string
  color: string
}

interface Session {
  id: string
  app_description: string
  status: string
  completed_phases: number
  created_at: string
  updated_at: string
}

interface RecentActivityProps {
  sessions?: Session[]
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / 60000)
  const diffInHours = Math.floor(diffInMs / 3600000)
  const diffInDays = Math.floor(diffInMs / 86400000)

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays < 7) return `${diffInDays}d ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`
  return date.toLocaleDateString()
}

function generateActivities(sessions: Session[]): ActivityItem[] {
  const activities: ActivityItem[] = []

  // Sort sessions by updated_at (most recent first)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  sortedSessions.forEach((session) => {
    // Add created activity
    activities.push({
      icon: FileText,
      label: `Created "${session.app_description.slice(0, 25)}${session.app_description.length > 25 ? '...' : ''}"`,
      timestamp: formatRelativeTime(session.created_at),
      color: branding.colors.gradientFrom, // Cyan
    })

    // Add phase completion activities
    if (session.completed_phases > 0) {
      if (session.completed_phases === 12) {
        activities.push({
          icon: CheckCircle,
          label: `Completed all phases`,
          timestamp: formatRelativeTime(session.updated_at),
          color: branding.colors.gradientTo, // Teal
        })
      } else if (session.completed_phases >= 6) {
        activities.push({
          icon: Zap,
          label: `Reached Phase ${session.completed_phases}`,
          timestamp: formatRelativeTime(session.updated_at),
          color: branding.colors.gradientTo, // Teal
        })
      } else if (session.completed_phases > 0) {
        activities.push({
          icon: Play,
          label: `Started working on phases`,
          timestamp: formatRelativeTime(session.updated_at),
          color: branding.colors.gradientFrom, // Cyan
        })
      }
    }

    // Add export activity for completed blueprints
    if (session.status === 'completed') {
      activities.push({
        icon: Download,
        label: 'Exported blueprint files',
        timestamp: formatRelativeTime(session.updated_at),
        color: branding.colors.gradientTo, // Teal
      })
    }
  })

  // Return most recent 6 activities
  return activities.slice(0, 6)
}

export default function RecentActivity({ sessions = [] }: RecentActivityProps) {
  const activities = sessions.length > 0 ? generateActivities(sessions) : [
    {
      icon: Clock,
      label: 'No activity yet',
      timestamp: 'Get started',
      color: branding.colors.textMuted,
    },
  ]
  return (
    <div
      className="rounded-3xl p-5 transition-all duration-300 h-full flex flex-col overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <h2
        className="text-base font-bold mb-5 flex items-center"
        style={{ color: branding.colors.textHeading }}
      >
        <span className="mr-2">🕐</span> Recent Activity
      </h2>

      <div className="flex-1 flex flex-col justify-center relative">
        {/* Timeline line */}
        <div
          className="absolute left-[10px] top-0 bottom-0 w-[2px]"
          style={{
            background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.3), rgba(20, 184, 166, 0.2))',
          }}
        />

        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activity.icon

            return (
              <div key={index} className="flex items-start space-x-3 relative">
                {/* Timeline dot */}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center z-10 relative flex-shrink-0"
                  style={{
                    background: `${activity.color}40`,
                    border: `2px solid ${activity.color}`,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: activity.color }}
                  />
                </div>

                <div className="flex-1 pt-0 min-w-0">
                  <p className="text-sm font-medium leading-tight mb-0.5 truncate" style={{ color: branding.colors.textHeading }}>
                    {activity.label}
                  </p>
                  <p className="text-xs leading-tight" style={{ color: branding.colors.textMuted, opacity: 0.7 }}>
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
