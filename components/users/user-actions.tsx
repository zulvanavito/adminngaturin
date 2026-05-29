'use client'

import { useState } from 'react'
import { 
  Zap, 
  Ban, 
  Trash2, 
  UserCheck,
  AlertTriangle,
  Crown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CombinedUser } from '@/types/user'
import { 
  adjustXpAction, 
  suspendUserAction, 
  deleteUserAction,
  grantManualSubscriptionAction,
  revokeSubscriptionAction
} from '@/app/actions/user-actions'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils'

interface UserActionsProps {
  user: CombinedUser
}

export function UserActions({ user }: UserActionsProps) {
  const queryClient = useQueryClient()
  
  // Modal States
  const [showXpModal, setShowXpModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showGrantModal, setShowGrantModal] = useState(false)

  // Form States
  const [xpAmount, setXpAmount] = useState('0')
  const [xpReason, setXpReason] = useState('')
  const [deleteReason, setDeleteModalReason] = useState('')
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const [grantPlan, setGrantPlan] = useState<'plus' | 'pro'>('plus')
  const [grantDuration, setGrantDuration] = useState('30')
  const [grantReason, setGrantReason] = useState('')

  const [isRevoking, setIsRevoking] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')

  const mutation = useMutation({
    mutationFn: async ({ type, payload }: { type: string, payload: { amount?: number; reason?: string; status?: string; planId?: 'plus' | 'pro'; duration?: number } }) => {
      if (type === 'xp') return adjustXpAction(user.user_id, payload.amount!, payload.reason!)
      if (type === 'suspend') return suspendUserAction(user.user_id, payload.status as 'active' | 'suspended')
      if (type === 'delete') return deleteUserAction(user.user_id, payload.reason!)
      if (type === 'grant') return grantManualSubscriptionAction(user.user_id, payload.planId!, payload.duration!, payload.reason!)
      if (type === 'revoke') return revokeSubscriptionAction(user.user_id, payload.reason!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowXpModal(false)
      setShowSuspendModal(false)
      setShowDeleteModal(false)
      setShowGrantModal(false)
      // Reset forms
      setXpAmount('0')
      setXpReason('')
      setDeleteModalReason('')
      setIsConfirmingDelete(false)
      setGrantReason('')
      setGrantPlan('plus')
      setGrantDuration('30')
      setIsRevoking(false)
      setRevokeReason('')
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`)
    }
  })

  const handleXpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ type: 'xp', payload: { amount: parseInt(xpAmount), reason: xpReason } })
  }

  const handleGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ 
      type: 'grant', 
      payload: { 
        planId: grantPlan, 
        duration: parseInt(grantDuration), 
        reason: grantReason 
      } 
    })
  }

  const handleRevokeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ type: 'revoke', payload: { reason: revokeReason } })
  }

  const handleSuspendToggle = () => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended'
    mutation.mutate({ type: 'suspend', payload: { status: newStatus } })
  }

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isConfirmingDelete) {
        mutation.mutate({ type: 'delete', payload: { reason: deleteReason } })
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Trigger Buttons */}
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setShowGrantModal(true)}
        title="Grant Premium Access"
        className="h-8 w-8 hover:text-purple-600 hover:border-purple-600 border-border/40"
      >
        <Crown className="h-4 w-4" />
      </Button>

      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setShowXpModal(true)}
        title="Adjust XP"
        className="h-8 w-8 hover:text-wise-cyan hover:border-wise-cyan border-border/40"
      >
        <Zap className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setShowSuspendModal(true)}
        title={user.status === 'suspended' ? "Activate" : "Suspend"}
        className={cn(
          "h-8 w-8 border-border/40",
          user.status === 'suspended' ? "text-green-600 hover:border-green-600" : "text-amber-600 hover:border-amber-600"
        )}
      >
        {user.status === 'suspended' ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
      </Button>

      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setShowDeleteModal(true)}
        title="Hard Delete (PDP)"
        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:border-red-600 border-border/40"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* 1. ADJUST XP MODAL */}
      <Dialog open={showXpModal} onOpenChange={setShowXpModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-wise-cyan/10 p-2">
                    <Zap className="h-6 w-6 text-wise-cyan-dark" />
                </div>
                <DialogTitle>Adjust User XP</DialogTitle>
            </div>
            <DialogDescription>
                Modify experience points for <span className="font-black text-near-black">{user.display_name || 'this user'}</span>. This will affect their level.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleXpSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
                <label htmlFor="xp-amount" className="text-[10px] font-black uppercase tracking-widest text-wise-gray">XP Amount</label>
                <input 
                    id="xp-amount"
                    type="number" 
                    value={xpAmount}
                    onChange={(e) => setXpAmount(e.target.value)}
                    className="w-full rounded-wise-sm border border-border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-wise-cyan"
                    placeholder="e.g. 100 or -50"
                />
            </div>
            <div className="space-y-2">
                <label htmlFor="xp-reason" className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Reason for adjustment</label>
                <textarea 
                    id="xp-reason"
                    value={xpReason}
                    onChange={(e) => setXpReason(e.target.value)}
                    required
                    rows={3}
                    className="w-full rounded-wise-sm border border-border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-wise-cyan"
                    placeholder="Provide context for the audit log..."
                />
            </div>
            <DialogFooter>
                <Button variant="secondary" type="button" onClick={() => setShowXpModal(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Processing...' : 'Apply Adjustment'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. SUSPEND/ACTIVATE MODAL */}
      <Dialog open={showSuspendModal} onOpenChange={setShowSuspendModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                    "rounded-full p-2",
                    user.status === 'suspended' ? "bg-green-100" : "bg-amber-100"
                )}>
                    {user.status === 'suspended' ? 
                        <UserCheck className="h-6 w-6 text-green-700" /> : 
                        <AlertTriangle className="h-6 w-6 text-amber-700" />
                    }
                </div>
                <DialogTitle>{user.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}</DialogTitle>
            </div>
            <DialogDescription>
                {user.status === 'suspended' ? 
                    `Are you sure you want to restore access for ${user.display_name}? they will be able to use the app again.` :
                    `This will prevent ${user.display_name} from logging into the app. Their data will remain intact.`
                }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" type="button" onClick={() => setShowSuspendModal(false)}>Cancel</Button>
            <Button 
                onClick={handleSuspendToggle} 
                disabled={mutation.isPending}
                className={cn(
                    user.status === 'suspended' ? "bg-green-600 text-white" : "bg-amber-600 text-white"
                )}
            >
                {mutation.isPending ? 'Processing...' : (user.status === 'suspended' ? 'Confirm Activation' : 'Confirm Suspension')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. HARD DELETE (PDP) MODAL */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="border-red-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-red-100 p-2">
                    <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <DialogTitle className="text-red-600">Critical: Permanent Deletion</DialogTitle>
            </div>
            <DialogDescription>
                This action is irreversible. It will wipe ALL data for <span className="font-black text-near-black">{user.email}</span> across all tables to comply with PDP &quot;Right to be Forgotten&quot;.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleDeleteSubmit} className="space-y-4 mt-4">
            <div className="bg-red-50 border border-red-100 rounded-wise-sm p-4 text-xs text-red-800 font-semibold space-y-2">
                <p>To proceed, please type the reason for this deletion and check the confirmation box below.</p>
            </div>

            <div className="space-y-2">
                <label htmlFor="delete-reason" className="text-[10px] font-black uppercase tracking-widest text-red-900/50">Deletion Reason (Required)</label>
                <textarea 
                    id="delete-reason"
                    value={deleteReason}
                    onChange={(e) => setDeleteModalReason(e.target.value)}
                    required
                    rows={2}
                    className="w-full rounded-wise-sm border border-red-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-red-600"
                    placeholder="e.g. Formal request from user (Ticket #123)"
                />
            </div>

            <div className="flex items-center space-x-2">
                <input 
                    type="checkbox" 
                    id="confirm-delete" 
                    checked={isConfirmingDelete}
                    onChange={(e) => setIsConfirmingDelete(e.target.checked)}
                    className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-600"
                />
                <label htmlFor="confirm-delete" className="text-xs font-bold text-near-black select-none">
                    I understand this will permanently erase all user data.
                </label>
            </div>

            <DialogFooter>
                <Button variant="secondary" type="button" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                <Button 
                    variant="destructive" 
                    type="submit"
                    disabled={!isConfirmingDelete || !deleteReason || mutation.isPending}
                    className="bg-red-600 hover:bg-red-700 h-11 px-6 text-base"
                >
                    {mutation.isPending ? 'Executing Wipe...' : 'Delete User Permanently'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. GRANT PREMIUM MODAL */}
      <Dialog open={showGrantModal} onOpenChange={setShowGrantModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-purple-100 p-2">
                    <Crown className="h-6 w-6 text-purple-700" />
                </div>
                <DialogTitle>Grant Premium Access</DialogTitle>
            </div>
            <DialogDescription>
                Manually grant a subscription to <span className="font-black text-near-black">{user.display_name}</span>. This bypasses the payment gateway.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGrantSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="grant-plan" className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Select Plan</label>
                    <select 
                        id="grant-plan"
                        value={grantPlan}
                        onChange={(e) => setGrantPlan(e.target.value as 'plus' | 'pro')}
                        className="w-full rounded-wise-sm border border-border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-purple-600"
                    >
                        <option value="plus">Ngaturin Plus</option>
                        <option value="pro">Ngaturin Pro</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="grant-duration" className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Duration (Days)</label>
                    <input 
                        id="grant-duration"
                        type="number" 
                        value={grantDuration}
                        onChange={(e) => setGrantDuration(e.target.value)}
                        min="1"
                        className="w-full rounded-wise-sm border border-border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-purple-600"
                        placeholder="e.g. 30"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label htmlFor="grant-reason" className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Reason for Grant (Audit Log)</label>
                <textarea 
                    id="grant-reason"
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                    required
                    rows={2}
                    className="w-full rounded-wise-sm border border-border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-purple-600"
                    placeholder="e.g. Customer support compensation, Giveaway winner"
                />
            </div>

            {user.plan !== 'free' && (
              <div className="mt-6 pt-6 border-t border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-red-600">Danger Zone: Revoke Access</h4>
                </div>
                {!isRevoking ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-600"
                    onClick={() => setIsRevoking(true)}
                  >
                    Revoke Current {user.plan.toUpperCase()} Plan
                  </Button>
                ) : (
                  <div className="space-y-3 bg-red-50 p-4 rounded-wise-sm border border-red-100">
                    <div className="space-y-2">
                      <label htmlFor="revoke-reason" className="text-[10px] font-black uppercase tracking-widest text-red-900/50">Reason for Revocation</label>
                      <textarea 
                        id="revoke-reason"
                        value={revokeReason}
                        onChange={(e) => setRevokeReason(e.target.value)}
                        required
                        rows={2}
                        className="w-full rounded-wise-sm border border-red-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-red-600"
                        placeholder="e.g. Payment issue, Subscription abuse"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="secondary" 
                        className="flex-1"
                        onClick={() => setIsRevoking(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleRevokeSubmit}
                        disabled={!revokeReason || mutation.isPending}
                      >
                        {mutation.isPending ? 'Revoking...' : 'Confirm Revoke'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
                <Button variant="secondary" type="button" onClick={() => setShowGrantModal(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
                    {mutation.isPending ? 'Granting...' : 'Grant Subscription'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
