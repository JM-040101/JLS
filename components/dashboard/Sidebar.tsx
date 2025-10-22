'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, LayoutDashboard, Settings, Menu, X } from 'lucide-react'
import { branding } from '@/branding.config'

interface SidebarProps {
  user: {
    full_name: string | null
    email: string
  }
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export default function Sidebar({ user, isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Collapsed Icon Bar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[70px] z-40 transition-all duration-300 ${
          isOpen ? 'lg:opacity-0 lg:pointer-events-none' : ''
        }`}
        style={{
          background: `linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)`,
          backdropFilter: 'blur(60px) saturate(200%)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="flex flex-col h-full items-center py-6 space-y-6">
          {/* Menu Toggle */}
          <button
            onClick={() => setIsOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
            style={{ color: branding.colors.textMuted }}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
            style={{
              backgroundColor: branding.colors.accent,
              boxShadow: `0 0 20px ${branding.colors.accentGlow}`,
            }}
          >
            <FileText className="w-6 h-6" style={{ color: branding.colors.background }} />
          </div>

          {/* Navigation Icons */}
          <nav className="flex-1 flex flex-col space-y-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2))`
                      : 'transparent',
                    color: isActive ? branding.colors.textHeading : branding.colors.textMuted,
                    boxShadow: isActive ? '0 0 20px rgba(6, 182, 212, 0.3)' : 'none',
                  }}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              )
            })}
          </nav>

          {/* User Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
              color: branding.colors.background,
            }}
            title={`${user.full_name || 'User'} - Pro Plan`}
          >
            {(user.full_name?.[0] || user.email[0]).toUpperCase()}
          </div>
        </div>
      </aside>

      {/* Expanded Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[260px] z-50 transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: `linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)`,
          backdropFilter: 'blur(60px) saturate(200%)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="flex flex-col h-full p-6">
          {/* Header with Close Button */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: branding.colors.accent,
                  boxShadow: `0 0 20px ${branding.colors.accentGlow}`,
                }}
              >
                <FileText className="w-6 h-6" style={{ color: branding.colors.background }} />
              </div>
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
            </div>

            {/* Close/Collapse Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: branding.colors.textMuted }}
              title="Collapse sidebar"
            >
              <X className="w-5 h-5" />
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
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      setIsOpen(false)
                    }
                  }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200"
                  style={{
                    background: isActive
                      ? `linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(168, 85, 247, 0.2))`
                      : 'transparent',
                    borderLeft: isActive ? `3px solid ${branding.colors.accent}` : '3px solid transparent',
                    color: isActive ? branding.colors.textHeading : branding.colors.textMuted,
                    boxShadow: isActive ? '0 0 20px rgba(6, 182, 212, 0.3)' : 'none',
                  }}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
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
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                  color: branding.colors.background,
                }}
              >
                {(user.full_name?.[0] || user.email[0]).toUpperCase()}
              </div>
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
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
