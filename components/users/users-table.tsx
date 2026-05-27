"use client";

import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { getUsersList } from "@/app/actions/user-actions";

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: "user" | "moderator" | "admin";
  level: number;
  xp: number;
  status: "active" | "suspended";
};

const columnHelper = createColumnHelper<UserProfile>();

const columns = [
  columnHelper.display({
    id: "no",
    header: "No",
    cell: (info) => (
      <span className="font-semibold text-gray-400">
        {info.row.index +
          1 +
          info.table.getState().pagination.pageIndex *
            info.table.getState().pagination.pageSize}
      </span>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("full_name", {
    header: "Full Name",
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => <span className="text-gray-500">{info.getValue()}</span>,
  }),
  columnHelper.accessor("role", {
    header: "Role",
    cell: (info) => {
      const role = info.getValue();
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          role === 'admin' ? 'bg-wise-green text-[#163300]' : 
          role === 'moderator' ? 'bg-blue-100 text-blue-800' : 
          'bg-gray-100 text-gray-800'
        }`}>
          {role.toUpperCase()}
        </span>
      );
    },
  }),
  columnHelper.accessor("level", {
    header: "Level",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("xp", {
    header: "XP",
    cell: (info) => info.getValue().toLocaleString(),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status.toUpperCase()}
        </span>
      );
    },
  }),
];

export function UsersTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsersList(),
  });

  const table = useReactTable({
    data: users || [],
    columns,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center border border-[rgba(14,15,12,0.12)] rounded-[16px] bg-white">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-wise-green border-t-transparent rounded-full mb-2"></div>
        <p className="text-gray-500 font-medium">Memuat data pengguna...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center border border-red-200 bg-red-50 rounded-[16px] text-red-600">
        Terjadi kesalahan saat memuat data.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border border-[rgba(14,15,12,0.12)] rounded-[16px] overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f8f9f7] text-[#0e0f0c] border-b border-[rgba(14,15,12,0.12)] uppercase">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-6 py-4 font-semibold whitespace-nowrap">
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "cursor-pointer select-none flex items-center gap-2 hover:text-wise-green-dark transition-colors"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <ChevronUp className="w-4 h-4" />,
                            desc: <ChevronDown className="w-4 h-4" />,
                          }[header.column.getIsSorted() as string] ?? (
                            header.column.getCanSort() ? <ChevronsUpDown className="w-4 h-4 text-gray-300" /> : null
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[rgba(14,15,12,0.06)] hover:bg-[#f8f9f7] transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-[#0e0f0c]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500 font-medium">
                    Tidak ada data pengguna.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-gray-500 font-medium">
          Menampilkan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} sampai {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} dari {table.getFilteredRowModel().rows.length} data
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="px-3 py-1.5 text-sm font-semibold border border-[rgba(14,15,12,0.12)] rounded-full disabled:opacity-50 hover:bg-[#f8f9f7] transition-colors"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Sebelumnya
          </button>
          <button
            className="px-3 py-1.5 text-sm font-semibold border border-[rgba(14,15,12,0.12)] rounded-full disabled:opacity-50 hover:bg-[#f8f9f7] transition-colors"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
}
