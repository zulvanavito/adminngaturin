'use client'

import { useNotificationStore, ToastType } from '@/lib/store/notification-store'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

export function Toaster() {
  const { toasts, removeToast } = useNotificationStore()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-wise-pill shadow-lg border border-border animate-in slide-in-from-right-full duration-300",
              toast.type === 'success' && "bg-wise-green text-wise-green-dark",
              toast.type === 'error' && "bg-red-600 text-white",
              toast.type === 'info' && "bg-near-black text-white"
            )}
            role="alert"
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-sm font-black">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-full hover:bg-black/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
