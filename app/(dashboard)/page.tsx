import { Receipt, Users, TrendingUp, ShieldCheck } from 'lucide-react'

const stats = [
  { name: 'Monthly Recurring Revenue', value: 'Rp 134.1M', icon: Receipt, change: '+12.5%', changeType: 'positive' },
  { name: 'Annual Recurring Revenue', value: 'Rp 1.61B', icon: TrendingUp, change: '+18.2%', changeType: 'positive' },
  { name: 'Total Active Users', value: '8,940', icon: Users, change: '+4.3%', changeType: 'positive' },
  { name: 'Conversion Rate', value: '5.4%', icon: ShieldCheck, change: '+0.8%', changeType: 'positive' },
]

export default function DashboardOverview() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-6xl font-black text-near-black uppercase leading-none">
          OVER<span className="text-wise-green">VIEW</span>
        </h1>
        <p className="mt-4 text-sm font-bold text-wise-gray uppercase tracking-widest">
          Executive Business Intelligence & Operational Summary
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="wise-card flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-full bg-wise-green/10 p-2">
                <stat.icon className="h-5 w-5 text-wise-green-dark" />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full",
                stat.changeType === 'positive' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black text-wise-gray uppercase tracking-widest mb-1">
                {stat.name}
              </p>
              <p className="text-2xl font-black text-near-black tracking-tight">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* placeholder for charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="wise-card h-80 flex items-center justify-center text-wise-gray font-bold uppercase tracking-widest">
          Revenue Growth Chart (Placeholder)
        </div>
        <div className="wise-card h-80 flex items-center justify-center text-wise-gray font-bold uppercase tracking-widest">
          User Retention Cohorts (Placeholder)
        </div>
      </div>
    </div>
  )
}

// Helper to handle conditional classes since I can't use cn easily in this block without import
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}
