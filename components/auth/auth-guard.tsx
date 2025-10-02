'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from '@/components/ui/loading-spinner'

interface AuthGuardProps {
  children: React.ReactNode
  requireSubscription?: boolean
  fallbackUrl?: string
}

export default function AuthGuard({ 
  children, 
  requireSubscription = false,
  fallbackUrl = '/auth/sign-in'
}: AuthGuardProps) {
  const { user, session, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) {
      router.push(fallbackUrl)
    }
    // TODO: Add subscription status check by fetching profile data
  }, [loading, session, fallbackUrl, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}