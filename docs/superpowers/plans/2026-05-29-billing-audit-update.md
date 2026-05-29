# Billing & Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive Audit Log, manual Batch Reconciliation for Midtrans transactions, and PDP-compliant user data anonymization for billing records.

**Architecture:** 
1. **Audit Log:** New `/audit-logs` route with a high-density TanStack Table.
2. **Batch Reconciliation:** Client-side polling mechanism in the Billing page that triggers a server action to sync batches of transactions with Midtrans.
3. **Anonymization Logic:** Database migration to change `subscriptions` foreign key to `ON DELETE SET NULL`, preserving records when users are deleted.

**Tech Stack:** Next.js (App Router), Supabase (PostgreSQL), TanStack Table/Query, Midtrans Core API, Wise Design System.

---

### Task 1: Database Migration - Anonymization & Audit Log Policies

**Files:**
- Create: `supabase/migrations/20260529000000_billing_audit_updates.sql`

- [ ] **Step 1: Create migration file with SET NULL constraint**

```sql
-- 1. Update subscriptions table to support anonymization (PDP Compliance)
-- Change CASCADE to SET NULL so transaction history is preserved for financial reporting
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- 2. Ensure Audit Log Policies are robust
-- (Already exists in optimization but let's make sure it handles the new UI needs)
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
```

- [ ] **Step 2: Apply migration (Local simulation since Docker is down, or instruct user to apply)**
Note: Since I cannot run the migration directly without Docker or live SQL tool, I will verify the SQL logic.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260529000000_billing_audit_updates.sql
git commit -m "db: update subscriptions for anonymization and add audit log index"
```

---

### Task 2: Server Action - Batch Reconciliation

**Files:**
- Modify: `app/actions/billing-actions.ts`

- [ ] **Step 1: Implement reconcileBatchAction**

```typescript
export async function reconcileBatchAction(orderIds: string[]): Promise<{ results: { orderId: string, status: string, success: boolean }[] }> {
  const adminSupabase = await createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user: admin } } = await publicSupabase.auth.getUser()
  if (!admin) throw new Error('Unauthorized')

  const results = await Promise.all(orderIds.map(async (orderId) => {
    try {
      const midtransStatus = await coreApi.transaction.status(orderId)
      const newStatus = midtransStatus.transaction_status
      
      const { error: updateError } = await adminSupabase
        .from('subscriptions')
        .update({ 
            status: newStatus,
            payment_type: midtransStatus.payment_type,
            updated_at: new Date().toISOString()
        })
        .eq('midtrans_order_id', orderId)

      if (updateError) throw new Error(updateError.message)

      return { orderId, status: newStatus, success: true }
    } catch (err) {
      return { orderId, status: 'error', success: false }
    }
  }))

  // Log single batch audit
  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: admin.id,
    action: 'BATCH_RECONCILE',
    details: { 
        count: orderIds.length,
        processed: results.length,
        success_count: results.filter(r => r.success).length
    }
  })

  revalidatePath('/billing')
  return { results }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/billing-actions.ts
git commit -m "feat: add batch reconciliation server action"
```

---

### Task 3: UI - Batch Reconciliation in Billing Table

**Files:**
- Modify: `components/billing/billing-table.tsx`

- [ ] **Step 1: Add reconciliation state and logic**

```typescript
// Inside BillingTable component
const [isReconciling, setIsReconciling] = React.useState(false)
const [reconcileProgress, setReconcileProgress] = React.useState(0)

const runReconciliation = async () => {
    const pendingOrders = data
        .filter(log => log.status === 'pending' && log.midtrans_order_id)
        .map(log => log.midtrans_order_id!)
    
    if (pendingOrders.length === 0) {
        alert('No pending transactions to reconcile.')
        return
    }

    setIsReconciling(true)
    setReconcileProgress(0)
    
    const batchSize = 5
    for (let i = 0; i < pendingOrders.length; i += batchSize) {
        const batch = pendingOrders.slice(i, i + batchSize)
        await reconcileBatchAction(batch)
        setReconcileProgress(Math.min(100, Math.round(((i + batch.length) / pendingOrders.length) * 100)))
    }
    
    setIsReconciling(false)
    alert('Reconciliation complete')
}
```

- [ ] **Step 2: Add Reconciliation Button and Progress Bar to UI**
(Implement the Wise Design System "Pill Progress Bar" and Button)

- [ ] **Step 3: Commit**

```bash
git add components/billing/billing-table.tsx
git commit -m "ui: add batch reconciliation with progress bar"
```

---

### Task 4: UI - Audit Logs Page

**Files:**
- Create: `app/(dashboard)/audit-logs/page.tsx`
- Create: `components/dashboard/audit-logs-table.tsx`
- Modify: `components/shared/Sidebar.tsx`

- [ ] **Step 1: Create Audit Logs Table (Dense Data approach)**
- [ ] **Step 2: Create the Audit Logs Page**
- [ ] **Step 3: Add "Audit Logs" to Sidebar**
- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/audit-logs/page.tsx components/dashboard/audit-logs-table.tsx components/shared/Sidebar.tsx
git commit -m "feat: implement audit logs page and table"
```
