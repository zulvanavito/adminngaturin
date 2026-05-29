'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { CreatePostInput } from '@/types/blog'
import { revalidatePath } from 'next/cache'

export async function getPostsAction() {
  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function savePostAction(input: CreatePostInput & { id?: string }) {
  const adminSupabase = createAdminClient()
  const publicSupabase = await createClient()

  const { data: { user } } = await publicSupabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const slug = input.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
  
  const postData = {
    ...input,
    slug,
    author_id: user.id,
    updated_at: new Date().toISOString(),
    published_at: input.status === 'published' ? new Date().toISOString() : null
  }

  let error
  if (input.id) {
    const { error: updateError } = await adminSupabase
      .from('blog_posts')
      .update(postData)
      .eq('id', input.id)
    error = updateError
  } else {
    const { error: insertError } = await adminSupabase
      .from('blog_posts')
      .insert(postData)
    error = insertError
  }

  if (error) throw new Error(error.message)

  revalidatePath('/blog')
  return { success: true }
}
