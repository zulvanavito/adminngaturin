import { Metadata } from 'next'
import { getBlogPostsAction } from '@/app/actions/blog-actions'
import { BlogTable } from '@/components/blog/blog-table'
import { PenTool } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog CMS | Admin Console',
  description: 'Manage articles and content for Ngaturin.',
}

export default async function BlogDashboardPage() {
  const posts = await getBlogPostsAction()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-wise-green p-3 rounded-2xl shadow-ring">
            <PenTool className="h-8 w-8 text-dark-green" />
          </div>
          <h1 className="text-6xl font-black text-near-black tracking-tight leading-[0.85] font-wise">
            CONTENT<br />ENGINE
          </h1>
        </div>
        <p className="text-lg font-semibold text-wise-gray max-w-2xl mt-4">
          Draft, publish, and manage all articles on the Ngaturin ecosystem. 
          Use the Wise Editor for a distraction-free writing experience.
        </p>
      </div>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[30px] border border-border shadow-ring flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Total Articles</span>
          <span className="text-5xl font-black text-near-black">{posts.length}</span>
        </div>
        <div className="bg-white p-8 rounded-[30px] border border-border shadow-ring flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Published</span>
          <span className="text-5xl font-black text-green-600">
            {posts.filter(p => p.status === 'published').length}
          </span>
        </div>
        <div className="bg-white p-8 rounded-[30px] border border-border shadow-ring flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Drafts</span>
          <span className="text-5xl font-black text-amber-500">
            {posts.filter(p => p.status === 'draft').length}
          </span>
        </div>
      </div>

      {/* Articles Table */}
      <div className="mt-12">
        <BlogTable data={posts} />
      </div>
    </div>
  )
}
