'use client'

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

interface GrowthChartProps {
  data: { name: string; total: number }[]
}

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <div className="wise-card h-[400px] w-full p-8 flex flex-col">
      <div className="mb-6">
        <h3 className="text-[22px] font-black text-near-black uppercase tracking-tight">Revenue Growth</h3>
        <p className="text-[14px] font-semibold text-wise-gray uppercase tracking-widest">Growth Trend (Last 7 Days)</p>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#70e6e8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#70e6e8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(14,15,12,0.06)" />
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#868685' }}
                dy={10}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 900, fill: '#868685' }}
            />
            <Tooltip 
                contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid rgba(14,15,12,0.12)',
                    boxShadow: 'rgba(14,15,12,0.12) 0px 0px 0px 1px',
                    fontFamily: 'Inter',
                    fontSize: '12px',
                    fontWeight: '900'
                }}
                itemStyle={{ color: '#0e0f0c' }}
                formatter={(value: number) => [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value), 'Revenue']}
                cursor={{ stroke: '#003333', strokeWidth: 2 }}
            />
            <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#003333" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
