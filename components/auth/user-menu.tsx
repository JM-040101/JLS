'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { User, Settings, LogOut, CreditCard, FileText } from 'lucide-react'

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await fetch('/auth/sign-out', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  if (!user) return null

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-blueprint-navy-50 transition-colors"
      >
        <div className="w-8 h-8 bg-blueprint-cyan-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {user.email?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <span className="text-sm font-medium text-blueprint-navy-700 hidden md:block">
          {user.email}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-blueprint-navy-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-blueprint-navy-100">
            <p className="text-sm font-medium text-blueprint-navy-900">
              User
            </p>
            <p className="text-xs text-blueprint-navy-600 truncate">
              {user.email}
            </p>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center px-4 py-2 text-sm text-blueprint-navy-700 hover:bg-blueprint-navy-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <FileText className="w-4 h-4 mr-2" />
            My Blueprints
          </Link>

          <Link
            href="/profile"
            className="flex items-center px-4 py-2 text-sm text-blueprint-navy-700 hover:bg-blueprint-navy-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </Link>

          <Link
            href="/settings"
            className="flex items-center px-4 py-2 text-sm text-blueprint-navy-700 hover:bg-blueprint-navy-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>

          <Link
            href="/billing"
            className="flex items-center px-4 py-2 text-sm text-blueprint-navy-700 hover:bg-blueprint-navy-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Billing
          </Link>

          <div className="border-t border-blueprint-navy-100 mt-1">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}