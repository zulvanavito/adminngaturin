export type BlogStatus = 'draft' | 'published' | 'archived';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  cover_image_url?: string;
  category: string;
  tags: string[];
  status: BlogStatus;
  is_featured: boolean;
  author_id: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export type CreateBlogPost = Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'author_id'>;
