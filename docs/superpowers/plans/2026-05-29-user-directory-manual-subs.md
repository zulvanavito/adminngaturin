# User Directory: Manual Subscriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a feature in the User Directory allowing admins to manually grant premium subscriptions to individual users, displaying their current plan in the data table.

**Architecture:** 
1. **Data Model:** Update `CombinedUser` type to include a `plan` field.
2. **Server Action:** Extend `getUsersAction` to fetch active subscriptions. Add `grantManualSubscriptionAction` to handle the direct database insertion (bypassing Midtrans).
3. **UI Updates:** Add a "Plan" column to the Users Table and a new "Grant Premium" modal in the `UserActions` component.

**Tech Stack:** Next.js Server Actions, Supabase, TanStack Table, Shadcn UI (Dialog).

---

### Task 1: Type Definitions and Data Fetching

**Files:**
- Modify: `types/user.ts`
- Modify: `app/actions/user-actions.ts`

- [ ] **Step 1: Update Types**
In `types/user.ts`, add the `plan` property to `CombinedUser`.

```typescript
export interface CombinedUser {
  user_id: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  email?: string;
  display_name?: string;
  plan: 'free' | 'plus' | 'pro'; // New field
  gamification: {
    xp: number;
    level: number;
    current_streak: number;
  };
}
```

- [ ] **Step 2: Update getUsersAction to fetch active subscriptions**
In `app/actions/user-actions.ts`, add a query to fetch active subscriptions and map them to the users.

```typescript
// Inside getUsersAction, add this to the Promise.all array:
    adminSupabase
      .from('subscriptions')
      .select('user_id, plan_id')
      .eq('status', 'settlement')
      .gt('current_period_end', new Date().toISOString())

// Add error handling:
  if (subsRes.error) console.warn('Subscriptions data fetch failed:', subsRes.error.message)

// Create a map for active subscriptions:
  const activeSubsMap = new Map<string, string>((subsRes.data || []).map((s: { user_id: string; plan_id: string }) => [s.user_id, s.plan_id]))

// Update the user mapping return object:
    return {
      user_id: profile.user_id,
      role: profile.role,
      status: profile.status,
      created_at: profile.created_at,
      email: authData?.email,
      display_name: authData?.full_name,
      plan: (activeSubsMap.get(profile.user_id) as 'free' | 'plus' | 'pro') || 'free',
      gamification: gamificationData || { xp: 0, level: 1, current_streak: 0 }
    }
```

- [ ] **Step 3: Commit**

```bash
git add types/user.ts app/actions/user-actions.ts
git commit -m "feat: add plan type and fetch active subscriptions for users"
```

---

### Task 2: Server Action for Manual Grant

**Files:**
- Modify: `app/actions/user-actions.ts`

- [ ] **Step 1: Implement grantManualSubscriptionAction**
Add the new server action to handle the database insertion and audit logging.

```typescript
export async function grantManualSubscriptionAction(targetUserId: string, planId: 'plus' | 'pro', durationDays: number, reason: string) {
  const adminSupabase = createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  const now = new Date()
  const endDate = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000))
  const orderId = `MANUAL-${targetUserId.substring(0,8)}-${now.getTime()}`

  const { error: insertError } = await adminSupabase
    .from('subscriptions')
    .insert({
      user_id: targetUserId,
      plan_id: planId,
      status: 'settlement',
      amount: 0, // Manual grants are free
      interval: 'manual',
      current_period_start: now.toISOString(),
      current_period_end: endDate.toISOString(),
      midtrans_order_id: orderId,
      payment_type: 'manual_grant'
    })

  if (insertError) throw new Error(`Failed to grant subscription: ${insertError.message}`)

  // Log Audit
  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: 'MANUAL_SUBSCRIPTION_GRANT',
    details: {
      target_user_id: targetUserId,
      plan_id: planId,
      duration_days: durationDays,
      reason: reason
    }
  })

  revalidatePath('/users')
  return { success: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/user-actions.ts
git commit -m "feat: implement server action for manual subscription grants"
```

---

