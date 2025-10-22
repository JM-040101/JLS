'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, CheckCircle } from 'lucide-react'
import { branding } from '@/branding.config'
import DecryptedText from '@/components/ui/DecryptedText'
import AnimatedButton from '@/components/ui/AnimatedButton'

interface HeroBentoCardProps {
  userName: string
  totalBlueprints: number
  completedThisWeek: number
  completionRate: number
}

export default function HeroBentoCard({
  userName,
  totalBlueprints,
  completedThisWeek,
  completionRate,
}: HeroBentoCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  return (
    <div
      className="rounded-3xl p-6 transition-all duration-300 h-full overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Welcome Heading */}
      <div className="mb-5">
        <h1
          className="text-5xl font-bold mb-1"
          style={{
            fontFamily: branding.fonts.heading,
            letterSpacing: '-0.02em',
          }}
        >
          {mounted && (
            <DecryptedText
              text={`Welcome back, ${userName}!`}
              animateOn="view"
              speed={80}
              maxIterations={8}
              sequential={true}
              className="revealed"
              style={{
                background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, #14b8a6)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            />
          )}
        </h1>
        <p className="text-sm" style={{ color: branding.colors.textMuted, opacity: 0.8 }}>
          Here's what's happening with your blueprints today
        </p>
      </div>

      {/* Overview Stats */}
      <div className="mb-6 space-y-2">

        <div className="flex items-center space-x-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(6, 182, 212, 0.2)' }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: branding.colors.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold leading-none mb-0.5" style={{ color: branding.colors.textHeading }}>
              {totalBlueprints}
            </p>
            <p className="text-xs leading-none" style={{ color: branding.colors.textMuted }}>
              Active blueprints
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(16, 185, 129, 0.2)' }}
          >
            <CheckCircle className="w-4 h-4" style={{ color: branding.colors.success }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold leading-none mb-0.5" style={{ color: branding.colors.textHeading }}>
              {completedThisWeek}
            </p>
            <p className="text-xs leading-none" style={{ color: branding.colors.textMuted }}>
              Completed this week
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(20, 184, 166, 0.2)' }}
          >
            <div
              className="text-sm font-bold"
              style={{
                background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, #14b8a6)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {completionRate}%
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold leading-none mb-0.5" style={{ color: branding.colors.textHeading }}>
              {completionRate}%
            </p>
            <p className="text-xs leading-none" style={{ color: branding.colors.textMuted }}>
              Completion rate
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <AnimatedButton
        href="/workflow/new"
        text="Create New Blueprint"
        className="w-full justify-center"
      />
    </div>
  )
}
