'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getAnalyticsAction() {
  const adminSupabase = createAdminClient()

  // 1. Parallel Aggregation for Performance
  const [userCountRes, subsRes, growthRes] = await Promise.all([
    // Total Real Users (Filtering out admins/moderators)
    adminSupabase
      .from('user_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('role', 'user'),

    // Active Settlements Subscriptions
    adminSupabase
      .from('subscriptions')
      .select('amount, interval')
      .eq('status', 'settlement'),

    // Growth Data (last 6 months - simplistic aggregation for now)
    // In a production app, we'd use a dedicated View or RPC for efficiency
    adminSupabase
      .from('user_profiles')
      .select('created_at')
      .eq('role', 'user')
      .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())
  ])

  if (userCountRes.error) throw new Error(userCountRes.error.message)
  
  const totalUsers = userCountRes.count || 0
  const activeSubs = subsRes.data || []
  const activeSubsCount = activeSubs.length

  // 2. Calculate MRR & ARR
  let mrr = 0
  let annualBase = 0

  activeSubs.forEach(sub => {
    const amount = Number(sub.amount)
    if (sub.interval === 'monthly') {
      mrr += amount
    } else if (sub.interval === 'yearly') {
      annualBase += amount
    }
  })

  const arr = annualBase + (mrr * 12)

  // 3. Conversion Rate
  const conversionRate = totalUsers > 0 ? (activeSubsCount / totalUsers) * 100 : 0

  // 4. Process Growth Data into monthly buckets
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const growthBuckets: Record<string, number> = {}
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`
    growthBuckets[key] = 0
  }

  (growthRes.data || []).forEach(u => {
    const date = new Date(u.created_at)
    const key = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().substr(-2)}`
    if (growthBuckets[key] !== undefined) {
      growthBuckets[key]++
    }
  })

  const chartData = Object.entries(growthBuckets).map(([name, users]) => ({ name, users }))

  return {
    metrics: {
      total_users: totalUsers,
      active_subscriptions: activeSubsCount,
      mrr,
      arr,
      conversion_rate: Number(conversionRate.toFixed(1))
    },
    chart_data: chartData,
    timestamp: new Date().toISOString()
  }
}

export async function getAuditLogsAction() {
  const adminSupabase = createAdminClient()
  
  const [logsRes, authRes] = await Promise.all([
    adminSupabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    adminSupabase.rpc('get_auth_users_data')
  ])

  if (logsRes.error) throw new Error(logsRes.error.message)
  
  interface AuthUserData {
    id: string
    email: string
    full_name: string
  }

  const authMap = new Map<string, AuthUserData>(
    (authRes.data as AuthUserData[] || []).map((u) => [u.id, u])
  )

  interface RawLog {
    id: string
    admin_id: string
    action: string
    details: Record<string, unknown>
    created_at: string
  }

  return (logsRes.data as RawLog[] || []).map((log) => ({
    ...log,
    admin_name: authMap.get(log.admin_id)?.full_name || 'System/Unknown',
    admin_email: authMap.get(log.admin_id)?.email
  }))
}
