// Main Export Generation API

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ExportOrchestrator } from '@/lib/export/orchestrator'
import { ExportRequest } from '@/lib/export/types'

export const maxDuration = 60 // Allow up to 60 seconds for export generation

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check export limit based on tier
    const { canExport } = await import('@/lib/subscription')
    const exportCheck = await canExport(user.id)

    if (!exportCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Export limit reached',
          message: exportCheck.reason,
          currentCount: exportCheck.currentCount,
          limit: exportCheck.limit,
          upgradeRequired: true
        },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { sessionId, format = 'zip' } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Create export request
    const exportRequest: ExportRequest = {
      sessionId,
      userId: user.id,
      format: format as 'zip' | 'json' | 'markdown',
      includePrompts: body.includePrompts !== false,
      includeDocumentation: body.includeDocumentation !== false,
      version: body.version
    }

    // Generate export using orchestrator
    const orchestrator = new ExportOrchestrator()
    const result = await orchestrator.exportSession(exportRequest)

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Export generation failed',
          validation: result.validation 
        },
        { status: 400 }
      )
    }

    // Log successful export
    await logExportGeneration(user.id, sessionId, result)

    return NextResponse.json({
      success: true,
      exportId: result.exportId,
      downloadUrl: result.downloadUrl,
      size: result.size,
      version: result.version,
      message: 'Export generated successfully'
    })

  } catch (error: any) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate export', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      // List all exports for user
      const { data: exports } = await supabase
        .from('exports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      return NextResponse.json({
        exports: exports || [],
        total: exports?.length || 0
      })
    }

    // Get specific session export history
    const orchestrator = new ExportOrchestrator()
    const history = await orchestrator.getExportHistory(sessionId)

    // Verify session ownership
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({
      sessionId,
      history,
      latestVersion: history[0]?.version || null
    })

  } catch (error: any) {
    console.error('Export GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exports' },
      { status: 500 }
    )
  }
}

async function logExportGeneration(
  userId: string,
  sessionId: string,
  result: any
): Promise<void> {
  try {
    const supabase = createSupabaseServerClient()
    
    await supabase
      .from('export_logs')
      .insert({
        user_id: userId,
        session_id: sessionId,
        version: result.version,
        size: result.size,
        status: 'success',
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging export:', error)
  }
}