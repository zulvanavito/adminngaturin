'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  PenTool, 
  LogOut,
  ShieldAlert,
  History
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'User Directory', href: '/users', icon: Users },
  { name: 'Billing & Reconciliation', href: '/billing', icon: Receipt },
  { name: 'Audit Logs', href: '/audit-logs', icon: History },
  { name: 'Headless CMS', href: '/blog', icon: PenTool },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-white">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
        <Link href="/" className="flex items-center">
          <h1 className="text-xl font-black text-near-black">
            ADMIN<span className="text-wise-cyan">CONSOLE</span>
          </h1>
        </Link>
      </div>
      
      {/* Navigation Links */}
      <div className="flex flex-1 flex-col overflow-y-auto pt-6 px-4">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive 
                    ? 'bg-wise-cyan/10 text-wise-cyan-dark' 
                    : 'text-muted-foreground hover:bg-near-black/5 hover:text-near-black',
                  'group flex items-center rounded-wise-sm px-3 py-2 text-sm font-bold transition-transform duration-200 hover:scale(1.02) active:scale(0.98)'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-wise-cyan-dark' : 'text-muted-foreground group-hover:text-near-black',
                    'mr-3 h-5 w-5 shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer: Admin Status & Sign Out */}
        <div className="mt-auto border-t border-border pt-4 pb-6 space-y-1">
          <div className="px-3 py-2 flex items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
            <ShieldAlert className="mr-2 h-3 w-3" />
            Admin Privileges
          </div>
          <button
            onClick={handleSignOut}
            className="w-full group flex items-center rounded-wise-sm px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale(1.02) active:scale(0.98)"
          >
            <LogOut className="mr-3 h-5 w-5 shrink-0 text-red-500 group-hover:text-red-700" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
