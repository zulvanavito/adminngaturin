import { Sidebar } from "@/components/shared/Sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-light-surface/30">
      {/* Permanent Sidebar for Desktop */}
      <aside className="hidden md:flex h-full transition-all duration-300">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Spacer or Header can go here if needed */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  )
}
