// Rate Limiting Implementation

import { RateLimitStatus } from './types'
import { RATE_LIMITS } from './config'
import { createSupabaseClient } from '../supabase-server'
import { redis } from '../redis' // Optional Redis for faster rate limiting

interface RateLimitEntry {
  requests: number
  windowStart: number
  tier: 'free' | 'pro' | 'enterprise'
}

// In-memory fallback for rate limiting
const inMemoryStore = new Map<string, RateLimitEntry>()

export async function checkRateLimit(userId: string): Promise<RateLimitStatus> {
  const tier = await getUserTier(userId)
  const limits = RATE_LIMITS[tier]
  const now = Date.now()
  
  // Try Redis first if available
  if (typeof redis !== 'undefined') {
    return checkRedisRateLimit(userId, limits, now)
  }
  
  // Fall back to database
  return checkDatabaseRateLimit(userId, limits, now, tier)
}

async function getUserTier(userId: string): Promise<'free' | 'pro' | 'enterprise'> {
  const supabase = createSupabaseClient()
  
  const { data } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .single()
  
  return data?.tier || 'free'
}

async function checkDatabaseRateLimit(
  userId: string,
  limits: typeof RATE_LIMITS['pro'],
  now: number,
  tier: 'free' | 'pro' | 'enterprise'
): Promise<RateLimitStatus> {
  const supabase = createSupabaseClient()
  
  // Check minute window
  const minuteAgo = new Date(now - 60000)
  const { data: minuteData, error: minuteError } = await supabase
    .from('ai_metrics')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', minuteAgo.toISOString())
  
  const minuteCount = minuteData?.length || 0
  
  if (minuteCount >= limits.requestsPerMinute) {
    return {
      remaining: 0,
      limit: limits.requestsPerMinute,
      resetAt: new Date(now + 60000),
      blocked: true
    }
  }
  
  // Check hour window
  const hourAgo = new Date(now - 3600000)
  const { data: hourData } = await supabase
    .from('ai_metrics')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', hourAgo.toISOString())
  
  const hourCount = hourData?.length || 0
  
  if (hourCount >= limits.requestsPerHour) {
    return {
      remaining: 0,
      limit: limits.requestsPerHour,
      resetAt: new Date(now + 3600000),
      blocked: true
    }
  }
  
  // Check day window
  const dayAgo = new Date(now - 86400000)
  const { data: dayData } = await supabase
    .from('ai_metrics')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', dayAgo.toISOString())
  
  const dayCount = dayData?.length || 0
  
  if (dayCount >= limits.requestsPerDay) {
    return {
      remaining: 0,
      limit: limits.requestsPerDay,
      resetAt: new Date(now + 86400000),
      blocked: true
    }
  }
  
  // Calculate remaining based on most restrictive limit
  const remaining = Math.min(
    limits.requestsPerMinute - minuteCount,
    limits.requestsPerHour - hourCount,
    limits.requestsPerDay - dayCount
  )
  
  return {
    remaining,
    limit: limits.requestsPerDay,
    resetAt: new Date(now + 86400000),
    blocked: false
  }
}

async function checkRedisRateLimit(
  userId: string,
  limits: typeof RATE_LIMITS['pro'],
  now: number
): Promise<RateLimitStatus> {
  // Redis implementation would go here
  // This is a placeholder for when Redis is configured
  
  const minuteKey = `rate:${userId}:minute`
  const hourKey = `rate:${userId}:hour`
  const dayKey = `rate:${userId}:day`
  
  // Check and increment counters with TTL
  // Return appropriate RateLimitStatus
  
  // For now, fall back to in-memory
  return checkInMemoryRateLimit(userId, limits, now)
}

function checkInMemoryRateLimit(
  userId: string,
  limits: typeof RATE_LIMITS['pro'],
  now: number
): Promise<RateLimitStatus> {
  const key = `rate:${userId}`
  const entry = inMemoryStore.get(key)
  
  // Reset if window expired (using minute window for simplicity)
  if (!entry || now - entry.windowStart > 60000) {
    inMemoryStore.set(key, {
      requests: 1,
      windowStart: now,
      tier: 'free'
    })
    
    return Promise.resolve({
      remaining: limits.requestsPerMinute - 1,
      limit: limits.requestsPerMinute,
      resetAt: new Date(now + 60000),
      blocked: false
    })
  }
  
  // Check if limit exceeded
  if (entry.requests >= limits.requestsPerMinute) {
    return Promise.resolve({
      remaining: 0,
      limit: limits.requestsPerMinute,
      resetAt: new Date(entry.windowStart + 60000),
      blocked: true
    })
  }
  
  // Increment counter
  entry.requests++
  inMemoryStore.set(key, entry)
  
  return Promise.resolve({
    remaining: limits.requestsPerMinute - entry.requests,
    limit: limits.requestsPerMinute,
    resetAt: new Date(entry.windowStart + 60000),
    blocked: false
  })
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of inMemoryStore.entries()) {
    if (now - entry.windowStart > 86400000) { // Remove entries older than 24 hours
      inMemoryStore.delete(key)
    }
  }
}, 3600000) // Run every hour