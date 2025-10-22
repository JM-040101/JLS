'use server'

import { requireAuth, updateProfile } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateUserName(formData: FormData) {
  try {
    const user = await requireAuth()
    const fullName = formData.get('full_name') as string

    if (!fullName || fullName.trim().length === 0) {
      return { success: false, error: 'Name cannot be empty' }
    }

    await updateProfile(user.id, { full_name: fullName.trim() })
    revalidatePath('/dashboard/settings')

    return { success: true }
  } catch (error) {
    console.error('Failed to update name:', error)
    return { success: false, error: 'Failed to update name' }
  }
}

export async function updatePassword(formData: FormData) {
  try {
    const user = await requireAuth()
    const currentPassword = formData.get('current_password') as string
    const newPassword = formData.get('new_password') as string
    const confirmPassword = formData.get('confirm_password') as string

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, error: 'All fields are required' }
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'New passwords do not match' }
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' }
    }

    const supabase = createSupabaseServerClient()

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to update password:', error)
    return { success: false, error: 'Failed to update password' }
  }
}
