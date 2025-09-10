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
    if (!loading) {
      if (!session) {
        router.push(fallbackUrl)
      } else if (requireSubscription && user) {
        // Check subscription status
        if (user.subscription_status !== 'active') {
          router.push('/pricing')
        }
      }
    }
  }, [loading, session, user, requireSubscription, fallbackUrl, router])

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

  if (requireSubscription && user?.subscription_status !== 'active') {
    return null
  }

  return <>{children}</>
}