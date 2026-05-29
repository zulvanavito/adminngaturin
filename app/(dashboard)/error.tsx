'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="h-[calc(100vh-160px)] w-full flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-500">
      <div className="bg-white p-12 rounded-[40px] border border-border shadow-ring max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
            <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
        </div>
        
        <div className="space-y-2">
            <h2 className="text-3xl font-black text-near-black tracking-tight leading-none uppercase">
                System Collision
            </h2>
            <p className="text-sm font-semibold text-wise-gray">
                An unexpected error occurred while processing your request. The engine has been halted for safety.
            </p>
        </div>

        {error.digest && (
            <div className="bg-near-black/5 p-3 rounded-wise-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-near-black/40">
                    Incident ID: {error.digest}
                </p>
            </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
            <Button 
                onClick={() => reset()}
                className="w-full bg-near-black text-white rounded-wise-pill h-12 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
            >
                <RotateCcw size={14} /> Restart Engine (Try Again)
            </Button>
            <Link href="/" className="w-full">
                <Button 
                    variant="outline"
                    className="w-full border-border rounded-wise-pill h-12 text-[10px] font-black uppercase tracking-widest hover:bg-near-black/5 gap-2"
                >
                    <Home size={14} /> Return to Base
                </Button>
            </Link>
        </div>
      </div>
    </div>
  )
}
