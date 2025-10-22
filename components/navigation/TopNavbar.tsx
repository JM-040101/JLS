'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { branding } from '@/branding.config'
import SharpAxeLogo from './SharpAxeLogo'

interface TopNavbarProps {
  user: {
    full_name: string | null
    email: string
  }
  searchQuery?: string
  onSearchChange?: (query: string) => void
  showSearch?: boolean
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Settings', href: '/dashboard/settings' },
]

export default function TopNavbar({ user, searchQuery = '', onSearchChange, showSearch = false }: TopNavbarProps) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Top Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 mx-auto transition-all duration-300 ${
          scrolled ? 'mt-2' : 'mt-4'
        }`}
        style={{
          maxWidth: '1400px',
          width: 'calc(100% - 32px)',
          height: scrolled ? '52px' : '60px',
        }}
      >
        <div
          className="relative h-full rounded-2xl overflow-hidden transition-all duration-300"
          style={{
            background: scrolled
              ? 'rgba(18, 20, 28, 0.9)'
              : 'rgba(18, 20, 28, 0.8)',
            backdropFilter: scrolled
              ? 'blur(30px) saturate(200%)'
              : 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: scrolled
              ? 'blur(30px) saturate(200%)'
              : 'blur(20px) saturate(180%)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            boxShadow: scrolled
              ? '0 12px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(6, 182, 212, 0.1)'
              : '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(6, 182, 212, 0.1)',
          }}
        >
          {/* Bottom gradient accent line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60"
            style={{
              background: `linear-gradient(90deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo}, ${branding.colors.gradientFrom})`,
              borderRadius: '0 0 16px 16px',
            }}
          />

          <div className="flex items-center h-full px-6 relative">
            {/* Left: Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/dashboard">
                <SharpAxeLogo />
              </Link>
            </div>

            {/* Center: Navigation (Desktop) - Absolutely centered */}
            <nav className="hidden md:flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
              {navItems.map((item) => {
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(20, 184, 166, 0.2))`
                        : 'transparent',
                      color: isActive
                        ? branding.colors.textHeading
                        : branding.colors.textMuted,
                      boxShadow: isActive
                        ? '0 0 20px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        : 'none',
                    }}
                  >
                    {item.label}
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                        }}
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Right: Utilities */}
            <div className="flex items-center space-x-3 flex-shrink-0 ml-auto">
              {/* Search Box - Only show on dashboard */}
              {showSearch && (
                <div className="relative hidden md:block">
                  <input
                    type="text"
                    placeholder="Search blueprints..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="px-4 py-2 pl-10 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none"
                    style={{
                      width: '250px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${searchQuery ? branding.colors.accent : 'rgba(255, 255, 255, 0.1)'}`,
                      color: branding.colors.textHeading,
                      boxShadow: searchQuery ? `0 0 20px rgba(6, 182, 212, 0.2)` : 'none',
                    }}
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                    style={{ color: searchQuery ? branding.colors.accent : branding.colors.textMuted }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              )}

              {/* User Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-all duration-200 hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
                  color: branding.colors.background,
                  border: `2px solid ${branding.colors.gradientFrom}`,
                  boxShadow: `0 0 12px rgba(6, 182, 212, 0.4)`,
                }}
                title={`${user.full_name || 'User'} - Pro Plan`}
              >
                {(user.full_name?.[0] || user.email[0]).toUpperCase()}
              </div>

              {/* Mobile Menu Toggle */}
              <button
                className="md:hidden w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: branding.colors.textMuted,
                }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="absolute top-20 left-4 right-4 rounded-2xl p-4"
            style={{
              background: 'rgba(18, 20, 28, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(20, 184, 166, 0.2))`
                        : 'transparent',
                      color: isActive
                        ? branding.colors.textHeading
                        : branding.colors.textMuted,
                      boxShadow: isActive
                        ? '0 0 20px rgba(6, 182, 212, 0.3)'
                        : 'none',
                    }}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
