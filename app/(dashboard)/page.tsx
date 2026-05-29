import { getDashboardMetricsAction } from '@/app/actions/analytics-actions'
import { GrowthChart } from '@/components/dashboard/growth-chart'
import { Users, CreditCard, Wallet } from 'lucide-react'

export default async function DashboardPage() {
  const data = await getDashboardMetricsAction()

  const metrics = [
    {
      label: 'Total Users',
      value: data.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Active Subscribers',
      value: data.activeSubscribers.toLocaleString(),
      icon: CreditCard,
      color: 'text-wise-green-dark',
      bg: 'bg-wise-green/10'
    },
    {
      label: 'Total Revenue',
      value: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
      }).format(data.totalRevenue),
      icon: Wallet,
      color: 'text-wise-cyan-dark',
      bg: 'bg-wise-cyan/10'
    }
  ]

  return (
    <div className="space-y-12 pb-12">
      {/* Welcome Header */}
      <div>
        <h1 className="text-6xl font-black text-near-black uppercase leading-[0.85] tracking-tight">
          System <span className="text-wise-cyan">Overview</span>
        </h1>
        <p className="mt-4 text-sm font-bold text-wise-gray uppercase tracking-widest">
          Real-time platform metrics and financial intelligence
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {metrics.map((metric) => (
          <div 
            key={metric.label} 
            className="rounded-[40px] bg-white p-8 shadow-ring flex flex-col justify-between h-[200px] hover:scale-[1.02] transition-transform duration-300"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-2xl ${metric.bg}`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-wise-gray">
                Live Data
              </span>
            </div>
            <div>
              <p className="text-[12px] font-black text-wise-gray uppercase tracking-widest mb-1">
                {metric.label}
              </p>
              <p className="text-4xl font-black text-near-black tracking-tighter">
                {metric.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="rounded-[40px] bg-white p-2 shadow-ring overflow-hidden">
        <GrowthChart data={data.revenueTrend} />
      </div>

      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-wise-gray px-4">
        <span>Admin Control Panel v1.0</span>
        <span>Last updated: {new Date(data.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  )
}
