import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

interface NotificationState {
  toasts: Toast[]
  addToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = Date.now().toString()
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }))
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 5000)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
