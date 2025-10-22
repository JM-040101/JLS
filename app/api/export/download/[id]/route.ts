import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import JSZip from 'jszip'

// GET /api/export/download/[id] - Download completed export as ZIP
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

    // Fetch completed export
    const { data: exportRecord, error } = await supabase
      .from('exports')
      .select('id, status, files')
      .eq('id', exportId)
      .single()

    if (error || !exportRecord) {
      console.error('[EXPORT-DOWNLOAD] Export not found:', exportId, error)
      return NextResponse.json({
        error: 'Export not found'
      }, { status: 404 })
    }

    if (exportRecord.status !== 'completed') {
      console.error('[EXPORT-DOWNLOAD] Export not completed:', exportRecord.status)
      return NextResponse.json({
        error: `Export is not ready. Current status: ${exportRecord.status}`
      }, { status: 400 })
    }

    if (!exportRecord.files) {
      console.error('[EXPORT-DOWNLOAD] No files in export')
      return NextResponse.json({
        error: 'Export has no files'
      }, { status: 500 })
    }

    console.log('[EXPORT-DOWNLOAD] Creating ZIP for export:', exportId)

    // Create ZIP file
    const zipBuffer = await createZip(exportRecord.files)
    const uint8Array = new Uint8Array(zipBuffer)

    console.log('[EXPORT-DOWNLOAD] ZIP created successfully, size:', uint8Array.length, 'bytes')

    // Return ZIP file
    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="saas-blueprint.zip"',
        'Content-Length': uint8Array.length.toString()
      }
    })

  } catch (error) {
    console.error('[EXPORT-DOWNLOAD] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to download export' },
      { status: 500 }
    )
  }
}

async function createZip(files: {
  readme: string
  claude: string
  userInstructions: string
  quickStart?: string
  modules: Record<string, string>
  prompts: Record<string, string>
}) {
  const zip = new JSZip()

  // Add main files in order
  if (files.userInstructions) {
    zip.file('USER_INSTRUCTIONS.md', files.userInstructions)
    console.log(`[CREATE-ZIP] Added USER_INSTRUCTIONS.md (${files.userInstructions.length} chars)`)
  }
  if (files.readme) {
    zip.file('README.md', files.readme)
    console.log(`[CREATE-ZIP] Added README.md (${files.readme.length} chars)`)
  }
  if (files.claude) {
    zip.file('CLAUDE.md', files.claude)
    console.log(`[CREATE-ZIP] Added CLAUDE.md (${files.claude.length} chars)`)
  }
  if (files.quickStart) {
    zip.file('QUICK_START.md', files.quickStart)
    console.log(`[CREATE-ZIP] Added QUICK_START.md (${files.quickStart.length} chars)`)
  }

  // Add modules folder with nested structure (modules/auth/README.md)
  if (Object.keys(files.modules).length > 0) {
    const sortedModules = Object.entries(files.modules).sort(([a], [b]) => a.localeCompare(b))
    for (const [name, content] of sortedModules) {
      // Create nested folder structure: modules/auth/README.md
      const moduleFolder = zip.folder('modules')?.folder(name)
      moduleFolder?.file('README.md', content)
      console.log(`[CREATE-ZIP] Added modules/${name}/README.md (${content.length} chars)`)
    }
    console.log(`[CREATE-ZIP] Total module folders: ${sortedModules.length}`)
  }

  // Add prompts folder
  if (Object.keys(files.prompts).length > 0) {
    const promptsFolder = zip.folder('prompts')
    const sortedPrompts = Object.entries(files.prompts).sort(([a], [b]) => {
      const aNum = parseInt(a.match(/^\d+/)?.[0] || '999')
      const bNum = parseInt(b.match(/^\d+/)?.[0] || '999')
      return aNum - bNum
    })
    for (const [name, content] of sortedPrompts) {
      promptsFolder?.file(`${name}.md`, content)
      console.log(`[CREATE-ZIP] Added prompts/${name}.md (${content.length} chars)`)
    }
    console.log(`[CREATE-ZIP] Total prompt files: ${sortedPrompts.length}`)
  }

  console.log('[CREATE-ZIP] ZIP structure created successfully')
  return await zip.generateAsync({ type: 'arraybuffer' })
}
