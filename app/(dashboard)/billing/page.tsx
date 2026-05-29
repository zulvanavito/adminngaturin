'use client'

import { useQuery } from '@tanstack/react-query'
import { getSubscriptionLogsAction } from '@/app/actions/billing-actions'
import { BillingTable } from '@/components/billing/billing-table'
import { Loader2 } from 'lucide-react'

export default function BillingPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['billing-logs'],
    queryFn: () => getSubscriptionLogsAction(),
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-6xl font-black text-near-black uppercase leading-none">
          BILLING<span className="text-wise-cyan">&</span>AUDIT
        </h1>
        <p className="mt-4 text-sm font-bold text-wise-gray uppercase tracking-widest text-[10px]">
          Reconcile Midtrans transactions, handle refunds, and manage subscription periods.
        </p>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-wise-cyan" />
        </div>
      ) : error ? (
        <div className="rounded-wise-md border border-red-100 bg-red-50 p-4 text-red-600 font-bold">
          Error loading billing logs: {(error as Error).message}
        </div>
      ) : (
        <BillingTable data={data || []} />
      )}
    </div>
  )
}
