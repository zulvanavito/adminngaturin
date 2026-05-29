'use client'

import { useState } from 'react'
import { 
  RefreshCcw, 
  RotateCcw, 
  CalendarClock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SubscriptionLog } from '@/types/billing'
import { 
  syncTransactionAction, 
  manualExtendSubscriptionAction, 
  refundTransactionAction 
} from '@/app/actions/billing-actions'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNotificationStore } from '@/lib/store/notification-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils'

interface BillingActionsProps {
  log: SubscriptionLog
}

export function BillingActions({ log }: BillingActionsProps) {
  const queryClient = useQueryClient()
  
  // Modal States
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)

  // Form States
  const [extendDays, setExtendDays] = useState('7')
  const [refundReason, setRefundReason] = useState('')

  const mutation = useMutation({
    mutationFn: async ({ type, payload }: { type: string, payload: { days?: number; reason?: string } }) => {
      if (type === 'sync') return syncTransactionAction(log.midtrans_order_id!)
      if (type === 'extend') return manualExtendSubscriptionAction(log.user_id, payload.days!)
      if (type === 'refund') return refundTransactionAction(log.midtrans_order_id!, payload.reason!)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['billing-logs'] })
      setShowSyncModal(false)
      setShowExtendModal(false)
      setShowRefundModal(false)
      
      const syncRes = res as { status?: string }
      if (syncRes?.status) {
          useNotificationStore.getState().addToast('success', `Sync Complete: Transaction is now ${syncRes.status.toUpperCase()}`)
      } else {
          useNotificationStore.getState().addToast('success', 'Action successful')
      }
    },
    onError: (error: Error) => {
      useNotificationStore.getState().addToast('error', `Error: ${error.message}`)
    }
  })

  const isRefundable = log.status === 'settlement' || log.status === 'pending'
  const isSyncable = !!log.midtrans_order_id

  return (
    <div className="flex items-center gap-2">
      {/* 1. SYNC STATUS */}
      <Button 
        variant="outline" 
        size="icon" 
        disabled={!isSyncable || mutation.isPending}
        onClick={() => setShowSyncModal(true)}
        title="Sync with Midtrans"
        className="h-8 w-8 hover:text-wise-cyan hover:border-wise-cyan border-border/40"
      >
        <RefreshCcw className={cn("h-4 w-4", mutation.isPending && "animate-spin")} />
      </Button>
      
      {/* 2. MANUAL EXTEND */}
      <Button 
        variant="outline" 
        size="icon" 
        disabled={log.status !== 'settlement' || mutation.isPending}
        onClick={() => setShowExtendModal(true)}
        title="Extend Subscription"
        className="h-8 w-8 border-border/40 hover:text-green-600 hover:border-green-600"
      >
        <CalendarClock className="h-4 w-4" />
      </Button>

      {/* 3. REFUND / CANCEL */}
      <Button 
        variant="outline" 
        size="icon" 
        disabled={!isRefundable || mutation.isPending}
        onClick={() => setShowRefundModal(true)}
        title="Refund / Cancel"
        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:border-red-600 border-border/40"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      {/* SYNC MODAL */}
      <Dialog open={showSyncModal} onOpenChange={setShowSyncModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-wise-cyan/10 p-2">
                    <RefreshCcw className="h-6 w-6 text-wise-cyan-dark" />
                </div>
                <DialogTitle>Sync Transaction Status</DialogTitle>
            </div>
            <DialogDescription>
                Fetching real-time status from Midtrans for Order ID: <span className="font-black text-near-black">{log.midtrans_order_id}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowSyncModal(false)}>Cancel</Button>
            <Button onClick={() => mutation.mutate({ type: 'sync', payload: {} })} disabled={mutation.isPending}>
                {mutation.isPending ? 'Connecting...' : 'Fetch Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EXTEND MODAL */}
      <Dialog open={showExtendModal} onOpenChange={setShowExtendModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-green-100 p-2">
                    <CalendarClock className="h-6 w-6 text-green-700" />
                </div>
                <DialogTitle>Extend Subscription</DialogTitle>
            </div>
            <DialogDescription>
                Add extra days to <span className="font-black text-near-black">{log.email}</span>&apos;s active subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Number of Days</label>
                <input 
                    type="number" 
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    className="w-full rounded-wise-sm border border-border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-green-600"
                />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowExtendModal(false)}>Cancel</Button>
            <Button onClick={() => mutation.mutate({ type: 'extend', payload: { days: parseInt(extendDays) } })} disabled={mutation.isPending}>
                {mutation.isPending ? 'Applying...' : 'Extend Period'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REFUND MODAL */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent className="border-red-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-red-100 p-2">
                    <RotateCcw className="h-6 w-6 text-red-600" />
                </div>
                <DialogTitle className="text-red-600">Refund Transaction</DialogTitle>
            </div>
            <DialogDescription>
                Triggering a refund for Order <span className="font-black text-near-black">{log.midtrans_order_id}</span>. This will cancel the subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Reason for Refund</label>
                <textarea 
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    required
                    rows={2}
                    className="w-full rounded-wise-sm border border-border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-red-600"
                    placeholder="e.g. Duplicate payment, customer request"
                />
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={() => setShowRefundModal(false)}>Cancel</Button>
                <Button 
                    variant="destructive" 
                    disabled={!refundReason || mutation.isPending}
                    onClick={() => mutation.mutate({ type: 'refund', payload: { reason: refundReason } })}
                    className="bg-red-600"
                >
                    {mutation.isPending ? 'Processing Refund...' : 'Confirm Refund'}
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
