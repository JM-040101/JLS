import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Special endpoint to set up james@martialmarketing.org as admin
// This should be run once after James registers

const JAMES_EMAIL = 'james@martialmarketing.org'

export async function POST(request: NextRequest) {
  try {
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // First, check if James exists in auth.users
    const { data: users, error: searchError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (searchError) {
      return NextResponse.json(
        { error: 'Failed to search users', details: searchError.message },
        { status: 500 }
      )
    }

    const jamesUser = users.users.find(u => u.email === JAMES_EMAIL)
    
    if (!jamesUser) {
      // James hasn't registered yet, create the account
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: JAMES_EMAIL,
        email_confirm: true,
        user_metadata: {
          full_name: 'James Admin',
          role: 'superadmin'
        }
      })

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create admin user', details: createError.message },
          { status: 500 }
        )
      }

      // Create profile for new user
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: JAMES_EMAIL,
          full_name: 'James Admin',
          role: 'superadmin',
          is_admin: true,
          permissions: {
            access_all_features: true,
            bypass_limits: true,
            manage_users: true,
            view_analytics: true,
            manage_billing: true,
            export_data: true,
            access_admin_panel: true,
            modify_system_settings: true
          },
          admin_notes: 'Primary system administrator - full access to all features and data',
          upgraded_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        return NextResponse.json(
          { error: 'Failed to create admin profile', details: profileError.message },
          { status: 500 }
        )
      }

      // Add unlimited overrides
      const overrides = [
        {
          user_id: newUser.user.id,
          override_type: 'subscription',
          override_value: {
            plan: 'unlimited',
            tier: 'superadmin',
            features: 'all',
            status: 'active',
            bypass_payment: true
          },
          reason: 'System administrator privileges',
          created_by: newUser.user.id
        },
        {
          user_id: newUser.user.id,
          override_type: 'limits',
          override_value: {
            blueprints: -1,
            exports: -1,
            storage: -1,
            ai_calls: -1,
            team_members: -1,
            api_requests: -1
          },
          reason: 'Unlimited admin access',
          created_by: newUser.user.id
        },
        {
          user_id: newUser.user.id,
          override_type: 'features',
          override_value: {
            all_features: true,
            beta_access: true,
            experimental: true,
            admin_tools: true,
            developer_mode: true
          },
          reason: 'Full feature access for admin',
          created_by: newUser.user.id
        }
      ]

      for (const override of overrides) {
        const { error } = await supabaseAdmin
          .from('admin_overrides')
          .upsert(override, { onConflict: 'user_id,override_type' })
        
        if (error) {
          console.error('Failed to create override:', override.override_type, error)
        }
      }

      // Log the admin setup
      await supabaseAdmin
        .from('admin_access_log')
        .insert({
          admin_id: newUser.user.id,
          action: 'admin_account_created',
          resource: 'profiles',
          resource_id: newUser.user.id,
          metadata: {
            email: JAMES_EMAIL,
            role: 'superadmin',
            method: 'api_setup'
          }
        })

      return NextResponse.json({
        success: true,
        message: `Admin account created for ${JAMES_EMAIL}`,
        userId: newUser.user.id,
        instructions: 'A password reset link will be sent to complete account setup'
      })

    } else {
      // James exists, update to admin
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: jamesUser.id,
          email: JAMES_EMAIL,
          role: 'superadmin',
          is_admin: true,
          permissions: {
            access_all_features: true,
            bypass_limits: true,
            manage_users: true,
            view_analytics: true,
            manage_billing: true,
            export_data: true,
            access_admin_panel: true,
            modify_system_settings: true
          },
          admin_notes: 'Primary system administrator - full access to all features and data',
          upgraded_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update user to admin', details: updateError.message },
          { status: 500 }
        )
      }

      // Add/update unlimited overrides
      const overrides = [
        {
          user_id: jamesUser.id,
          override_type: 'subscription',
          override_value: {
            plan: 'unlimited',
            tier: 'superadmin',
            features: 'all',
            status: 'active',
            bypass_payment: true
          },
          reason: 'System administrator privileges',
          created_by: jamesUser.id
        },
        {
          user_id: jamesUser.id,
          override_type: 'limits',
          override_value: {
            blueprints: -1,
            exports: -1,
            storage: -1,
            ai_calls: -1,
            team_members: -1,
            api_requests: -1
          },
          reason: 'Unlimited admin access',
          created_by: jamesUser.id
        },
        {
          user_id: jamesUser.id,
          override_type: 'features',
          override_value: {
            all_features: true,
            beta_access: true,
            experimental: true,
            admin_tools: true,
            developer_mode: true
          },
          reason: 'Full feature access for admin',
          created_by: jamesUser.id
        }
      ]

      for (const override of overrides) {
        const { error } = await supabaseAdmin
          .from('admin_overrides')
          .upsert(override, { onConflict: 'user_id,override_type' })
        
        if (error) {
          console.error('Failed to create override:', override.override_type, error)
        }
      }

      // Log the admin upgrade
      await supabaseAdmin
        .from('admin_access_log')
        .insert({
          admin_id: jamesUser.id,
          action: 'user_upgraded_to_admin',
          resource: 'profiles', 
          resource_id: jamesUser.id,
          metadata: {
            email: JAMES_EMAIL,
            role: 'superadmin',
            method: 'api_setup'
          }
        })

      return NextResponse.json({
        success: true,
        message: `${JAMES_EMAIL} has been upgraded to superadmin`,
        userId: jamesUser.id
      })
    }

  } catch (error: any) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup admin', details: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to check admin status
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if James exists and is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, is_admin, permissions, admin_notes')
      .eq('email', JAMES_EMAIL)
      .single()

    if (!profile) {
      return NextResponse.json({
        exists: false,
        isAdmin: false,
        message: `${JAMES_EMAIL} is not registered yet`
      })
    }

    return NextResponse.json({
      exists: true,
      isAdmin: profile.is_admin,
      role: profile.role,
      permissions: profile.permissions,
      adminNotes: profile.admin_notes,
      message: profile.is_admin 
        ? `${JAMES_EMAIL} is a ${profile.role}` 
        : `${JAMES_EMAIL} is registered but not an admin`
    })

  } catch (error: any) {
    console.error('Admin check error:', error)
    return NextResponse.json(
      { error: 'Failed to check admin status', details: error.message },
      { status: 500 }
    )
  }
}