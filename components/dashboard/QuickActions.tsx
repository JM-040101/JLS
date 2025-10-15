'use client'

import Link from 'next/link'
import { Plus, Download, Upload, Settings } from 'lucide-react'
import { branding } from '@/branding.config'

const actions = [
  {
    icon: Plus,
    label: 'New Blueprint',
    href: '/workflow/new',
    color: branding.colors.accent,
  },
  {
    icon: Upload,
    label: 'Import Template',
    href: '/dashboard/import',
    color: '#a855f7',
  },
  {
    icon: Download,
    label: 'Export All',
    href: '/dashboard/export',
    color: '#10b981',
  },
  {
    icon: Settings,
    label: 'Manage Settings',
    href: '/dashboard/settings',
    color: '#3b82f6',
  },
]

export default function QuickActions() {
  return (
    <div
      className="rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl"
      style={{
        background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))`,
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      <h2
        className="text-lg font-bold mb-4 flex items-center"
        style={{ color: branding.colors.textHeading }}
      >
        <span className="mr-2">⚡</span> Quick Actions
      </h2>

      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 hover:scale-105 group/action"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all group-hover/action:scale-110"
                style={{
                  background: `${action.color}20`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span
                className="text-sm font-medium flex-1"
                style={{ color: branding.colors.textHeading }}
              >
                {action.label}
              </span>
              <svg
                className="w-4 h-4 transition-transform group-hover/action:translate-x-1"
                style={{ color: branding.colors.textMuted }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
