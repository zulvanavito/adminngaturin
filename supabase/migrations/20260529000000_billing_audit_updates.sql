-- 1. Update subscriptions table to support anonymization (PDP Compliance)
-- Change CASCADE to SET NULL so transaction history is preserved for financial reporting
-- Reference: supabase-postgres-best-practices/references/schema-constraints.md

-- Ensure user_id can be NULL for SET NULL to work
ALTER TABLE public.subscriptions 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- 2. Performance Optimization: Index Foreign Keys (Ref: supabase-postgres-best-practices/references/schema-foreign-key-indexes.md)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- 3. Ensure Audit Log Policies are robust
-- Indexing created_at for fast sorting in the Admin Dashboard
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
