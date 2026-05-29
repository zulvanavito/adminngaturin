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

export async function getDashboardMetricsAction() {
  const adminSupabase = createAdminClient()
  const now = new Date().toISOString()

  // 1. Parallel Aggregation for Performance
  const [usersRes, activeSubsRes, revenueRes] = await Promise.all([
    adminSupabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    adminSupabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'settlement').gt('current_period_end', now),
    adminSupabase.from('subscriptions').select('amount').eq('status', 'settlement')
  ])

  if (usersRes.error) throw new Error(usersRes.error.message)
  if (activeSubsRes.error) throw new Error(activeSubsRes.error.message)
  if (revenueRes.error) throw new Error(revenueRes.error.message)

  const totalUsers = usersRes.count || 0
  const activeSubscribers = activeSubsRes.count || 0
  const totalRevenue = (revenueRes.data || []).reduce((sum, s) => sum + (Number(s.amount) || 0), 0)

  // 2. Fetch last 7 days of settlement subscriptions for trend chart
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: trendData, error: trendError } = await adminSupabase
    .from('subscriptions')
    .select('amount, created_at')
    .eq('status', 'settlement')
    .gt('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  if (trendError) throw new Error(trendError.message)

  // 3. Aggregate daily revenue for the last 7 days
  const dailyMap = new Map<string, number>()
  
  // Initialize map with last 7 days (including today)
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    dailyMap.set(dateStr, 0)
  }

  (trendData || []).forEach(sub => {
    const dateStr = new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + Number(sub.amount))
    }
  })

  const revenueTrend = Array.from(dailyMap.entries()).map(([name, total]) => ({
    name,
    total
  }))

  return {
    totalUsers,
    activeSubscribers,
    totalRevenue,
    revenueTrend,
    timestamp: new Date().toISOString()
  }
}
