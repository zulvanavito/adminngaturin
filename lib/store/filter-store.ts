import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FilterState {
  users: { role: string; status: string; plan: string }
  billing: { status: string; plan_id: string }
  audit: { action: string }
  blog: { status: string; category: string }
  
  setFilter: (module: 'users' | 'billing' | 'audit' | 'blog', key: string, value: string) => void
  resetFilters: (module: 'users' | 'billing' | 'audit' | 'blog') => void
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      users: { role: '', status: '', plan: '' },
      billing: { status: '', plan_id: '' },
      audit: { action: '' },
      blog: { status: '', category: '' },
      
      setFilter: (module, key, value) => set((state) => ({
        [module]: { ...state[module], [key]: value }
      })),
      
      resetFilters: (module) => set((state) => ({
        [module]: 
          module === 'users' ? { role: '', status: '', plan: '' } :
          module === 'billing' ? { status: '', plan_id: '' } :
          module === 'audit' ? { action: '' } :
          { status: '', category: '' }
      }))
    }),
    {
      name: 'ngaturin-filter-storage',
    }
  )
)
