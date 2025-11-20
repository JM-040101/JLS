// Backfill completed_phases for all sessions based on actual completed answers
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function backfillCompletedPhases() {
  console.log('🔄 Starting backfill of completed_phases...\n')

  // Get all sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, app_description, completed_phases')
    .order('created_at', { ascending: false })

  if (sessionsError) {
    console.error('❌ Error fetching sessions:', sessionsError)
    return
  }

  console.log(`📊 Found ${sessions.length} sessions to process\n`)

  let updatedCount = 0
  let unchangedCount = 0

  for (const session of sessions) {
    // Get the full session data including current_phase
    const { data: fullSession, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session.id)
      .single()

    if (sessionError || !fullSession) {
      console.error(`❌ Error fetching session ${session.id}:`, sessionError)
      continue
    }

    // Count unique phases that have answers
    const { data: answeredPhases, error: answersError } = await supabase
      .from('answers')
      .select('phase_number')
      .eq('session_id', session.id)

    if (answersError) {
      console.error(`❌ Error fetching answers for session ${session.id}:`, answersError)
      continue
    }

    // Get unique phase numbers that have been answered
    const uniquePhases = new Set(answeredPhases?.map(a => a.phase_number) || [])
    const actualCompletedPhases = uniquePhases.size
    const currentCompletedPhases = fullSession.completed_phases || 0

    if (actualCompletedPhases !== currentCompletedPhases) {
      // Update the session
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          completed_phases: actualCompletedPhases,
          status: actualCompletedPhases === 12 ? 'completed' : 'in_progress'
        })
        .eq('id', session.id)

      if (updateError) {
        console.error(`❌ Error updating session ${session.id}:`, updateError)
        continue
      }

      console.log(`✅ Updated "${session.app_description.substring(0, 50)}..."`)
      console.log(`   Old: ${currentCompletedPhases} phases → New: ${actualCompletedPhases} phases`)
      console.log(`   Current phase: ${fullSession.current_phase}\n`)
      updatedCount++
    } else {
      unchangedCount++
    }
  }

  console.log('\n✨ Backfill complete!')
  console.log(`   Updated: ${updatedCount} sessions`)
  console.log(`   Unchanged: ${unchangedCount} sessions`)
}

backfillCompletedPhases().catch(console.error)
