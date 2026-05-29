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
import { format } from 'date-fns'
import { 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    RefreshCcw, 
    CheckCircle2,
    Eye,
    Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { useFilterStore } from '@/lib/store/filter-store'

export interface AuditLog {
  id: string
  admin_id: string
  admin_name: string
  admin_email?: string
  action: string
  details: Record<string, unknown>
  created_at: string
}

import Fuse from 'fuse.js'

interface AuditLogsTableProps {
  data: AuditLog[]
}

export function AuditLogsTable({ data }: AuditLogsTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [lastSync, setLastSync] = React.useState<Date>(new Date())
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null)

  const { audit: auditFilters, setFilter } = useFilterStore()

  // Combined filter logic
  const filteredData = React.useMemo(() => {
    let result = data

    // 1. Filter by Action from Zustand
    if (auditFilters.action) {
      result = result.filter(log => log.action.includes(auditFilters.action))
    }

    // 2. Fuzzy search with Fuse.js
    if (!globalFilter) return result

    const fuse = new Fuse(result, {
      keys: ['action', 'admin_name', 'admin_email'],
      threshold: 0.3,
      ignoreLocation: true,
    })

    return fuse.search(globalFilter).map(result => result.item)
  }, [data, globalFilter, auditFilters.action])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    router.refresh()
    setLastSync(new Date())
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'created_at',
      header: 'Timestamp',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'))
        return (
          <div className="flex flex-col">
            <span className="text-sm font-black text-near-black">
              {format(date, 'dd MMM yyyy')}
            </span>
            <span className="text-[10px] text-wise-gray font-semibold">
              {format(date, 'HH:mm:ss')}
            </span>
          </div>
        )
      },
    },
    {
      id: 'admin',
      header: 'Admin',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-near-black">{row.original.admin_name}</span>
          <span className="text-[10px] text-wise-gray lowercase font-semibold">{row.original.admin_email || 'No email'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const action = row.getValue('action') as string
        return (
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
            action.includes('DELETE') ? "bg-red-100 text-red-700" : 
            action.includes('SUSPEND') ? "bg-amber-100 text-amber-700" : 
            action.includes('CREATE') || action.includes('ADJUST') ? "bg-green-100 text-green-700" : 
            "bg-wise-green/20 text-wise-green-dark"
          )}>
            {action.replace(/_/g, ' ')}
          </span>
        )
      },
    },
    {
      id: 'summary',
      header: 'Summary',
      cell: ({ row }) => {
        const details = row.original.details as Record<string, string>
        let summary = 'View details'
        if (details.reason) summary = details.reason
        else if (details.target_user_id) summary = `Target: ${details.target_user_id.split('-')[0]}...`
        
        return (
          <span className="text-xs text-near-black font-semibold truncate max-w-[200px] block">
            {summary}
          </span>
        )
      }
    },
    {
      id: 'actions',
      header: 'Details',
      cell: ({ row }) => (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setSelectedLog(row.original)}
          className="h-8 text-[10px] font-black uppercase tracking-widest bg-white border border-border"
        >
          <Eye className="h-3 w-3 mr-1" /> View
        </Button>
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
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wise-gray" />
            <input
                placeholder="Search logs..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="w-full rounded-wise-pill border border-border bg-white pl-10 pr-4 py-2 text-sm font-semibold outline-none focus:ring-1 focus:ring-wise-green transition-all"
            />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-wise-gray tracking-widest leading-tight">Audit Trail</span>
                <span className="text-[10px] font-bold text-near-black flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
                    Last sync: {format(lastSync, 'HH:mm:ss')}
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
              Refresh Logs
           </Button>
        </div>
      </div>

      {/* The Table */}
      <div className="rounded-wise-xl border border-border bg-white overflow-hidden shadow-[rgba(14,15,12,0.12)_0px_0px_0px_1px]">
        <Table>
            <TableHeader className="bg-near-black/[0.02]">
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border">
                {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-12 text-[10px] font-black uppercase tracking-widest text-wise-gray px-6">
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
                <TableRow 
                    key={row.id} 
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-near-black/[0.01] border-b border-border last:border-0 transition-colors"
                >
                    {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm font-semibold text-wise-gray">
                    No audit logs found.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black text-wise-gray uppercase tracking-widest">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} of{' '}
          {data.length} logs
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0 bg-white border border-border"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0 bg-white border border-border"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl rounded-wise-lg p-0 overflow-hidden border-none shadow-2xl">
          {selectedLog && (
            <div className="flex flex-col">
              <div className="bg-near-black p-8 text-white">
                <div className="flex items-center justify-between mb-6">
                    <span className="bg-wise-cyan text-wise-cyan-dark px-3 py-1 rounded-wise-pill text-[10px] font-black uppercase tracking-widest">
                        Audit Detail
                    </span>
                    <span className="text-wise-gray text-[10px] font-bold">
                        ID: {selectedLog.id}
                    </span>
                </div>
                <h2 className="text-[40px] font-black leading-[0.85] mb-2 uppercase italic tracking-tighter">
                    {selectedLog.action.replace(/_/g, ' ')}
                </h2>
                <p className="text-wise-gray text-sm font-semibold">
                    Executed by {selectedLog.admin_name} on {format(new Date(selectedLog.created_at), 'PPPPpppp')}
                </p>
              </div>
              
              <div className="p-8 bg-white">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-wise-gray mb-4">Payload & Context</h3>
                <div className="bg-near-black/[0.03] rounded-wise-md p-6 border border-border overflow-auto max-h-[400px]">
                    <pre className="text-xs font-mono text-near-black leading-relaxed">
                        {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                </div>
                
                <div className="mt-8 flex justify-end">
                    <Button 
                        variant="secondary" 
                        onClick={() => setSelectedLog(null)}
                        className="btn-pill bg-near-black text-white hover:bg-near-black/90"
                    >
                        Close Inspector
                    </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

)}
                    </pre>
                </div>
                
                <div className="mt-8 flex justify-end">
                    <Button 
                        variant="secondary" 
                        onClick={() => setSelectedLog(null)}
                        className="btn-pill bg-near-black text-white hover:bg-near-black/90"
                    >
                        Close Inspector
                    </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

