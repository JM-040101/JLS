import { requireAuth } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { ArrowLeft, User, Bell, Shield, Trash2 } from 'lucide-react'
import UserMenu from '@/components/auth/user-menu'

export default async function SettingsPage() {
  const user = await requireAuth()
  const supabase = createSupabaseServerClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

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

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blueprint-navy-900 mb-2">
            Settings
          </h1>
          <p className="text-blueprint-navy-600">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-blueprint-navy-600" />
              <h2 className="text-xl font-semibold text-blueprint-navy-900">
                Profile Information
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blueprint-navy-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue={profile?.full_name || ''}
                  className="w-full px-4 py-2 border border-blueprint-navy-200 rounded-lg focus:ring-2 focus:ring-blueprint-cyan-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  disabled
                />
                <p className="text-xs text-blueprint-navy-500 mt-1">
                  Profile editing coming soon
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-blueprint-navy-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  className="w-full px-4 py-2 border border-blueprint-navy-200 rounded-lg bg-gray-50"
                  disabled
                />
                <p className="text-xs text-blueprint-navy-500 mt-1">
                  Email cannot be changed
                </p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-5 h-5 text-blueprint-navy-600" />
              <h2 className="text-xl font-semibold text-blueprint-navy-900">
                Notifications
              </h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blueprint-cyan-600 border-blueprint-navy-300 rounded focus:ring-blueprint-cyan-500"
                  defaultChecked
                  disabled
                />
                <span className="text-sm text-blueprint-navy-700">
                  Email notifications for blueprint completion
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blueprint-cyan-600 border-blueprint-navy-300 rounded focus:ring-blueprint-cyan-500"
                  defaultChecked
                  disabled
                />
                <span className="text-sm text-blueprint-navy-700">
                  Product updates and announcements
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blueprint-cyan-600 border-blueprint-navy-300 rounded focus:ring-blueprint-cyan-500"
                  disabled
                />
                <span className="text-sm text-blueprint-navy-700">
                  Weekly digest of blueprints
                </span>
              </label>

              <p className="text-xs text-blueprint-navy-500 mt-3">
                Notification preferences coming soon
              </p>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg border border-blueprint-navy-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-blueprint-navy-600" />
              <h2 className="text-xl font-semibold text-blueprint-navy-900">
                Security
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-blueprint-navy-800 mb-2">Password</h3>
                <button
                  className="btn-secondary text-sm"
                  disabled
                >
                  Change Password
                </button>
                <p className="text-xs text-blueprint-navy-500 mt-1">
                  Password management coming soon
                </p>
              </div>

              <div>
                <h3 className="font-medium text-blueprint-navy-800 mb-2">Sessions</h3>
                <p className="text-sm text-blueprint-navy-600 mb-2">
                  Signed in on this device
                </p>
                <button
                  className="btn-secondary text-sm"
                  disabled
                >
                  Sign Out All Devices
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg border border-red-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Trash2 className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-semibold text-red-900">
                Danger Zone
              </h2>
            </div>

            <p className="text-sm text-blueprint-navy-600 mb-4">
              Once you delete your account, there is no going back. All your blueprints and data will be permanently deleted.
            </p>

            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              disabled
            >
              Delete Account
            </button>
            <p className="text-xs text-blueprint-navy-500 mt-1">
              Account deletion coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
