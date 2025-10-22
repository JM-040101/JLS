'use client'

import { ReactNode } from 'react'
import TopNavbar from '../navigation/TopNavbar'

interface DashboardLayoutProps {
  children: ReactNode
  user: {
    full_name: string | null
    email: string
  }
  searchQuery?: string
  onSearchChange?: (query: string) => void
  showSearch?: boolean
}

export default function DashboardLayout({ children, user, searchQuery, onSearchChange, showSearch }: DashboardLayoutProps) {
  return (
    <>
      {/* Top Navigation */}
      <TopNavbar
        user={user}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        showSearch={showSearch}
      />

      {/* Main Content - Add top padding for fixed navbar */}
      <div className="relative z-10 pt-24">
        {children}
      </div>
    </>
  )
}
