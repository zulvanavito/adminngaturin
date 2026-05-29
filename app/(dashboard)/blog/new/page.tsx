'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TiptapEditor } from '@/components/blog/tiptap-editor'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  Check, 
  AlertCircle,
  Hash,
  Type,
  Layout,
  Tag as TagIcon
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { upsertBlogPostAction } from '@/app/actions/blog-actions'
import { BlogStatus } from '@/types/blog'

export default function NewBlogPostPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  
  // Form State
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('Productivity')
  const [tags, setTags] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [status, setStatus] = useState<BlogStatus>('draft')
  const [content, setContent] = useState('')

  // Auto-generate slug from title
  useEffect(() => {
    if (title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
      setSlug(generatedSlug)
    }
  }, [title])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setIsUploadingCover(true)
      const file = e.target.files[0]
      
      try {
        const res = await fetch('/api/admin/blog/media/presigned-url', {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
        })
        
        if (!res.ok) throw new Error('Failed to get upload URL')
        const { uploadUrl, cdnUrl } = await res.json()
        
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })
        
        if (!uploadRes.ok) throw new Error('Failed to upload image')
        setCoverImageUrl(cdnUrl)
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload cover image')
      } finally {
        setIsUploadingCover(false)
      }
    }
  }

  const handleSave = async () => {
    if (!title || !slug || !content) {
      alert('Please fill in required fields: Title, Slug, and Content')
      return
    }

    setIsSubmitting(true)
    try {
      await upsertBlogPostAction({
        title,
        slug,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        excerpt,
        cover_image_url: coverImageUrl || undefined,
        is_featured: isFeatured,
        status,
        content,
      })
      router.push('/blog')
      router.refresh()
    } catch (error: any) {
      alert(`Error saving post: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-12 sticky top-0 z-20 bg-background/80 backdrop-blur-md py-4">
        <Link href="/blog">
          <Button variant="secondary" size="sm" className="rounded-wise-pill gap-2 bg-white border border-border">
            <ArrowLeft size={16} /> Back to Engine
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex bg-near-black/5 p-1 rounded-wise-pill border border-border">
            {(['draft', 'published', 'archived'] as BlogStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "px-4 py-1.5 rounded-wise-pill text-[10px] font-black uppercase tracking-widest transition-all",
                  status === s 
                    ? "bg-white text-near-black shadow-sm" 
                    : "text-muted-foreground hover:text-near-black"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting}
            className="bg-wise-green text-wise-green-dark rounded-wise-pill px-6 h-10 text-[10px] font-black uppercase tracking-widest transition-transform hover:scale(1.05) active:scale(0.95)"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-wise-green-dark border-t-transparent animate-spin rounded-full" />
            ) : (
              <><Save size={14} className="mr-2" /> {status === 'published' ? 'Publish Story' : 'Save Draft'}</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-12">
          {/* Title Area */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-wise-gray">
              <Type size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Story Title</span>
            </div>
            <textarea
              placeholder="The Title of Your Masterpiece"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={1}
              className="w-full text-5xl font-black text-near-black tracking-tight leading-[0.85] bg-transparent border-none outline-none resize-none placeholder:text-near-black/10 font-wise"
            />
          </div>

          {/* Slug & Meta Area */}
          <div className="flex flex-wrap gap-8 items-center border-y border-border/50 py-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-wise-gray">
                <Hash size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">Permanent Link</span>
              </div>
              <div className="flex items-center text-sm font-bold text-wise-cyan-dark">
                ngaturin.com/blog/
                <input 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="bg-wise-cyan/5 border-none outline-none px-1 rounded text-wise-cyan-dark"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-wise-gray">
                <Layout size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">Category</span>
              </div>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold text-near-black cursor-pointer appearance-none"
              >
                <option>Productivity</option>
                <option>Budgeting</option>
                <option>Financial Freedom</option>
                <option>Inside Ngaturin</option>
                <option>Guide</option>
              </select>
            </div>
          </div>

          {/* Editor Area */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-wise-gray">The Content</span>
              {content.length > 0 && (
                 <span className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase tracking-widest">
                   <Check size={10} /> Auto-saving to state
                 </span>
              )}
            </div>
            <TiptapEditor 
              content={content} 
              onChange={setContent} 
              placeholder="It was a dark and stormy night..." 
            />
          </div>
        </div>

        {/* Sidebar Configuration */}
        <div className="space-y-12">
          {/* Cover Image */}
          <div className="bg-white p-8 rounded-[40px] border border-border shadow-ring space-y-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-wise-gray block">Cover Presentation</span>
            
            {coverImageUrl ? (
              <div className="relative group rounded-2xl overflow-hidden aspect-[4/3] border border-border">
                <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setCoverImageUrl('')}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  disabled={isUploadingCover}
                />
                <div className="aspect-[4/3] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 text-wise-gray hover:bg-near-black/5 transition-colors">
                  {isUploadingCover ? (
                    <div className="h-6 w-6 border-2 border-wise-cyan border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <>
                      <Upload size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-center">Upload High-Res<br/>Cover Image</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div className="bg-white p-8 rounded-[40px] border border-border shadow-ring space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-wise-gray block">Summary / Excerpt</span>
            <textarea
              placeholder="A brief hook to grab attention..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-border bg-near-black/[0.02] p-4 text-sm font-semibold outline-none focus:ring-1 focus:ring-wise-cyan transition-all resize-none"
            />
          </div>

          {/* Tags */}
          <div className="bg-white p-8 rounded-[40px] border border-border shadow-ring space-y-4">
            <div className="flex items-center gap-2 text-wise-gray">
              <TagIcon size={12} />
              <span className="text-[10px] font-black uppercase tracking-widest">Metadata Tags</span>
            </div>
            <input
              placeholder="money, savings, tips"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-wise-pill border border-border bg-near-black/[0.02] px-4 py-2 text-sm font-semibold outline-none focus:ring-1 focus:ring-wise-cyan transition-all"
            />
            <p className="text-[10px] text-wise-gray font-medium px-1">Separate with commas</p>
          </div>

          {/* Toggles */}
          <div className="bg-white p-8 rounded-[40px] border border-border shadow-ring">
             <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-near-black">Featured Post</span>
                  <span className="text-[10px] text-wise-gray font-bold">Show on homepage hero</span>
                </div>
                <div 
                  onClick={() => setIsFeatured(!isFeatured)}
                  className={cn(
                    "w-12 h-6 rounded-wise-pill transition-all relative border border-border",
                    isFeatured ? "bg-wise-green" : "bg-near-black/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full transition-all",
                    isFeatured ? "right-1 bg-dark-green" : "left-1 bg-white shadow-sm"
                  )} />
                </div>
             </label>
          </div>

          {/* Integrity Check */}
          <div className="p-6 rounded-[30px] bg-wise-cyan/5 border border-wise-cyan/20 space-y-3">
             <div className="flex items-center gap-2 text-wise-cyan-dark">
               <AlertCircle size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">Ready to go?</span>
             </div>
             <ul className="space-y-1.5">
                {[
                  { label: 'Title defined', ok: !!title },
                  { label: 'Content written', ok: content.length > 50 },
                  { label: 'Cover uploaded', ok: !!coverImageUrl },
                  { label: 'Excerpt present', ok: !!excerpt },
                ].map((check, i) => (
                  <li key={i} className="flex items-center gap-2 text-[10px] font-bold">
                    <div className={cn("h-1.5 w-1.5 rounded-full", check.ok ? "bg-green-500" : "bg-near-black/20")} />
                    <span className={check.ok ? "text-near-black" : "text-wise-gray"}>{check.label}</span>
                  </li>
                ))}
             </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
