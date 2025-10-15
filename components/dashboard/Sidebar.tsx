'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, LayoutDashboard, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { branding } from '@/branding.config'

interface SidebarProps {
  user: {
    full_name: string | null
    email: string
  }
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${
        isCollapsed ? 'w-[80px]' : 'w-[260px]'
      }`}
      style={{
        background: `linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)`,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
      }}
    >
      <div className="flex flex-col h-full p-6">
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
              style={{
                backgroundColor: branding.colors.accent,
                boxShadow: `0 0 20px ${branding.colors.accentGlow}`,
              }}
            >
              <FileText className="w-6 h-6" style={{ color: branding.colors.background }} />
            </div>
            {!isCollapsed && (
              <div>
                <h1
                  className="text-lg font-bold whitespace-nowrap"
                  style={{
                    color: branding.colors.textHeading,
                    fontFamily: branding.fonts.heading,
                    letterSpacing: '-0.02em',
                  }}
                >
                  SaaS Blueprint
                </h1>
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            style={{ color: branding.colors.textMuted }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200`}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2))`
                    : 'transparent',
                  borderLeft: isActive ? `3px solid ${branding.colors.accent}` : '3px solid transparent',
                  color: isActive ? branding.colors.textHeading : branding.colors.textMuted,
                  boxShadow: isActive ? '0 0 20px rgba(6, 182, 212, 0.3)' : 'none',
                }}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Profile Card */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                color: branding.colors.background,
              }}
              title={isCollapsed ? user.full_name || 'User' : undefined}
            >
              {(user.full_name?.[0] || user.email[0]).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: branding.colors.textHeading }}
                >
                  {user.full_name || 'User'}
                </p>
                <p className="text-xs truncate" style={{ color: branding.colors.textMuted }}>
                  Pro Plan
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
