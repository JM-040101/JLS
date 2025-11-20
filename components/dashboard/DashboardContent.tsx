'use client'

import { useState } from 'react'
import { branding } from '@/branding.config'
import HeroBentoCard from './HeroBentoCard'
import RecentActivity from './RecentActivity'
import BlueprintCard from './BlueprintCard'

interface Session {
  id: string
  app_description: string
  status: string
  completed_phases: number
  created_at: string
  updated_at: string
  last_exported: string | null
  has_been_exported: boolean
}

interface DashboardContentProps {
  user: {
    full_name: string | null
    email: string
  }
  sessions: Session[]
  completedThisWeek: number
  completionRate: number
  totalBlueprints: number
  searchQuery: string
}

export default function DashboardContent({
  user,
  sessions,
  completedThisWeek,
  completionRate,
  totalBlueprints,
  searchQuery,
}: DashboardContentProps) {
  const filteredSessions = sessions.filter((session) =>
    session.app_description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-8">

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Hero Bento Card - 8 columns */}
        <div className="col-span-12 lg:col-span-8">
          <HeroBentoCard
            userName={user.full_name || 'Builder'}
            totalBlueprints={totalBlueprints}
            completedThisWeek={completedThisWeek}
            completionRate={completionRate}
          />
        </div>

        {/* Recent Activity - 4 columns (side by side with hero) */}
        <div className="col-span-12 lg:col-span-4">
          <RecentActivity sessions={sessions} />
        </div>

        {/* Your Blueprints Header */}
        <div className="col-span-12 mt-4">
          <h2
            className="text-2xl font-bold mb-0"
            style={{
              color: branding.colors.textHeading,
              fontFamily: branding.fonts.heading,
            }}
          >
            Your Blueprints
            {searchQuery && (
              <span style={{ color: branding.colors.textMuted }} className="text-lg ml-3">
                ({filteredSessions.length} result{filteredSessions.length !== 1 ? 's' : ''})
              </span>
            )}
          </h2>
        </div>

        {/* Blueprint Cards - All Same Size */}
        {filteredSessions.length === 0 ? (
          <div className="col-span-12">
            <div
              className="rounded-3xl p-16 text-center"
              style={{
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))`,
                backdropFilter: 'blur(60px) saturate(200%)',
                WebkitBackdropFilter: 'blur(60px) saturate(200%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
              }}
            >
              <div className="max-w-md mx-auto">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: `${branding.colors.accent}30`,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <svg
                    className="w-10 h-10"
                    style={{ color: branding.colors.accent }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {searchQuery ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    )}
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ color: branding.colors.textHeading }}>
                  {searchQuery ? 'No blueprints found' : 'No blueprints yet'}
                </h3>
                <p className="text-base mb-6" style={{ color: branding.colors.textMuted }}>
                  {searchQuery
                    ? `No blueprints matching "${searchQuery}"`
                    : 'Start your first SaaS blueprint and transform your idea into reality'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {filteredSessions.map((session) => (
              <BlueprintCard
                key={session.id}
                id={session.id}
                title={session.app_description}
                completedPhases={session.completed_phases}
                createdAt={session.created_at}
                hasBeenExported={session.has_been_exported}
                lastExported={session.last_exported}
                isWide={false}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
