'use client'

import { FileText, Clock, CheckCircle, Calendar } from 'lucide-react'
import { branding } from '@/branding.config'

interface StatsTowerProps {
  totalBlueprints: number
  inProgress: number
  completed: number
  memberSince: string
}

export default function StatsTower({
  totalBlueprints,
  inProgress,
  completed,
  memberSince,
}: StatsTowerProps) {
  const stats = [
    {
      icon: FileText,
      label: 'Total Blueprints',
      value: totalBlueprints,
      color: branding.colors.accent,
      gradient: `linear-gradient(135deg, ${branding.colors.gradientFrom}, #a855f7)`,
    },
    {
      icon: Clock,
      label: 'In Progress',
      value: inProgress,
      color: branding.colors.warning,
      gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
    },
    {
      icon: CheckCircle,
      label: 'Completed',
      value: completed,
      color: branding.colors.success,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      icon: Calendar,
      label: 'Member Since',
      value: memberSince,
      color: branding.colors.info,
      gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
      isText: true,
    },
  ]

  return (
    <div className="space-y-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon

        return (
          <div
            key={stat.label}
            className="rounded-2xl p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group"
            style={{
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))`,
              backdropFilter: 'blur(24px) saturate(150%)',
              WebkitBackdropFilter: 'blur(24px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
              height: '100px',
              position: 'relative',
              overflow: 'hidden',
              animationDelay: `${index * 100}ms`,
            }}
          >
            {/* Gradient border effect on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: stat.gradient,
                padding: '2px',
                borderRadius: '16px',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }}
            />

            <div className="relative flex items-center justify-between h-full">
              <div className="flex-1">
                <p className="text-xs font-medium mb-1" style={{ color: branding.colors.textMuted }}>
                  {stat.label}
                </p>
                <p
                  className={stat.isText ? 'text-lg font-extrabold' : 'text-3xl font-extrabold'}
                  style={{ color: branding.colors.textHeading }}
                >
                  {stat.value}
                </p>
              </div>

              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{
                  background: `${stat.color}20`,
                }}
              >
                <Icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
