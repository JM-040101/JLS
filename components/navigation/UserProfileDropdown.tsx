'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { branding } from '@/branding.config'

interface UserProfileDropdownProps {
  user: {
    full_name: string | null
    email: string
  }
}

export default function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    if (isSigningOut) return // Prevent multiple clicks

    setIsSigningOut(true)
    setIsOpen(false)

    try {
      // Call sign-out API
      const response = await fetch('/auth/sign-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Always redirect, even if there's an error
      // This ensures the user is logged out client-side
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      // Force redirect even on error
      window.location.href = '/'
    }
  }

  return (
    <div className="relative z-[9999]" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={handleToggle}
        className="flex items-center space-x-2 focus:outline-none group"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${branding.colors.gradientFrom}, ${branding.colors.gradientTo})`,
            color: branding.colors.background,
            border: `2px solid ${branding.colors.gradientFrom}`,
            boxShadow: isOpen
              ? `0 0 20px rgba(6, 182, 212, 0.6)`
              : `0 0 12px rgba(6, 182, 212, 0.4)`,
          }}
        >
          {(user.full_name?.[0] || user.email[0]).toUpperCase()}
        </div>

        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 hidden md:block ${
            isOpen ? 'rotate-180' : ''
          }`}
          style={{ color: branding.colors.textMuted }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(18, 20, 28, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '2px solid rgba(6, 182, 212, 0.5)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.8), 0 0 20px rgba(6, 182, 212, 0.3)',
            zIndex: 99999,
            position: 'absolute',
            top: '100%',
          }}
        >
          {/* User Info Header */}
          <div
            className="px-4 py-3 border-b"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              className="text-sm font-semibold truncate"
              style={{ color: branding.colors.textHeading }}
            >
              {user.full_name || 'User'}
            </div>
            <div
              className="text-xs truncate"
              style={{ color: branding.colors.textMuted }}
            >
              {user.email}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false)
                router.push('/dashboard/settings')
              }}
              className="w-full flex items-center space-x-3 px-4 py-2.5 transition-all"
              style={{
                color: branding.colors.textMuted,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)'
                e.currentTarget.style.color = branding.colors.textHeading
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = branding.colors.textMuted
              }}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false)
                router.push('/profile')
              }}
              className="w-full flex items-center space-x-3 px-4 py-2.5 transition-all"
              style={{
                color: branding.colors.textMuted,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)'
                e.currentTarget.style.color = branding.colors.textHeading
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = branding.colors.textMuted
              }}
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Profile</span>
            </button>

            <div
              className="my-2 mx-4 h-px"
              style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            />

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center space-x-3 px-4 py-2.5 transition-all"
              style={{
                color: isSigningOut ? branding.colors.textMuted : branding.colors.textMuted,
                opacity: isSigningOut ? 0.6 : 1,
                cursor: isSigningOut ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isSigningOut) {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                  e.currentTarget.style.color = '#ef4444'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSigningOut) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = branding.colors.textMuted
                }
              }}
            >
              <LogOut className={`w-4 h-4 ${isSigningOut ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
