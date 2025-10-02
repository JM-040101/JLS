import { createClient } from '@supabase/supabase-js'

export interface AdminUser {
  id: string
  email: string
  role: 'user' | 'admin' | 'superadmin'
  isAdmin: boolean
  permissions: Record<string, any>
  adminNotes?: string
}

export class AdminManager {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  /**
   * Check if the current user is an admin
   */
  async isAdmin(userId?: string): Promise<boolean> {
    try {
      let targetUserId = userId
      
      if (!targetUserId) {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) return false
        targetUserId = user.id
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', targetUserId)
        .single()

      if (error || !data) return false
      
      return data.is_admin === true || data.role === 'admin' || data.role === 'superadmin'
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  /**
   * Get admin user details
   */
  async getAdminDetails(userId?: string): Promise<AdminUser | null> {
    try {
      let targetUserId = userId
      
      if (!targetUserId) {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) return null
        targetUserId = user.id
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, email, role, is_admin, permissions, admin_notes')
        .eq('id', targetUserId)
        .single()

      if (error || !data) return null
      
      return {
        id: data.id,
        email: data.email,
        role: data.role,
        isAdmin: data.is_admin,
        permissions: data.permissions || {},
        adminNotes: data.admin_notes
      }
    } catch (error) {
      console.error('Error getting admin details:', error)
      return null
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(permission: string, userId?: string): Promise<boolean> {
    const adminDetails = await this.getAdminDetails(userId)
    if (!adminDetails) return false
    
    // Superadmins have all permissions
    if (adminDetails.role === 'superadmin') return true
    
    // Check specific permission
    return adminDetails.permissions[permission] === true
  }

  /**
   * Check if user has access to a feature
   */
  async hasFeatureAccess(featureName: string, userId?: string): Promise<boolean> {
    try {
      let targetUserId = userId
      
      if (!targetUserId) {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) return false
        targetUserId = user.id
      }

      // Check if admin (admins have all features)
      if (await this.isAdmin(targetUserId)) {
        return true
      }

      // Check feature flags
      const { data: feature } = await this.supabase
        .from('feature_flags')
        .select('enabled, admin_only, user_whitelist')
        .eq('name', featureName)
        .single()

      if (!feature) return true // Default open if feature flag doesn't exist
      
      if (feature.admin_only) return false
      if (feature.user_whitelist?.includes(targetUserId)) return true
      
      return feature.enabled
    } catch (error) {
      console.error('Error checking feature access:', error)
      return false
    }
  }

  /**
   * Get user's override settings
   */
  async getUserOverrides(userId: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await this.supabase
        .from('admin_overrides')
        .select('override_type, override_value')
        .eq('user_id', userId)
        .or('expires_at.is.null,expires_at.gt.now()')

      if (error || !data) return {}
      
      const overrides: Record<string, any> = {}
      data.forEach(row => {
        overrides[row.override_type] = row.override_value
      })
      
      return overrides
    } catch (error) {
      console.error('Error getting user overrides:', error)
      return {}
    }
  }

  /**
   * Log admin action for audit trail
   */
  async logAdminAction(
    action: string,
    resource?: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.supabase
        .from('admin_access_log')
        .insert({
          action,
          resource,
          resource_id: resourceId,
          metadata: metadata || {}
        })
    } catch (error) {
      console.error('Error logging admin action:', error)
    }
  }

  /**
   * Bypass subscription limits for admins
   */
  async getEffectiveLimits(userId: string): Promise<any> {
    // Check if admin
    if (await this.isAdmin(userId)) {
      return {
        blueprints: -1, // Unlimited
        exports: -1,
        storage: -1,
        aiCalls: -1,
        teamMembers: -1
      }
    }

    // Check for overrides
    const overrides = await this.getUserOverrides(userId)
    if (overrides.limits) {
      return overrides.limits
    }

    // Return default limits based on subscription
    // This would be fetched from subscription data
    return {
      blueprints: 1,
      exports: 3,
      storage: 100, // MB
      aiCalls: 100,
      teamMembers: 1
    }
  }

  /**
   * Promote user to admin (only superadmins can do this)
   */
  async promoteToAdmin(
    targetEmail: string,
    role: 'admin' | 'superadmin' = 'admin',
    promoterId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify promoter is superadmin
      const promoterDetails = await this.getAdminDetails(promoterId)
      if (!promoterDetails || promoterDetails.role !== 'superadmin') {
        return { success: false, error: 'Only superadmins can promote users' }
      }

      // Get target user
      const { data: targetUser } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', targetEmail)
        .single()

      if (!targetUser) {
        return { success: false, error: 'User not found' }
      }

      // Update user role
      const { error: updateError } = await this.supabase
        .from('profiles')
        .update({
          role,
          is_admin: true,
          upgraded_at: new Date().toISOString()
        })
        .eq('id', targetUser.id)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Log the action
      await this.logAdminAction(
        'user_promoted_to_admin',
        'profiles',
        targetUser.id,
        { email: targetEmail, role, promoted_by: promoterId }
      )

      return { success: true }
    } catch (error: any) {
      console.error('Error promoting user to admin:', error)
      return { success: false, error: error.message }
    }
  }
}

// Middleware helper for API routes
// NOTE: This function should be used in API routes (server-side only)
// Import createRouteHandlerClient and cookies in the API route file
export async function requireAdmin(
  supabaseClient: any,
  userId: string
): Promise<{ isAdmin: boolean; adminManager: AdminManager }> {
  const adminManager = new AdminManager(supabaseClient)

  // Check if user is admin
  const isAdmin = await adminManager.isAdmin(userId)

  return { isAdmin, adminManager }
}

// Hook for client-side admin checks
export function useAdmin() {
  // This would be implemented as a React hook
  // For now, returning a placeholder
  return {
    isAdmin: false,
    checkPermission: async (permission: string) => false,
    checkFeature: async (feature: string) => false
  }
}