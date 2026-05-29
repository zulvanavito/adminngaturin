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
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/lib/store/ui-store'

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
  const { isSidebarOpen, toggleSidebar } = useUIStore()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className={cn(
      "flex h-full flex-col border-r border-border bg-white transition-all duration-300 ease-in-out",
      isSidebarOpen ? "w-64" : "w-20"
    )}>
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border">
        <Link href="/" className={cn("flex items-center transition-opacity duration-300", !isSidebarOpen && "opacity-0 invisible w-0")}>
          <h1 className="text-xl font-black text-near-black whitespace-nowrap">
            ADMIN<span className="text-wise-cyan">CONSOLE</span>
          </h1>
        </Link>
        <button 
          onClick={toggleSidebar}
          className={cn(
            "p-1 rounded-wise-sm hover:bg-near-black/5 text-muted-foreground hover:text-near-black transition-all",
            !isSidebarOpen && "mx-auto"
          )}
        >
          {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
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
                title={!isSidebarOpen ? item.name : undefined}
                className={cn(
                  isActive 
                    ? 'bg-wise-cyan/10 text-wise-cyan-dark' 
                    : 'text-muted-foreground hover:bg-near-black/5 hover:text-near-black',
                  'group flex items-center rounded-wise-sm px-3 py-2 text-sm font-bold transition-all duration-200 hover:scale(1.02) active:scale(0.98)',
                  !isSidebarOpen && "justify-center px-0"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-wise-cyan-dark' : 'text-muted-foreground group-hover:text-near-black',
                    isSidebarOpen ? 'mr-3 h-5 w-5' : 'h-6 w-6',
                    'shrink-0'
                  )}
                  aria-hidden="true"
                />
                {isSidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer: Admin Status & Sign Out */}
        <div className="mt-auto border-t border-border pt-4 pb-6 space-y-1">
          <div className={cn(
            "px-3 py-2 flex items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2",
            !isSidebarOpen && "justify-center px-0"
          )}>
            <ShieldAlert className={cn("h-3 w-3", isSidebarOpen && "mr-2")} />
            {isSidebarOpen && "Admin Privileges"}
          </div>
          <button
            onClick={handleSignOut}
            title={!isSidebarOpen ? "Sign Out" : undefined}
            className={cn(
              "w-full group flex items-center rounded-wise-sm px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale(1.02) active:scale(0.98)",
              !isSidebarOpen && "justify-center px-0"
            )}
          >
            <LogOut className={cn("text-red-500 group-hover:text-red-700 shrink-0", isSidebarOpen ? "mr-3 h-5 w-5" : "h-6 w-6")} />
            {isSidebarOpen && "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  )
}
