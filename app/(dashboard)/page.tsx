'use client'

import { useQuery } from '@tanstack/react-query'
import { getAnalyticsAction } from '@/app/actions/analytics-actions'
import { 
  Receipt, 
  Users, 
  TrendingUp, 
  ShieldCheck,
  Loader2,
  RefreshCcw
} from 'lucide-react'
import { GrowthChart } from '@/components/dashboard/growth-chart'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function DashboardOverview() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => getAnalyticsAction(),
    staleTime: 300000, // 5 minutes cache
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center -mt-20">
        <Loader2 className="h-12 w-12 animate-spin text-wise-cyan" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-wise-md border border-red-100 bg-red-50 p-8 text-red-600 font-bold">
        Failed to aggregate business intelligence data: {(error as Error)?.message || 'Unknown error'}
      </div>
    )
  }

  const { metrics, chart_data, timestamp } = data

  const stats = [
    { name: 'Monthly Recurring Revenue', value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(metrics.mrr), icon: Receipt },
    { name: 'Annual Recurring Revenue', value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(metrics.arr), icon: TrendingUp },
    { name: 'Total Real Users', value: metrics.total_users.toLocaleString(), icon: Users },
    { name: 'Conversion Rate', value: `${metrics.conversion_rate}%`, icon: ShieldCheck },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-6xl font-black text-near-black uppercase leading-none">
            OVER<span className="text-wise-cyan">VIEW</span>
          </h1>
          <p className="mt-4 text-sm font-bold text-wise-gray uppercase tracking-widest text-[10px]">
            Executive Business Intelligence & Operational Summary
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-black uppercase text-wise-gray tracking-widest leading-tight">
                Refreshed at: {format(new Date(timestamp), 'HH:mm:ss')}
            </span>
            <button 
                onClick={() => refetch()}
                disabled={isRefetching}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-near-black hover:text-wise-cyan transition-colors disabled:opacity-50"
            >
                <RefreshCcw className={cn("h-3 w-3", isRefetching && "animate-spin")} />
                Force Recompute
            </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="wise-card flex flex-col justify-between group hover:border-wise-cyan transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-full bg-wise-cyan/10 p-2 group-hover:bg-wise-cyan transition-colors">
                <stat.icon className="h-5 w-5 text-wise-cyan-dark" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-wise-gray uppercase tracking-widest mb-1">
                {stat.name}
              </p>
              <p className="text-[28px] font-black text-near-black tracking-tight leading-none">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <GrowthChart data={chart_data} />
        </div>
        
        {/* Placeholder for smaller insights */}
        <div className="wise-card flex flex-col p-8">
            <h3 className="text-[22px] font-black text-near-black uppercase tracking-tight mb-6">Fintech Insights</h3>
            <div className="space-y-6">
                <div className="border-b border-border pb-4">
                    <p className="text-[10px] font-black text-wise-gray uppercase tracking-widest mb-2">Avg. Emergency Runway</p>
                    <p className="text-xl font-black text-near-black">4.2 Months</p>
                </div>
                <div className="border-b border-border pb-4">
                    <p className="text-[10px] font-black text-wise-gray uppercase tracking-widest mb-2">Active Plus/Pro</p>
                    <p className="text-xl font-black text-near-black">{metrics.active_subscriptions} Users</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-wise-gray uppercase tracking-widest mb-2">Retention Cohort</p>
                    <p className="text-xl font-black text-near-black">88.4% (Q1)</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
