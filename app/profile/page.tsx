import { requireAuth } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Calendar, Shield } from 'lucide-react'
import UserMenu from '@/components/auth/user-menu'

export default async function ProfilePage() {
  const user = await requireAuth()
  const supabase = createSupabaseServerClient()

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_admin === true || profile?.role === 'admin' || profile?.role === 'superadmin'

  return (
    <div className="min-h-screen bg-gradient-to-b from-blueprint-navy-50 to-white">
      {/* Header */}
      <header className="border-b border-blueprint-navy-100 bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 text-blueprint-navy-600 hover:text-blueprint-navy-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <UserMenu />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blueprint-navy-900 mb-2">
            Profile
          </h1>
          <p className="text-blueprint-navy-600">
            View and manage your account information
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blueprint-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {user.email?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-blueprint-navy-900">
                {profile?.full_name || 'User'}
              </h2>
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                  <Shield className="w-3 h-3 mr-1" />
                  {profile?.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-blueprint-navy-100 pt-6 space-y-4">
            {/* Email */}
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-blueprint-navy-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blueprint-navy-600">Email Address</p>
                <p className="text-blueprint-navy-900">{user.email}</p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-blueprint-navy-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blueprint-navy-600">Member Since</p>
                <p className="text-blueprint-navy-900">
                  {new Date(profile?.created_at || user.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Account Status */}
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-blueprint-navy-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blueprint-navy-600">Account Status</p>
                <p className="text-blueprint-navy-900">
                  {profile?.subscription_status === 'active' || isAdmin ? (
                    <span className="text-green-600 font-medium">Active Pro</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Free Tier</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-blueprint-navy-100 pt-6">
            <Link
              href="/settings"
              className="btn-primary inline-block"
            >
              Edit Profile Settings
            </Link>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">Admin Access</h3>
            <p className="text-sm text-purple-700 mb-3">
              You have administrative privileges on this account.
            </p>
            <Link href="/admin" className="btn-secondary text-sm">
              Go to Admin Panel
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
