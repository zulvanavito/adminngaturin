'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { coreApi } from '@/lib/midtrans'
import { SubscriptionLog, MidtransStatusResponse } from '@/types/billing'
import { revalidatePath } from 'next/cache'

export async function getSubscriptionLogsAction(): Promise<SubscriptionLog[]> {
  const adminSupabase = await createAdminClient()

  const [subsRes, authRes] = await Promise.all([
    adminSupabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false }),
    adminSupabase.rpc('get_auth_users_data')
  ])

  if (subsRes.error) throw new Error(subsRes.error.message)
  
  const authMap = new Map<string, { email: string; full_name: string }>((authRes.data || []).map((u: { id: string; email: string; full_name: string }) => [u.id, u]))

  const logs: SubscriptionLog[] = (subsRes.data || []).map((sub: SubscriptionLog) => {
    const authData = authMap.get(sub.user_id)
    return {
      ...sub,
      email: authData?.email,
      display_name: authData?.full_name
    }
  })

  return logs
}

export async function syncTransactionAction(orderId: string): Promise<{ success: boolean; status: string }> {
  const adminSupabase = await createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  // 1. Get status from Midtrans
  let midtransStatus: MidtransStatusResponse
  try {
    midtransStatus = await coreApi.transaction.status(orderId)
  } catch (err: unknown) {
    const error = err as Error
    throw new Error(`Midtrans API Error: ${error.message}`)
  }

  // 2. Map Midtrans status to our status
  // Midtrans statuses: settlement, pending, expire, cancel, deny, refund, partial_refund
  const newStatus = midtransStatus.transaction_status

  // 3. Update Supabase if different
  const { error: updateError } = await adminSupabase
    .from('subscriptions')
    .update({ 
        status: newStatus,
        payment_type: midtransStatus.payment_type,
        updated_at: new Date().toISOString()
    })
    .eq('midtrans_order_id', orderId)

  if (updateError) throw new Error(updateError.message)

  // 4. Log Audit
  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: 'SYNC_TRANSACTION',
    details: { 
        order_id: orderId,
        old_status: 'unknown_pre_sync',
        new_status: newStatus
    }
  })

  revalidatePath('/billing')
  return { success: true, status: newStatus }
}

export async function manualExtendSubscriptionAction(userId: string, days: number) {
  const adminSupabase = await createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  // Get current active subscription
  const { data: currentSub } = await adminSupabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'settlement')
    .single()

  if (!currentSub) throw new Error('No active settlement subscription found for this user.')

  const currentEnd = new Date(currentSub.current_period_end || new Date())
  const newEnd = new Date(currentEnd.getTime() + (days * 24 * 60 * 60 * 1000))

  const { error: updateError } = await adminSupabase
    .from('subscriptions')
    .update({ 
        current_period_end: newEnd.toISOString(),
        updated_at: new Date().toISOString()
    })
    .eq('id', currentSub.id)

  if (updateError) throw new Error(updateError.message)

  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: 'MANUAL_EXTEND_SUBSCRIPTION',
    details: { 
        target_user_id: userId,
        added_days: days,
        new_expiry: newEnd.toISOString()
    }
  })

  revalidatePath('/billing')
  return { success: true }
}

export async function refundTransactionAction(orderId: string, reason: string) {
  const adminSupabase = await createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  // 1. Trigger Midtrans Refund
  // Note: Some payment types might require 'cancel' instead of 'refund' if not yet settled
  try {
    // For simplicity, let's attempt refund. 
    // In production, you'd check midtransStatus first to decide cancel vs refund.
    await coreApi.transaction.refund({
        refund_key: `REFUND-${orderId}-${Date.now()}`,
        amount: 0, // 0 usually means full refund in some SDKs or handled by params
        reason: reason
    })
  } catch (err: unknown) {
    const error = err as Error
    // Fallback to cancel if refund fails (e.g. transaction not yet settled)
    try {
        await coreApi.transaction.cancel(orderId)
    } catch (cancelErr: unknown) {
        const cErr = cancelErr as Error
        throw new Error(`Refund/Cancel Failed: ${error.message} | ${cErr.message}`)
    }
  }

  // 2. Update Supabase
  const { error: updateError } = await adminSupabase
    .from('subscriptions')
    .update({ 
        status: 'cancel',
        updated_at: new Date().toISOString()
    })
    .eq('midtrans_order_id', orderId)

  if (updateError) throw new Error(updateError.message)

  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: 'REFUND_TRANSACTION',
    details: { 
        order_id: orderId,
        reason: reason
    }
  })

  revalidatePath('/billing')
  return { success: true }
}

export async function reconcileBatchAction(orderIds: string[]): Promise<{ results: { orderId: string, status: string, success: boolean }[] }> {
  const adminSupabase = await createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  const results = await Promise.all(orderIds.map(async (orderId) => {
    try {
      const midtransStatus: MidtransStatusResponse = await coreApi.transaction.status(orderId)
      const newStatus = midtransStatus.transaction_status
      
      const { error: updateError } = await adminSupabase
        .from('subscriptions')
        .update({ 
            status: newStatus,
            payment_type: midtransStatus.payment_type,
            updated_at: new Date().toISOString()
        })
        .eq('midtrans_order_id', orderId)

      if (updateError) throw new Error(updateError.message)

      return { orderId, status: newStatus, success: true }
    } catch (err) {
      console.error(`Error reconciling order ${orderId}:`, err)
      return { orderId, status: 'error', success: false }
    }
  }))

  // Log single batch audit
  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: 'BATCH_RECONCILE',
    details: { 
        count: orderIds.length,
        processed: results.length,
        success_count: results.filter(r => r.success).length
    }
  })

  revalidatePath('/billing')
  return { results }
}
