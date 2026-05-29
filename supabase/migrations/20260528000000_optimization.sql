-- 1. Performance Optimization: Index Foreign Keys (Ref: supabase-postgres-best-practices/references/schema-foreign-key-indexes.md)
-- Missing indexes cause slow JOINs and CASCADE operations, especially during UU PDP compliance (Hard Delete).

CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_gamification_profiles_user_id ON public.gamification_profiles(user_id);

-- Ensure indexes exist for other core tables mentioned in reconciliation/status updates
-- (Assumes these tables exist in the shared database)
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_user_id ON public.recurring_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);

-- 2. Performance Optimization: RLS Policy Caching (Ref: supabase-postgres-best-practices/references/security-rls-performance.md)
-- Wrapping subqueries/functions in (SELECT ...) ensures they are called once per query instead of per row.

-- Update blog_posts policies
DROP POLICY IF EXISTS "Admins and moderators can manage all blog posts" ON public.blog_posts;
CREATE POLICY "Admins and moderators can manage all blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin_or_moderator()));

-- Update admin_audit_logs policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING ((SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )));

-- 3. Data Integrity: Status Constraints (Ref: supabase-postgres-best-practices/references/schema-constraints.md)
-- Ensure status values are restricted to defined categories.

ALTER TABLE public.blog_posts 
DROP CONSTRAINT IF EXISTS blog_posts_status_check;

ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_status_check 
CHECK (status IN ('draft', 'published', 'archived'));

-- 4. Indexing for Search (Ref: supabase-postgres-best-practices/references/query-index-types.md)
-- Category-based filtering is common in the blog feed.
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at) WHERE status = 'published';
