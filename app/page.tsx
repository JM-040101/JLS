import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/landing-page'

export default async function HomePage() {
  const supabase = createSupabaseServerClient()
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return <LandingPage />
}