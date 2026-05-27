'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { UsersTable } from '@/components/users/users-table'
import { getUsersAction } from '@/app/actions/user-actions'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CombinedUser } from '@/types/user'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsersAction(),
  })

  // REAL-TIME XP UPDATE LOGIC
  useEffect(() => {
    const channel = supabase
      .channel('gamification-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gamification_profiles',
        },
        (payload) => {
          console.log('Realtime XP Update Received:', payload.new)
          // Update TanStack Query Cache directly for instant UI feedback
          queryClient.setQueryData(['users'], (oldData: CombinedUser[] | undefined) => {
            if (!oldData) return oldData
            return oldData.map((user) => {
              if (user.user_id === payload.new.user_id) {
                return {
                  ...user,
                  gamification: {
                    ...user.gamification,
                    xp: payload.new.xp,
                    level: payload.new.level,
                  },
                }
              }
              return user
            })
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, queryClient])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-6xl font-black text-near-black uppercase leading-none">
          USER<span className="text-wise-cyan">DIRECTORY</span>
        </h1>
        <p className="mt-4 text-sm font-bold text-wise-gray uppercase tracking-widest text-[10px]">
          Manage profiles, XP adjustments, and administrative roles.
        </p>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-wise-cyan" />
        </div>
      ) : error ? (
        <div className="rounded-wise-md border border-red-100 bg-red-50 p-4 text-red-600 font-bold">
          Error loading users: {(error as Error).message}
        </div>
      ) : (
        <UsersTable data={data || []} />
      )}
    </div>
  )
}
