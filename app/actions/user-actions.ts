'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CombinedUser, UserRole, UserStatus } from '@/types/user'
import { revalidatePath } from 'next/cache'

export async function getUsersAction(): Promise<CombinedUser[]> {
  const adminSupabase = createAdminClient()

  // 1. Fetch all data in parallel to avoid waterfalls
  const [profilesRes, gamificationRes, authRes, subsRes] = await Promise.all([
    adminSupabase
      .from('user_profiles')
      .select('user_id, role, status, created_at')
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('gamification_profiles')
      .select('user_id, xp, level, current_streak'),
    adminSupabase.rpc('get_auth_users_data'),
    adminSupabase
      .from('subscriptions')
      .select('user_id, plan_id')
      .eq('status', 'settlement')
      .gt('current_period_end', new Date().toISOString())
  ])

  if (profilesRes.error) throw new Error(profilesRes.error.message)
  
  if (gamificationRes.error) console.warn('Gamification data fetch failed:', gamificationRes.error.message)
  if (authRes.error) console.warn('Auth data RPC failed:', authRes.error.message)
  if (subsRes.error) console.warn('Subscriptions data fetch failed:', subsRes.error.message)

  const gamificationMap = new Map<string, { xp: number; level: number; current_streak: number }>((gamificationRes.data || []).map((g: { user_id: string; xp: number; level: number; current_streak: number }) => [g.user_id, g]))
  const authMap = new Map<string, { email: string; full_name: string }>((authRes.data || []).map((u: { id: string; email: string; full_name: string }) => [u.id, u]))
  const activeSubsMap = new Map<string, string>((subsRes.data || []).map((s: { user_id: string; plan_id: string }) => [s.user_id, s.plan_id]))

  const users: CombinedUser[] = (profilesRes.data || []).map((profile: { user_id: string; role: UserRole; status: UserStatus; created_at: string }) => {
    const authData = authMap.get(profile.user_id)
    const gamificationData = gamificationMap.get(profile.user_id)
    
    return {
      user_id: profile.user_id,
      role: profile.role,
      status: profile.status,
      created_at: profile.created_at,
      email: authData?.email,
      display_name: authData?.full_name,
      plan: (activeSubsMap.get(profile.user_id) as 'free' | 'plus' | 'pro') || 'free',
      gamification: gamificationData || { xp: 0, level: 1, current_streak: 0 }
    }
  })

  return users
}

export async function adjustXpAction(targetUserId: string, xpAmount: number, reason: string) {
  const adminSupabase = createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  const { error: xpError } = await adminSupabase.rpc('increment_gamification_xp', {
    p_user_id: targetUserId,
    p_xp_amount: xpAmount
  })

  if (xpError) throw new Error(xpError.message)

  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: 'ADJUST_XP',
    details: {
      target_user_id: targetUserId,
      xp_added: xpAmount,
      reason: reason
    }
  })

  revalidatePath('/users')
  return { success: true }
}

export async function suspendUserAction(targetUserId: string, status: 'active' | 'suspended') {
  const adminSupabase = createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  const { error: updateError } = await adminSupabase
    .from('user_profiles')
    .update({ status })
    .eq('user_id', targetUserId)

  if (updateError) throw new Error(updateError.message)

  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
    details: { target_user_id: targetUserId }
  })

  revalidatePath('/users')
  return { success: true }
}

export async function deleteUserAction(targetUserId: string, reason: string) {
  const adminSupabase = createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  // Hard Protection: Self-Deletion
  if (admin.id === targetUserId) {
    throw new Error('Security Violation: You cannot delete your own account.')
  }

  // Hard Protection: Primary Admin Email
  const { data: targetUser } = await adminSupabase.auth.admin.getUserById(targetUserId)
  const protectedEmails = ['shawnanggara@gmail.com']
  
  if (targetUser?.user?.email && protectedEmails.includes(targetUser.user.email)) {
    throw new Error('System Protection: This primary admin account is protected and cannot be deleted.')
  }

  // 1. Permanent Delete from Auth
  const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(targetUserId)

  if (deleteError) {
    console.error('[CRITICAL] Supabase Auth Delete Failure:', {
        userId: targetUserId,
        error: deleteError,
        message: deleteError.message
    })
    
    // Pass raw message to frontend for accurate debugging
    throw new Error(`Deletion Failed: ${deleteError.message}`)
  }

  // 2. Log Audit
  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: 'HARD_DELETE_USER',
    details: {
      target_user_id: targetUserId,
      reason: reason,
      compliance: 'PDP_RIGHT_TO_BE_FORGOTTEN'
    }
  })

  revalidatePath('/users')
  return { success: true }
}

