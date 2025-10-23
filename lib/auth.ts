import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server'
import type { Database } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  subscription_id: string | null
}

/**
 * Get the current authenticated user with profile data
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createSupabaseServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return null
  }

  // Fetch profile data
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (error || !profile) {
    // Create profile if it doesn't exist
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: session.user.id,
        email: session.user.email!,
        full_name: session.user.user_metadata?.full_name || null,
      })
      .select()
      .single()

    return newProfile ? {
      id: newProfile.id,
      email: newProfile.email,
      full_name: newProfile.full_name,
      subscription_status: newProfile.subscription_status as AuthUser['subscription_status'],
      subscription_id: newProfile.subscription_id,
    } : null
  }

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    subscription_status: profile.subscription_status as AuthUser['subscription_status'],
    subscription_id: profile.subscription_id,
  }
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.subscription_status === 'active'
}

/**
 * Require authentication or redirect to sign-in
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/sign-in')
  }
  
  return user
}

/**
 * Require active subscription or redirect to pricing
 */
export async function requireSubscription() {
  const user = await requireAuth()

  // Use checkSubscriptionAccess which handles admin bypass
  const { checkSubscriptionAccess } = await import('@/lib/subscription')
  const subscriptionCheck = await checkSubscriptionAccess(user.id)

  if (!subscriptionCheck.hasAccess) {
    redirect('/pricing')
  }

  return user
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/')
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: {
  full_name?: string
  subscription_status?: AuthUser['subscription_status']
  subscription_id?: string
}) {
  const supabase = createSupabaseServiceClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  return data
}

/**
 * Create a new workflow session
 */
export async function createWorkflowSession(appDescription: string) {
  const user = await requireSubscription()
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      app_description: appDescription,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }

  return data
}

/**
 * Get user's workflow sessions with export status
 */
export async function getUserSessions() {
  const user = await requireAuth()
  const supabase = createSupabaseServerClient()

  // Get sessions
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`)
  }

  // Get export history for these sessions
  const sessionIds = sessions?.map(s => s.id) || []
  const { data: exports } = await supabase
    .from('export_history')
    .select('session_id, created_at')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: false })

  // Create a map of session_id to latest export date
  const exportMap = new Map()
  exports?.forEach(exp => {
    if (!exportMap.has(exp.session_id)) {
      exportMap.set(exp.session_id, exp.created_at)
    }
  })

  // Add export info to sessions
  const sessionsWithExports = sessions?.map(session => ({
    ...session,
    last_exported: exportMap.get(session.id) || null,
    has_been_exported: exportMap.has(session.id),
  })) || []

  return sessionsWithExports
}