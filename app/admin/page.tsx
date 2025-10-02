'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AdminManager } from '@/lib/auth/admin'
import { Users, Activity, Settings, Database, FileText, TrendingUp, Shield, CreditCard } from 'lucide-react'

export default function AdminPanel() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adminData, setAdminData] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    checkAdminAccess()
    loadDashboardStats()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/sign-in')
        return
      }

      const adminManager = new AdminManager(supabase)
      const isUserAdmin = await adminManager.isAdmin(user.id)
      
      if (!isUserAdmin) {
        router.push('/dashboard')
        return
      }

      const adminDetails = await adminManager.getAdminDetails(user.id)
      setAdminData(adminDetails)
      setIsAdmin(true)
    } catch (error) {
      console.error('Admin access check failed:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    try {
      // Load various statistics
      const [users, sessions, exports, payments] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('sessions').select('id', { count: 'exact' }),
        supabase.from('exports').select('id', { count: 'exact' }),
        supabase.from('payment_history').select('id', { count: 'exact' })
      ])

      setStats({
        totalUsers: users.count || 0,
        totalSessions: sessions.count || 0,
        totalExports: exports.count || 0,
        totalPayments: payments.count || 0
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-500 mt-1">
                Logged in as: {adminData?.email} ({adminData?.role})
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={<Users className="h-6 w-6" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Active Sessions"
            value={stats?.totalSessions || 0}
            icon={<Activity className="h-6 w-6" />}
            color="bg-green-500"
          />
          <StatCard
            title="Exports Generated"
            value={stats?.totalExports || 0}
            icon={<FileText className="h-6 w-6" />}
            color="bg-purple-500"
          />
          <StatCard
            title="Total Payments"
            value={stats?.totalPayments || 0}
            icon={<CreditCard className="h-6 w-6" />}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* Admin Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminActionCard
            title="User Management"
            description="View and manage all users, roles, and permissions"
            icon={<Users className="h-8 w-8" />}
            onClick={() => router.push('/admin/users')}
          />
          <AdminActionCard
            title="System Settings"
            description="Configure system settings and feature flags"
            icon={<Settings className="h-8 w-8" />}
            onClick={() => router.push('/admin/settings')}
          />
          <AdminActionCard
            title="Database Manager"
            description="View and manage database records"
            icon={<Database className="h-8 w-8" />}
            onClick={() => router.push('/admin/database')}
          />
          <AdminActionCard
            title="Analytics Dashboard"
            description="View detailed analytics and metrics"
            icon={<TrendingUp className="h-8 w-8" />}
            onClick={() => router.push('/admin/analytics')}
          />
          <AdminActionCard
            title="Security Logs"
            description="View admin access logs and security events"
            icon={<Shield className="h-8 w-8" />}
            onClick={() => router.push('/admin/logs')}
          />
          <AdminActionCard
            title="Payment Management"
            description="Manage subscriptions and payment settings"
            icon={<CreditCard className="h-8 w-8" />}
            onClick={() => router.push('/admin/payments')}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Admin Privileges</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-700 font-medium">Role</span>
              <span className="text-gray-900 font-bold uppercase">{adminData?.role}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-700 font-medium">Admin Status</span>
              <span className="text-green-600 font-bold">Active</span>
            </div>
            <div className="py-3">
              <span className="text-gray-700 font-medium">Permissions</span>
              <div className="mt-3 space-y-2">
                {adminData?.permissions && Object.entries(adminData.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center">
                    <div className={`w-4 h-4 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'} mr-3`}></div>
                    <span className="text-sm text-gray-600">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {adminData?.adminNotes && (
              <div className="py-3 border-t">
                <span className="text-gray-700 font-medium">Admin Notes</span>
                <p className="text-sm text-gray-600 mt-2">{adminData.adminNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
        </div>
        <div className={`${color} text-white p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function AdminActionCard({ title, description, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left group"
    >
      <div className="flex items-start space-x-4">
        <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </button>
  )
}