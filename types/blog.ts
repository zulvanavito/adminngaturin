export type PostStatus = 'draft' | 'published' | 'archived';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string | null;
  category: string;
  tags: string[];
  status: PostStatus;
  is_featured: boolean;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  cover_image_url?: string;
  tags?: string[];
  status?: PostStatus;
  is_featured?: boolean;
}
