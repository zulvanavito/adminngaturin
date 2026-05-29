'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Image as ImageIcon,
  Link as LinkIcon,
  Quote,
  Undo,
  Redo
} from 'lucide-react'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full h-auto my-8 border border-border/50',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-wise-cyan-dark underline underline-offset-4 font-bold',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing your story...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] px-6 py-8',
      },
    },
  })

  const addImage = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      if (input.files?.length) {
        const file = input.files[0]
        
        try {
          // 1. Get presigned URL
          const res = await fetch('/api/admin/blog/media/presigned-url', {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
            }),
          })
          
          if (!res.ok) throw new Error('Failed to get upload URL')
          const { uploadUrl, cdnUrl } = await res.json()
          
          // 2. Upload to R2
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          })
          
          if (!uploadRes.ok) throw new Error('Failed to upload image')
          
          // 3. Insert into editor
          editor?.chain().focus().setImage({ src: cdnUrl }).run()
        } catch (error) {
          console.error('Upload error:', error)
          alert('Failed to upload image')
        }
      }
    }
    input.click()
  }, [editor])

  if (!editor) {
    return null
  }

  const MenuButton = ({ 
    onClick, 
    isActive = false, 
    children 
  }: { 
    onClick: () => void, 
    isActive?: boolean, 
    children: React.ReactNode 
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-90",
        isActive 
          ? "bg-wise-green text-wise-green-dark shadow-sm" 
          : "text-muted-foreground hover:bg-near-black/5 hover:text-near-black"
      )}
    >
      {children}
    </button>
  )

  return (
    <div className="w-full border border-border rounded-[30px] overflow-hidden bg-white shadow-ring">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-light-surface/30 backdrop-blur-sm sticky top-0 z-10">
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        >
          <Bold size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        >
          <Italic size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
        >
          <UnderlineIcon size={18} />
        </MenuButton>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 size={18} />
        </MenuButton>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        >
          <List size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        >
          <ListOrdered size={18} />
        </MenuButton>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <MenuButton 
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
        >
          <AlignLeft size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
        >
          <AlignCenter size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
        >
          <AlignRight size={18} />
        </MenuButton>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <MenuButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
        >
          <Quote size={18} />
        </MenuButton>
        <MenuButton onClick={addImage}>
          <ImageIcon size={18} />
        </MenuButton>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <MenuButton onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={18} />
        </MenuButton>
      </div>
      
      <EditorContent editor={editor} />
      
      <div className="px-6 py-2 border-t border-border bg-light-surface/10 text-[10px] font-black text-muted-foreground uppercase tracking-widest flex justify-between">
        <span>Wise Editor Pro</span>
        <span>{editor.storage.characterCount?.characters?.() || 0} characters</span>
      </div>
    </div>
  )
}
