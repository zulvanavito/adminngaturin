'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      // Check for user role in user_profiles
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
          setError('Access Denied: You do not have administrative privileges.')
          await supabase.auth.signOut()
          setIsLoading(false)
          return
        }

        // Success - redirect to dashboard
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-black text-near-black leading-tight">
            ADMIN<span className="text-wise-green">LOGIN</span>
          </h1>
          <p className="mt-4 text-sm font-semibold text-wise-gray uppercase tracking-wider">
            Operational Console v1.0.0
          </p>
        </div>

        <form onSubmit={handleLogin} className="wise-card space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600 border border-red-100 animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-near-black">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@ngaturin.com"
              className="w-full rounded-wise-sm border border-border bg-white px-4 py-3 text-sm font-semibold text-near-black outline-none focus:ring-1 focus:ring-wise-green transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-near-black">
              Security Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-wise-sm border border-border bg-white px-4 py-3 text-sm font-semibold text-near-black outline-none focus:ring-1 focus:ring-wise-green transition-all"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-lg"
          >
            {isLoading ? 'Verifying Credentials...' : 'Sign In to Console'}
          </Button>
        </form>

        <p className="text-center text-[10px] font-semibold text-wise-gray uppercase tracking-widest">
          Secured by Supabase RBAC & Midtrans Audit Engine
        </p>
      </div>
    </div>
  )
}
