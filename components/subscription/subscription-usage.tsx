'use client'

import { BarChart3, FileText, HardDrive, Activity } from 'lucide-react'

interface SubscriptionUsageProps {
  usage: {
    sessionsThisMonth: number
    exportsThisMonth: number
    storageUsedMB: number
    lastActivityDate?: Date
  }
  limits: {
    canCreateBlueprint: boolean
    sessionsRemaining: number
    sessionsLimit: number
  }
}

export function SubscriptionUsage({ usage, limits }: SubscriptionUsageProps) {
  const sessionPercentage = ((limits.sessionsLimit - limits.sessionsRemaining) / limits.sessionsLimit) * 100
  const storagePercentage = (usage.storageUsedMB / 500) * 100 // 500MB limit

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Usage This Month</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Sessions Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Blueprint Sessions</span>
            </div>
            <span className="text-sm text-gray-600">
              {limits.sessionsLimit - limits.sessionsRemaining} / {limits.sessionsLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                sessionPercentage > 90 ? 'bg-red-500' : sessionPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(sessionPercentage, 100)}%` }}
            />
          </div>
          {sessionPercentage > 90 && (
            <p className="text-xs text-red-600 mt-1">
              You're approaching your session limit
            </p>
          )}
        </div>

        {/* Exports Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Exports Generated</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage.exportsThisMonth}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Unlimited exports with Pro plan
          </div>
        </div>

        {/* Storage Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <HardDrive className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Storage Used</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage.storageUsedMB.toFixed(2)} MB / 500 MB
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                storagePercentage > 90 ? 'bg-red-500' : storagePercentage > 75 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Last Activity */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Last Activity</span>
            </div>
            <span className="text-sm text-gray-600">
              {usage.lastActivityDate
                ? new Date(usage.lastActivityDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : 'No activity yet'
              }
            </span>
          </div>
        </div>

        {/* Usage Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Usage Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Sessions remaining</span>
              <span className="font-medium text-gray-900">{limits.sessionsRemaining}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Can create blueprints</span>
              <span className="font-medium text-gray-900">
                {limits.canCreateBlueprint ? 'Yes' : 'No (limit reached)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Billing cycle resets</span>
              <span className="font-medium text-gray-900">
                {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}