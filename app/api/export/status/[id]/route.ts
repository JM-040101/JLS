import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// GET /api/export/status/[id] - Check export status WITHOUT creating new export
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const exportId = params.id

    if (!exportId) {
      return NextResponse.json({ error: 'Export ID required' }, { status: 400 })
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch export status (READ ONLY - never create new export)
    const { data: exportRecord, error } = await supabase
      .from('exports')
      .select('id, status, progress, progress_message, error_message, files, created_at, updated_at')
      .eq('id', exportId)
      .single()

    if (error || !exportRecord) {
      console.error('[EXPORT-STATUS] Export not found:', exportId, error)
      return NextResponse.json({
        error: 'Export not found',
        status: 'not_found'
      }, { status: 404 })
    }

    console.log('[EXPORT-STATUS] Export status:', exportRecord.id, 'Status:', exportRecord.status, 'Progress:', exportRecord.progress)

    // Return the current export status
    return NextResponse.json({
      id: exportRecord.id,
      status: exportRecord.status,
      progress: exportRecord.progress || 0,
      progress_message: exportRecord.progress_message,
      error_message: exportRecord.error_message,
      files: exportRecord.files,
      created_at: exportRecord.created_at,
      updated_at: exportRecord.updated_at
    }, { status: 200 })

  } catch (error) {
    console.error('[EXPORT-STATUS] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check export status' },
      { status: 500 }
    )
  }
}
