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
import { SubscriptionLog } from '@/types/billing'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { BillingActions } from './billing-actions'
import { reconcileBatchAction } from '@/app/actions/billing-actions'
import { RefreshCcw, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface BillingTableProps {
  data: SubscriptionLog[]
}

export function BillingTable({ data }: BillingTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [isReconciling, setIsReconciling] = React.useState(false)
  const [reconcileProgress, setReconcileProgress] = React.useState(0)

  const runReconciliation = async () => {
    const pendingLogs = data.filter(log => log.status === 'pending')
    if (pendingLogs.length === 0) return

    setIsReconciling(true)
    setReconcileProgress(0)

    const batchSize = 5
    const total = pendingLogs.length
    let processedCount = 0

    // Process in batches of 5
    for (let i = 0; i < total; i += batchSize) {
      const batch = pendingLogs.slice(i, i + batchSize)
      const orderIds = batch.map(log => log.midtrans_order_id).filter((id): id is string => !!id)
      
      if (orderIds.length > 0) {
        try {
          await reconcileBatchAction(orderIds)
        } catch (error) {
          console.error("Batch reconciliation error:", error)
        }
      }
      
      processedCount += batch.length
      setReconcileProgress(Math.round((processedCount / total) * 100))
    }

    setIsReconciling(false)
    setTimeout(() => setReconcileProgress(0), 2000)
  }

  const columns: ColumnDef<SubscriptionLog>[] = [
    {
      accessorKey: 'midtrans_order_id',
      header: 'Order ID',
      cell: ({ row }) => <span className="text-[10px] font-mono font-bold text-wise-gray">{row.getValue('midtrans_order_id') || 'N/A'}</span>,
    },
    {
      id: 'user',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-near-black">{row.original.display_name || 'User'}</span>
          <span className="text-[10px] text-wise-gray font-semibold lowercase">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'plan_id',
      header: 'Plan',
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-wise-cyan/20 text-wise-cyan-dark">
          {row.getValue('plan_id')}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <span className="text-sm font-black">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.getValue('amount'))}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
            status === 'settlement' ? "bg-green-100 text-green-700" : 
            status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
          )}>
            {status}
          </span>
        )
      },
    },
    {
        accessorKey: 'current_period_end',
        header: 'Expiry Date',
        cell: ({ row }) => {
            const date = row.getValue('current_period_end')
            return <span className="text-xs font-semibold text-wise-gray">{date ? format(new Date(date as string), 'dd MMM yyyy') : '-'}</span>
        },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => <BillingActions log={row.original} />,
    }
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wise-gray" />
          <input
            placeholder="Search transactions..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full rounded-wise-pill border border-border bg-white pl-10 pr-4 py-2 text-sm font-semibold outline-none focus:ring-1 focus:ring-wise-cyan transition-all"
          />
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end">
          {(isReconciling || reconcileProgress > 0) && (
            <div className="flex flex-col items-end gap-1 flex-1 max-w-[200px]">
              <div className="flex justify-between w-full px-1">
                <span className="text-[10px] font-black uppercase text-near-black">
                  {isReconciling ? "Syncing..." : "Sync Complete"}
                </span>
                <span className="text-[10px] font-black text-near-black">{reconcileProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-wise-gray/10 rounded-full overflow-hidden border border-near-black/5">
                <div 
                  className="h-full bg-wise-green transition-all duration-500 ease-out" 
                  style={{ width: `${reconcileProgress}%` }}
                />
              </div>
            </div>
          )}

          <Button
            onClick={runReconciliation}
            disabled={isReconciling || data.filter(l => l.status === 'pending').length === 0}
            variant="default"
            className="font-bold min-w-[140px]"
          >
            {isReconciling ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCcw className="h-4 w-4 mr-2" />
            )}
            {isReconciling ? "Processing..." : `Reconcile Pending (${data.filter(l => l.status === 'pending').length})`}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No transactions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black text-wise-gray uppercase tracking-widest">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} of{' '}
          {data.length} records
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