### Task 3: UI - Users Table Updates

**Files:**
- Modify: `components/users/users-table.tsx`

- [ ] **Step 1: Add "Plan" Column**
In `columns` array, insert the "Plan" column next to the "Status" column. Use Wise Design System styling for the badges.

```typescript
  {
    accessorKey: 'plan',
    header: 'Plan',
    cell: ({ row }) => {
      const plan = row.getValue('plan') as string
      return (
        <span className={cn(
          "px-2 py-1 rounded-wise-sm text-[10px] font-black uppercase tracking-widest",
          plan === 'pro' ? "bg-purple-100 text-purple-700" : 
          plan === 'plus' ? "bg-blue-100 text-blue-700" : 
          "bg-gray-100 text-gray-500"
        )}>
          {plan}
        </span>
      )
    },
  },
```

- [ ] **Step 2: Commit**

```bash
git add components/users/users-table.tsx
git commit -m "ui: add plan column to user directory table"
```

---

### Task 4: UI - User Actions Modal

**Files:**
- Modify: `components/users/user-actions.tsx`

- [ ] **Step 1: Add State and Mutation**
Import `grantManualSubscriptionAction`, `Crown` icon, and add state/mutation logic.

```typescript
  // Add State
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [grantPlan, setGrantPlan] = useState<'plus' | 'pro'>('plus')
  const [grantDuration, setGrantDuration] = useState('30')
  const [grantReason, setGrantReason] = useState('')

  // Add to mutationFn
      if (type === 'grant') return grantManualSubscriptionAction(user.user_id, payload.plan as 'plus'|'pro', payload.duration!, payload.reason!)

  // Add to onSuccess reset block
      setShowGrantModal(false)
      setGrantPlan('plus')
      setGrantDuration('30')
      setGrantReason('')

  // Add Submit Handler
  const handleGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ type: 'grant', payload: { plan: grantPlan, duration: parseInt(grantDuration), reason: grantReason } })
  }
```

- [ ] **Step 2: Add Trigger Button**
Add the Crown button to the UI.

```typescript
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => setShowGrantModal(true)}
        title="Grant Premium"
        className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:border-purple-600 border-border/40"
      >
        <Crown className="h-4 w-4" />
      </Button>
```

- [ ] **Step 3: Implement Modal Content**
Add the Dialog component for the manual grant form.

```tsx
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Select Plan</label>
                    <select 
                        value={grantPlan}
                        onChange={(e) => setGrantPlan(e.target.value as 'plus' | 'pro')}
                        className="w-full rounded-wise-sm border border-border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-purple-600"
                    >
                        <option value="plus">Ngaturin Plus</option>
                        <option value="pro">Ngaturin Pro</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Duration (Days)</label>
                    <input 
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
                <label className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Reason for Grant (Audit Log)</label>
                <textarea 
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                    required
                    rows={2}
                    className="w-full rounded-wise-sm border border-border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-purple-600"
                    placeholder="e.g. Customer support compensation, Giveaway winner"
                />
            </div>
            <DialogFooter>
                <Button variant="secondary" type="button" onClick={() => setShowGrantModal(false)}>Cancel</Button>
                <Button type="submit" disabled={mutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
                    {mutation.isPending ? 'Granting...' : 'Grant Subscription'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
```

- [ ] **Step 4: Commit**

```bash
git add components/users/user-actions.tsx
git commit -m "feat: add manual subscription grant UI to user directory"
```

---

### Task 5: Revoke Subscription Feature

**Files:**
- Modify: `app/actions/user-actions.ts`
- Modify: `components/users/user-actions.tsx`

- [ ] **Step 1: Implement revokeSubscriptionAction**
Add the server action to cancel active subscriptions and log the event.

- [ ] **Step 2: Update UI to show Revoke option**
Modify the "Grant Premium Access" modal to show a "Revoke Access" section if the user is currently Plus or Pro.

- [ ] **Step 3: Commit**

```bash
git add app/actions/user-actions.ts components/users/user-actions.tsx
git commit -m "feat: implement revoke premium access feature"
```