export async function bulkSuspendUsersAction(targetUserIds: string[], status: 'active' | 'suspended') {
  const adminSupabase = createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  const { error: updateError } = await adminSupabase
    .from('user_profiles')
    .update({ status })
    .in('user_id', targetUserIds)

  if (updateError) throw new Error(updateError.message)

  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: status === 'suspended' ? 'BULK_SUSPEND' : 'BULK_ACTIVATE',
    details: { 
        count: targetUserIds.length,
        user_ids: targetUserIds 
    }
  })

  revalidatePath('/users')
  return { success: true }
}

export async function bulkDeleteUsersAction(targetUserIds: string[], reason: string) {
  const adminSupabase = createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  // Prevent self-deletion and primary admin deletion in bulk
  if (targetUserIds.includes(admin.id)) {
    throw new Error('Security Violation: Bulk deletion contains your own account.')
  }

  // 1. Iterate and delete from Auth with granular error handling
  const results = await Promise.all(
    targetUserIds.map(async (userId) => {
      try {
        // Additional protection inside loop
        const { data: tUser } = await adminSupabase.auth.admin.getUserById(userId)
        const protectedEmails = ['shawnanggara@gmail.com']
        
        if (tUser?.user?.email && protectedEmails.includes(tUser.user.email)) {
             return { userId, success: false, error: 'System Protected Account' }
        }

        const { error } = await adminSupabase.auth.admin.deleteUser(userId)

        if (error) {
          return {
            userId,
            success: false,
            error: error.message,
          }
        }

        return {
          userId,
          success: true,
          error: null,
        }
      } catch (error) {
        return {
          userId,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    })
  )
  
  const failures = results.filter((result) => !result.success)

  if (failures.length > 0) {
    console.error('[CRITICAL] Bulk delete failures:', failures)
    const errorDetails = failures.map(f => `${f.userId}: ${f.error}`).join(' | ')
    throw new Error(
      `Partially failed: ${failures.length} users could not be removed. Details: ${errorDetails}`
    )
  }

  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: 'BULK_HARD_DELETE',
    details: {
      count: targetUserIds.length,
      user_ids: targetUserIds,
      reason: reason,
      compliance: 'PDP_RIGHT_TO_BE_FORGOTTEN'
    }
  })

  revalidatePath('/users')
  return { success: true }
}

export async function grantManualSubscriptionAction(targetUserId: string, planId: 'plus' | 'pro', durationDays: number, reason: string) {
  const adminSupabase = createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  const now = new Date()
  const endDate = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000))
  const orderId = `MANUAL-${targetUserId.substring(0,8)}-${now.getTime()}`

  const { error: insertError } = await adminSupabase
    .from('subscriptions')
    .insert({
      user_id: targetUserId,
      plan_id: planId,
      status: 'settlement',
      amount: 0, // Manual grants are free
      interval: 'manual',
      current_period_start: now.toISOString(),
      current_period_end: endDate.toISOString(),
      midtrans_order_id: orderId,
      payment_type: 'manual_grant'
    })

  if (insertError) throw new Error(`Failed to grant subscription: ${insertError.message}`)

  // Log Audit
  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: 'MANUAL_SUBSCRIPTION_GRANT',
    details: {
      target_user_id: targetUserId,
      plan_id: planId,
      duration_days: durationDays,
      reason: reason
    }
  })

  revalidatePath('/users')
  return { success: true }
}

export async function revokeSubscriptionAction(targetUserId: string, reason: string) {
  const adminSupabase = createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  const now = new Date().toISOString()

  const { error: updateError } = await adminSupabase
    .from('subscriptions')
    .update({ 
        status: 'cancel',
        current_period_end: now,
        updated_at: now
    })
    .eq('user_id', targetUserId)
    .eq('status', 'settlement')
    .gt('current_period_end', now)

  if (updateError) throw new Error(`Failed to revoke subscription: ${updateError.message}`)

  // Log Audit
  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: 'REVOKE_SUBSCRIPTION',
    details: {
      target_user_id: targetUserId,
      reason: reason
    }
  })

  revalidatePath('/users')
  return { success: true }
}
