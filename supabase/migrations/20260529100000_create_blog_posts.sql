-- 1. Create handle_updated_at function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    content         TEXT NOT NULL,
    excerpt         TEXT NOT NULL,
    cover_image_url TEXT,
    category        TEXT NOT NULL,
    tags            TEXT[] DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured     BOOLEAN DEFAULT FALSE,
    author_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON public.blog_posts(status) WHERE status = 'published';

-- 4. Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON public.blog_posts;
CREATE POLICY "Anyone can view published blog posts"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins can manage all blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage all blog posts"
  ON public.blog_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- 6. Updated At Trigger
DROP TRIGGER IF EXISTS set_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER set_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
