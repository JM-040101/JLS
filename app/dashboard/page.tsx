import { requireAuth } from '@/lib/auth'
import { getUserSessions } from '@/lib/auth'
import { getSubscriptionDetails } from '@/lib/subscription'
import Link from 'next/link'
import { Plus, FileText, Clock, CheckCircle, Archive, TrendingUp } from 'lucide-react'
import UserMenu from '@/components/auth/user-menu'

export default async function DashboardPage() {
  const user = await requireAuth()
  const sessions = await getUserSessions()
  const subscriptionDetails = await getSubscriptionDetails(user.id)

  const inProgressSessions = sessions.filter(s => s.status === 'in_progress')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  // Check if user is admin (admins get full access without subscription)
  const isAdmin = user.is_admin === true || user.role === 'admin' || user.role === 'superadmin'
  const hasProAccess = user.subscription_status === 'active' || isAdmin

  return (
    <div className="min-h-screen bg-gradient-to-b from-blueprint-navy-50 to-white">
      {/* Header */}
      <header className="border-b border-blueprint-navy-100 bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blueprint-navy-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blueprint-navy-900">SaaS Blueprint</span>
          </div>
          <UserMenu />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blueprint-navy-900 mb-2">
            Welcome back, {user.full_name || 'Builder'}!
          </h1>
          <p className="text-blueprint-navy-600">
            Manage your SaaS blueprints and continue building your next big idea.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-blueprint-navy-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blueprint-navy-600">Total Blueprints</p>
                <p className="text-2xl font-bold text-blueprint-navy-900">
                  {subscriptionDetails?.statistics.totalBlueprints || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blueprint-cyan-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-blueprint-navy-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blueprint-navy-600">In Progress</p>
                <p className="text-2xl font-bold text-blueprint-navy-900">
                  {inProgressSessions.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-blueprint-navy-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blueprint-navy-600">Completed</p>
                <p className="text-2xl font-bold text-blueprint-navy-900">
                  {completedSessions.length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-blueprint-navy-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blueprint-navy-600">Member Since</p>
                <p className="text-lg font-bold text-blueprint-navy-900">
                  {subscriptionDetails?.memberSince || 'N/A'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blueprint-cyan-600" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        {hasProAccess ? (
          <div className="mb-8">
            <Link
              href="/workflow/new"
              className="inline-flex items-center btn-primary text-lg px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Blueprint
            </Link>
            {isAdmin && user.subscription_status !== 'active' && (
              <p className="text-sm text-blueprint-navy-600 mt-2">
                ✨ Admin access - unlimited blueprints
              </p>
            )}
          </div>
        ) : (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 mb-2">
              Upgrade to Pro to create unlimited blueprints
            </p>
            <Link href="/pricing" className="btn-primary">
              View Plans
            </Link>
          </div>
        )}

        {/* Sessions List */}
        <div>
          <h2 className="text-xl font-bold text-blueprint-navy-900 mb-4">Your Blueprints</h2>
          
          {sessions.length === 0 ? (
            <div className="bg-white rounded-lg border border-blueprint-navy-200 p-12 text-center">
              <FileText className="w-12 h-12 text-blueprint-navy-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blueprint-navy-900 mb-2">
                No blueprints yet
              </h3>
              <p className="text-blueprint-navy-600 mb-4">
                Start your first SaaS blueprint and transform your idea into reality
              </p>
              {hasProAccess && (
                <Link href="/workflow/new" className="btn-primary">
                  Create Your First Blueprint
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-lg border border-blueprint-navy-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blueprint-navy-900 mb-1">
                        {session.app_description}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-blueprint-navy-600">
                        <span className="flex items-center">
                          {session.status === 'in_progress' && (
                            <>
                              <Clock className="w-4 h-4 mr-1 text-yellow-600" />
                              In Progress
                            </>
                          )}
                          {session.status === 'completed' && (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                              Completed
                            </>
                          )}
                          {session.status === 'archived' && (
                            <>
                              <Archive className="w-4 h-4 mr-1 text-gray-600" />
                              Archived
                            </>
                          )}
                        </span>
                        <span>
                          Phase {session.completed_phases}/12
                        </span>
                        <span>
                          Created {new Date(session.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {session.status === 'in_progress' && (
                        <Link
                          href={`/workflow/${session.id}`}
                          className="btn-primary text-sm"
                        >
                          Continue
                        </Link>
                      )}
                      {session.status === 'completed' && (
                        <Link
                          href={`/export/${session.id}`}
                          className="btn-secondary text-sm"
                        >
                          Export
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="phase-progress">
                      <div 
                        className="phase-progress-bar"
                        style={{ width: `${(session.completed_phases / 12) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}