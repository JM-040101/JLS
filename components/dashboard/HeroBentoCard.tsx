'use client'

import Link from 'next/link'
import { Plus, TrendingUp, CheckCircle } from 'lucide-react'
import { branding } from '@/branding.config'

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
  return (
    <div
      className="rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group h-full"
      style={{
        background: `linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))`,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
      }}
    >
      {/* Welcome Heading */}
      <div className="mb-6">
        <h1
          className="text-4xl font-bold mb-2"
          style={{
            background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, #a855f7, #ec4899)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: branding.fonts.heading,
            letterSpacing: '-0.02em',
          }}
        >
          👋 Welcome back, {userName}!
        </h1>
        <p className="text-base" style={{ color: branding.colors.textMuted, opacity: 0.8 }}>
          Here's what's happening with your blueprints today
        </p>
      </div>

      {/* Overview Stats */}
      <div className="mb-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: branding.colors.textMuted }}>
          📊 Quick Overview
        </h2>

        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(6, 182, 212, 0.2)' }}
          >
            <TrendingUp className="w-5 h-5" style={{ color: branding.colors.accent }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: branding.colors.textHeading }}>
              {totalBlueprints}
            </p>
            <p className="text-sm" style={{ color: branding.colors.textMuted }}>
              Active blueprints
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(16, 185, 129, 0.2)' }}
          >
            <CheckCircle className="w-5 h-5" style={{ color: branding.colors.success }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: branding.colors.textHeading }}>
              {completedThisWeek}
            </p>
            <p className="text-sm" style={{ color: branding.colors.textMuted }}>
              Completed this week
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(168, 85, 247, 0.2)' }}
          >
            <div className="text-lg font-bold" style={{ color: '#a855f7' }}>
              {completionRate}%
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: branding.colors.textHeading }}>
              {completionRate}%
            </p>
            <p className="text-sm" style={{ color: branding.colors.textMuted }}>
              Average completion rate
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Link
        href="/workflow/new"
        className="inline-flex items-center justify-center w-full px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 group/button"
        style={{
          background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, #14b8a6, ${branding.colors.gradientTo})`,
          color: branding.colors.background,
          boxShadow: `0 8px 32px ${branding.colors.accentGlow}`,
          letterSpacing: '0.02em',
        }}
      >
        <Plus className="w-6 h-6 mr-2 transition-transform group-hover/button:rotate-90" />
        Create New Blueprint
      </Link>

      {/* Tip */}
      <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
        <p className="text-xs" style={{ color: branding.colors.textMuted, opacity: 0.7 }}>
          💡 <span className="font-semibold">Pro tip:</span> Export your blueprints as markdown files to share with your team
        </p>
      </div>
    </div>
  )
}
