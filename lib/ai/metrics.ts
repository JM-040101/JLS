// AI Metrics and Cost Tracking

import { AIMetrics } from './types'
import { createSupabaseServerClient } from '../supabase-server'

export async function logMetrics(metrics: AIMetrics): Promise<void> {
  try {
    const supabase = createSupabaseServerClient()
    
    const { error } = await supabase
      .from('ai_metrics')
      .insert({
        user_id: metrics.userId,
        session_id: metrics.sessionId,
        model: metrics.model,
        input_tokens: metrics.inputTokens,
        output_tokens: metrics.outputTokens,
        cost: metrics.cost,
        latency: metrics.latency,
        success: metrics.success,
        error: metrics.error,
        created_at: metrics.timestamp
      })

    if (error) {
      console.error('Failed to log AI metrics:', error)
    }
  } catch (error) {
    console.error('Error logging AI metrics:', error)
  }
}

export async function getUserUsage(userId: string, period: 'day' | 'month'): Promise<{
  totalCost: number
  totalTokens: number
  requestCount: number
  successRate: number
}> {
  const supabase = createSupabaseServerClient()
  
  const startDate = new Date()
  if (period === 'day') {
    startDate.setHours(0, 0, 0, 0)
  } else {
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)
  }

  const { data, error } = await supabase
    .from('ai_metrics')
    .select('cost, input_tokens, output_tokens, success')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())

  if (error || !data) {
    console.error('Failed to get user usage:', error)
    return {
      totalCost: 0,
      totalTokens: 0,
      requestCount: 0,
      successRate: 0
    }
  }

  const totalCost = data.reduce((sum, row) => sum + (row.cost || 0), 0)
  const totalTokens = data.reduce((sum, row) => sum + (row.input_tokens || 0) + (row.output_tokens || 0), 0)
  const requestCount = data.length
  const successCount = data.filter(row => row.success).length
  const successRate = requestCount > 0 ? (successCount / requestCount) * 100 : 0

  return {
    totalCost,
    totalTokens,
    requestCount,
    successRate
  }
}

export async function getSessionMetrics(sessionId: string): Promise<{
  phases: number[]
  totalCost: number
  totalTime: number
  averageLatency: number
}> {
  const supabase = createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('ai_metrics')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error || !data || data.length === 0) {
    return {
      phases: [],
      totalCost: 0,
      totalTime: 0,
      averageLatency: 0
    }
  }

  const phases = Array.from(new Set(data.map(m => m.phase_number).filter(Boolean)))
  const totalCost = data.reduce((sum, m) => sum + (m.cost || 0), 0)
  const firstTimestamp = new Date(data[0].created_at).getTime()
  const lastTimestamp = new Date(data[data.length - 1].created_at).getTime()
  const totalTime = (lastTimestamp - firstTimestamp) / 1000 // in seconds
  const averageLatency = data.reduce((sum, m) => sum + (m.latency || 0), 0) / data.length

  return {
    phases,
    totalCost,
    totalTime,
    averageLatency
  }
}