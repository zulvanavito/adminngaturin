'use client'

import * as React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { BlogPost } from '@/types/blog'
import { format } from 'date-fns'
import { 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    RefreshCcw, 
    Edit,
    ExternalLink,
    CheckCircle2,
    Eye,
    Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { deleteBlogPostAction } from '@/app/actions/blog-actions'
import { useRouter } from 'next/navigation'

import Fuse from 'fuse.js'

interface BlogTableProps {
  data: BlogPost[]
}

export function BlogTable({ data }: BlogTableProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [lastSync, setLastSync] = React.useState<Date>(new Date())

  // Fuzzy search logic with Fuse.js
  const filteredData = React.useMemo(() => {
    if (!globalFilter) return data

    const fuse = new Fuse(data, {
      keys: ['title', 'slug', 'category', 'status'],
      threshold: 0.3,
      ignoreLocation: true,
    })

    return fuse.search(globalFilter).map(result => result.item)
  }, [data, globalFilter])

  const handleRefresh = async () => {

    setIsRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
    setLastSync(new Date())
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
        try {
            await deleteBlogPostAction(id)
            router.refresh()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            alert(`Error deleting post: ${message}`)
        }
    }
  }

  const columns: ColumnDef<BlogPost>[] = [
    {
      id: 'post',
      header: 'Post Title',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.cover_image_url && (
            <img 
              src={row.original.cover_image_url} 
              alt="" 
              className="h-10 w-10 rounded-lg object-cover border border-border"
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-black text-near-black line-clamp-1">{row.original.title}</span>
            <span className="text-[10px] text-wise-gray lowercase font-semibold">/{row.original.slug}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-wise-cyan/20 text-wise-cyan-dark">
          {row.getValue('category')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
          row.getValue('status') === 'published' ? "bg-green-100 text-green-700" : 
          row.getValue('status') === 'archived' ? "bg-gray-100 text-gray-700" : "bg-amber-100 text-amber-700"
        )}>
          {row.getValue('status')}
        </span>
      ),
    },
    {
      accessorKey: 'is_featured',
      header: 'Featured',
      cell: ({ row }) => (
        row.getValue('is_featured') ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">
            Featured
          </span>
        ) : <span className="text-[10px] text-wise-gray font-bold uppercase tracking-widest">—</span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => <span className="text-xs text-wise-gray font-semibold">{format(new Date(row.getValue('created_at')), 'dd MMM yy')}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link href={`/blog/edit/${row.original.id}`}>
            <Button variant="secondary" size="sm" className="h-8 w-8 p-0" title="Edit Post">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="secondary" size="sm" className="h-8 w-8 p-0" title="View Publicly" onClick={() => window.open(`https://ngaturin.com/blog/${row.original.slug}`, '_blank')}>
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" 
            title="Delete Post"
            onClick={() => handleDelete(row.original.id, row.original.title)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
  ]

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wise-gray" />
            <input
                placeholder="Search articles..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="w-full rounded-wise-pill border border-border bg-white pl-10 pr-4 py-2 text-sm font-semibold outline-none focus:ring-1 focus:ring-wise-cyan transition-all"
            />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-wise-gray tracking-widest leading-tight">Sync Status</span>
                <span className="text-[10px] font-bold text-near-black flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
                    Last update: {format(lastSync, 'HH:mm:ss')}
                </span>
            </div>
        </div>

        <div className="flex items-center gap-2">
           <Button 
             variant="secondary" 
             size="sm" 
             onClick={handleRefresh}
             className="text-[10px] font-black uppercase tracking-widest gap-2 bg-white border border-border"
           >
              <RefreshCcw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
              Refresh
           </Button>
           <Link href="/blog/new">
             <Button 
               size="sm" 
               className="bg-wise-green text-dark-green rounded-wise-pill px-4 h-9 text-[10px] font-black uppercase tracking-widest transition-transform hover:scale(1.05) active:scale(0.95)"
             >
               Create New Post
             </Button>
           </Link>
        </div>
      </div>

      <div className="rounded-[40px] border border-border bg-white overflow-hidden shadow-ring">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-[10px] font-black uppercase tracking-widest text-wise-gray py-4 px-6">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-light-surface/20 transition-colors border-b border-border/30 last:border-0">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 px-6">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Eye className="h-8 w-8 text-wise-gray/30" />
                    <span className="text-sm font-bold text-wise-gray">No blog posts found.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black text-wise-gray uppercase tracking-widest">
          {data.length} Total Articles
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0 rounded-full bg-white border border-border hover:bg-near-black/5"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0 rounded-full bg-white border border-border hover:bg-near-black/5"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
