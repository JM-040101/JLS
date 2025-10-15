'use client'

import { useState, ReactNode } from 'react'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
  user: {
    full_name: string | null
    email: string
  }
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      <Sidebar user={user} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content - Responsive to sidebar */}
      <div
        className="relative z-10 transition-all duration-300"
        style={{ marginLeft: isCollapsed ? '80px' : '260px' }}
      >
        {children}
      </div>
    </>
  )
}
