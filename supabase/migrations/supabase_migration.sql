-- 1. Create Role Enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add role column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- 3. Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  content         TEXT NOT NULL,
  excerpt         TEXT NOT NULL,
  cover_image_url TEXT,
  category        TEXT NOT NULL,
  tags            TEXT[] DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'draft',
  is_featured     BOOLEAN DEFAULT FALSE,
  author_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Changed to CASCADE for UU PDP
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- Keep logs but nullify admin if deleted
  action          TEXT NOT NULL,
  details         JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS on new tables
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Helper function to check if user is admin/moderator
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. RLS Policies for Blog Posts
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;
CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins and moderators can manage all blog posts" ON public.blog_posts;
CREATE POLICY "Admins and moderators can manage all blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (public.is_admin_or_moderator());

-- 8. RLS Policies for Audit Logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Allow service role to insert (bypasses RLS) or authenticated admins
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- 8. Helper Indices
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON public.blog_posts(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
