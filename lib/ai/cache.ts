// Response Caching Implementation

import { CACHE_CONFIG } from './config'
import { createSupabaseClient } from '../supabase-server'

interface CacheEntry {
  key: string
  value: string
  expiresAt: Date
  hits: number
}

// In-memory cache for fast access
const memoryCache = new Map<string, CacheEntry>()

export async function getCachedResponse(key: string): Promise<string | null> {
  // Check memory cache first
  const memEntry = memoryCache.get(key)
  if (memEntry && memEntry.expiresAt > new Date()) {
    memEntry.hits++
    return memEntry.value
  }
  
  // Check database cache
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('ai_cache')
    .select('*')
    .eq('key', key)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (error || !data) {
    return null
  }
  
  // Update hit count
  await supabase
    .from('ai_cache')
    .update({ hits: data.hits + 1 })
    .eq('key', key)
  
  // Store in memory cache for faster subsequent access
  memoryCache.set(key, {
    key: data.key,
    value: data.value,
    expiresAt: new Date(data.expires_at),
    hits: data.hits + 1
  })
  
  return data.value
}

export async function setCachedResponse(key: string, value: string): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_CONFIG.ttl * 1000)
  
  // Store in memory cache
  memoryCache.set(key, {
    key,
    value,
    expiresAt,
    hits: 0
  })
  
  // Limit memory cache size
  if (memoryCache.size > CACHE_CONFIG.maxSize) {
    const oldestKey = memoryCache.keys().next().value
    if (oldestKey) {
      memoryCache.delete(oldestKey)
    }
  }
  
  // Store in database
  const supabase = createSupabaseClient()
  await supabase
    .from('ai_cache')
    .upsert({
      key,
      value,
      expires_at: expiresAt.toISOString(),
      hits: 0,
      created_at: new Date().toISOString()
    })
}

export async function invalidateCache(pattern?: string): Promise<void> {
  // Clear memory cache
  if (pattern) {
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key)
      }
    }
  } else {
    memoryCache.clear()
  }
  
  // Clear database cache
  const supabase = createSupabaseClient()
  if (pattern) {
    await supabase
      .from('ai_cache')
      .delete()
      .like('key', `%${pattern}%`)
  } else {
    await supabase
      .from('ai_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
  }
}

// Clean up expired entries periodically
setInterval(async () => {
  const now = new Date()
  
  // Clean memory cache
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key)
    }
  }
  
  // Clean database cache
  const supabase = createSupabaseClient()
  await supabase
    .from('ai_cache')
    .delete()
    .lt('expires_at', now.toISOString())
}, 300000) // Run every 5 minutes

export function generateCacheKey(params: Record<string, any>): string {
  const sorted = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|')
  
  // Simple hash function for shorter keys
  let hash = 0
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return `cache:${hash.toString(36)}`
}