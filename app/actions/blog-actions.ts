'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { BlogPost, CreateBlogPost } from '@/types/blog'
import { revalidatePath } from 'next/cache'

/**
 * Fetches all blog posts, ordered by creation date descending.
 */
export async function getBlogPostsAction(): Promise<BlogPost[]> {
  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching blog posts:', error)
    throw new Error(error.message)
  }
  return data || []
}

/**
 * Fetches a single blog post by its slug.
 */
export async function getBlogPostAction(slug: string): Promise<BlogPost> {
  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error(`Error fetching blog post with slug ${slug}:`, error)
    throw new Error(error.message)
  }
  return data
}

/**
 * Creates or updates a blog post.
 */
export async function upsertBlogPostAction(data: CreateBlogPost & { id?: string }) {
  const adminSupabase = createAdminClient()
  const publicSupabase = await createClient()

  // Get current admin user
  const { data: { user } } = await publicSupabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Role enforcement: Check if user has admin or moderator role
  const { data: profile, error: profileError } = await adminSupabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Could not verify user role')
  }

  if (profile.role !== 'admin' && profile.role !== 'moderator') {
    throw new Error('Insufficient permissions: Only admins and moderators can manage blog posts')
  }

  const now = new Date().toISOString()
  
  // Prepare data for database
  const postData: Partial<BlogPost> = {
    ...data,
    author_id: user.id,
    updated_at: now,
  }

  // Handle published_at logic
  if (data.status === 'published' && !data.published_at) {
    postData.published_at = now
  } else if (data.status !== 'published') {
    postData.published_at = null
  }

  let result
  if (data.id) {
    // Update existing post
    result = await adminSupabase
      .from('blog_posts')
      .update(postData)
      .eq('id', data.id)
      .select()
      .single()
  } else {
    // Create new post
    result = await adminSupabase
      .from('blog_posts')
      .insert(postData)
      .select()
      .single()
  }

  if (result.error) {
    console.error('Error upserting blog post:', result.error)
    throw new Error(result.error.message)
  }

  // Record action in audit logs
  await adminSupabase.from('admin_audit_logs').insert({
    admin_id: user.id,
    action: data.id ? 'UPDATE_BLOG_POST' : 'CREATE_BLOG_POST',
    details: {
      post_id: result.data.id,
      slug: result.data.slug,
      title: result.data.title,
      status: result.data.status
    }
  })

  revalidatePath('/blog')
  return { success: true, data: result.data }
}
