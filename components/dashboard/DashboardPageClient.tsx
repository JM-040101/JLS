'use client'

import { useState } from 'react'
import DashboardLayout from './DashboardLayout'
import DashboardContent from './DashboardContent'

interface Session {
  id: string
  app_description: string
  status: string
  completed_phases: number
  created_at: string
  updated_at: string
}

interface DashboardPageClientProps {
  user: {
    full_name: string | null
    email: string
  }
  sessions: Session[]
  completedThisWeek: number
  completionRate: number
  totalBlueprints: number
}

export default function DashboardPageClient({
  user,
  sessions,
  completedThisWeek,
  completionRate,
  totalBlueprints,
}: DashboardPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <DashboardLayout
      user={user}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      showSearch={sessions.length > 0}
    >
      <DashboardContent
        user={user}
        sessions={sessions}
        completedThisWeek={completedThisWeek}
        completionRate={completionRate}
        totalBlueprints={totalBlueprints}
        searchQuery={searchQuery}
      />
    </DashboardLayout>
  )
}
