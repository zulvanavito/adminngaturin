import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  isSidebarOpen: boolean
  density: 'compact' | 'comfortable'
  toggleSidebar: () => void
  setDensity: (density: 'compact' | 'comfortable') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      density: 'compact',
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setDensity: (density) => set({ density }),
    }),
    {
      name: 'ui-storage',
    }
  )
)
