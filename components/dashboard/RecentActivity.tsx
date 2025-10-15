'use client'

import { CheckCircle, FileText, Download } from 'lucide-react'
import { branding } from '@/branding.config'

interface ActivityItem {
  icon: typeof CheckCircle
  label: string
  timestamp: string
  color: string
}

const activities: ActivityItem[] = [
  {
    icon: FileText,
    label: 'Blueprint created',
    timestamp: '2 hours ago',
    color: branding.colors.accent,
  },
  {
    icon: CheckCircle,
    label: 'Phase 12 completed',
    timestamp: '1 day ago',
    color: branding.colors.success,
  },
  {
    icon: Download,
    label: 'Exported files',
    timestamp: '3 days ago',
    color: '#a855f7',
  },
]

export default function RecentActivity() {
  return (
    <div
      className="rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl h-full"
      style={{
        background: `linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))`,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
      }}
    >
      <h2
        className="text-lg font-bold mb-4 flex items-center"
        style={{ color: branding.colors.textHeading }}
      >
        <span className="mr-2">🕐</span> Recent Activity
      </h2>

      <div className="space-y-4 relative">
        {/* Timeline line */}
        <div
          className="absolute left-[11px] top-2 bottom-2 w-[2px]"
          style={{
            background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.3), rgba(168, 85, 247, 0.1))',
          }}
        />

        {activities.map((activity, index) => {
          const Icon = activity.icon

          return (
            <div key={index} className="flex items-start space-x-3 relative">
              {/* Timeline dot */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center z-10 relative"
                style={{
                  background: `${activity.color}40`,
                  border: `2px solid ${activity.color}`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: activity.color }}
                />
              </div>

              <div className="flex-1 pt-0.5">
                <p className="text-sm font-medium" style={{ color: branding.colors.textHeading }}>
                  {activity.label}
                </p>
                <p className="text-xs" style={{ color: branding.colors.textMuted, opacity: 0.7 }}>
                  {activity.timestamp}
                </p>
              </div>
            </div>
          )
        })}

        {/* Fade at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.3))',
          }}
        />
      </div>
    </div>
  )
}
