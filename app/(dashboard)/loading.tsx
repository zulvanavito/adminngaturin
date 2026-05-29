import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="h-[calc(100vh-160px)] w-full flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-wise-cyan/20 border-t-wise-cyan animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 bg-wise-cyan rounded-full animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-near-black/40">
          Syncing Engine
        </h2>
        <p className="text-[9px] font-bold text-wise-cyan-dark uppercase tracking-widest animate-pulse">
          Fetching Secure Data...
        </p>
      </div>
    </div>
  )
}
