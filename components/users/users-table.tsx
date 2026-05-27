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
import { CombinedUser } from '@/types/user'
import { format } from 'date-fns'
import { 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    RefreshCcw, 
    MoreHorizontal,
    Trash2,
    Ban,
    UserCheck,
    CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserActions } from './user-actions'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { 
    bulkDeleteUsersAction, 
    bulkSuspendUsersAction 
} from '@/app/actions/user-actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UsersTableProps {
  data: CombinedUser[]
}

export function UsersTable({ data }: UsersTableProps) {
  const queryClient = useQueryClient()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [rowSelection, setRowSelection] = React.useState({})
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [lastSync, setLastSync] = React.useState<Date>(new Date())

  // Bulk Dialog States
  const [showBulkDeleteModal, setShowBulkDeleteModal] = React.useState(false)
  const [bulkDeleteReason, setBulkDeleteReason] = React.useState('')

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['users'] })
    setLastSync(new Date())
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const bulkMutation = useMutation({
    mutationFn: async ({ type, payload }: { type: string, payload: any }) => {
        if (type === 'suspend') return bulkSuspendUsersAction(payload.ids, payload.status)
        if (type === 'delete') return bulkDeleteUsersAction(payload.ids, payload.reason)
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        setRowSelection({})
        setShowBulkDeleteModal(false)
        setBulkDeleteReason('')
        alert('Bulk action successful')
    },
    onError: (error: any) => {
        alert(`Bulk Error: ${error.message}`)
    }
  })

  const columns: ColumnDef<CombinedUser>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          aria-label="Select all"
          className="h-4 w-4 rounded border-border text-wise-cyan focus:ring-wise-cyan"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          aria-label="Select row"
          className="h-4 w-4 rounded border-border text-wise-cyan focus:ring-wise-cyan"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'user',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-near-black">{row.original.display_name || 'Anonymous User'}</span>
          <span className="text-[10px] text-wise-gray lowercase font-semibold">{row.original.email || 'No email'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
          row.getValue('role') === 'admin' ? "bg-red-100 text-red-700" : 
          row.getValue('role') === 'moderator' ? "bg-blue-100 text-blue-700" : "bg-wise-cyan/20 text-wise-cyan-dark"
        )}>
          {row.getValue('role')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
          row.getValue('status') === 'suspended' ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
        )}>
          {row.getValue('status') || 'active'}
        </span>
      ),
    },
    {
      accessorKey: 'gamification.level',
      header: 'Level',
      cell: ({ row }) => <span className="text-sm font-black text-near-black">Lvl {row.original.gamification?.level || 1}</span>,
    },
    {
      accessorKey: 'gamification.xp',
      header: 'XP Points',
      cell: ({ row }) => <span className="text-sm font-black text-wise-cyan-dark">{row.original.gamification?.xp || 0} XP</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ row }) => <span className="text-xs text-wise-gray font-semibold">{format(new Date(row.getValue('created_at')), 'dd MMM yy')}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => <UserActions user={row.original} />,
    }
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  const selectedRows = table.getSelectedRowModel().rows
  const selectedCount = selectedRows.length

  const handleBulkSuspend = (status: 'active' | 'suspended') => {
    const ids = selectedRows.map(r => r.original.user_id)
    if (confirm(`Apply ${status} to ${selectedCount} users?`)) {
        bulkMutation.mutate({ type: 'suspend', payload: { ids, status } })
    }
  }

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wise-gray" />
            <input
                placeholder="Search users..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="w-full rounded-wise-pill border border-border bg-white pl-10 pr-4 py-2 text-sm font-semibold outline-none focus:ring-1 focus:ring-wise-cyan transition-all"
            />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-wise-gray tracking-widest leading-tight">Data Health</span>
                <span className="text-[10px] font-bold text-near-black flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
                    Last sync: {format(lastSync, 'HH:mm:ss')}
                </span>
            </div>
        </div>

        <div className="flex items-center gap-2">
            {selectedCount > 0 && (
                <div className="flex items-center gap-2 mr-4 bg-wise-cyan/5 border border-wise-cyan/20 px-3 py-1 rounded-wise-pill animate-in fade-in slide-in-from-right-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-wise-cyan-dark mr-2">
                        {selectedCount} Selected
                    </span>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleBulkSuspend('suspended')}
                        className="h-7 text-[10px] font-black uppercase tracking-widest bg-white"
                    >
                        <Ban className="h-3 w-3 mr-1 text-amber-600" /> Suspend
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleBulkSuspend('active')}
                        className="h-7 text-[10px] font-black uppercase tracking-widest bg-white"
                    >
                        <UserCheck className="h-3 w-3 mr-1 text-green-600" /> Activate
                    </Button>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => setShowBulkDeleteModal(true)}
                        className="h-7 text-[10px] font-black uppercase tracking-widest bg-white text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                </div>
            )}

           <Button 
             variant="secondary" 
             size="sm" 
             onClick={handleRefresh}
             className="text-[10px] font-black uppercase tracking-widest gap-2 bg-white border border-border"
           >
              <RefreshCcw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
              Sync Data
           </Button>
        </div>
      </div>

      {/* The Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black text-wise-gray uppercase tracking-widest">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} of{' '}
          {data.length} users
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

      {/* Bulk Delete Modal */}
      <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
        <DialogContent className="border-red-200">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-red-100 p-2">
                    <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <DialogTitle className="text-red-600 text-[26px]">Bulk Delete Users</DialogTitle>
            </div>
            <DialogDescription>
                You are about to permanently delete <span className="font-black text-near-black">{selectedCount} users</span>. This will wipe all their data across all tables.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-wise-gray">Reason for Bulk Deletion</label>
                <textarea 
                    value={bulkDeleteReason}
                    onChange={(e) => setBulkDeleteReason(e.target.value)}
                    required
                    rows={3}
                    className="w-full rounded-wise-sm border border-border bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-red-600"
                    placeholder="e.g. Bot accounts cleanup"
                />
            </div>
            <DialogFooter>
                <Button variant="secondary" type="button" onClick={() => setShowBulkDeleteModal(false)}>Cancel</Button>
                <Button 
                    variant="destructive" 
                    disabled={!bulkDeleteReason || bulkMutation.isPending}
                    onClick={() => bulkMutation.mutate({ 
                        type: 'delete', 
                        payload: { ids: selectedRows.map(r => r.original.user_id), reason: bulkDeleteReason } 
                    })}
                    className="bg-red-600"
                >
                    {bulkMutation.isPending ? 'Executing Bulk Wipe...' : `Confirm Wipe (${selectedCount})`}
                </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
