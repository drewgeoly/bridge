'use client'

import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  message?: string
  show?: boolean
}

export function LoadingOverlay({ message = 'Thinking...', show = true }: LoadingOverlayProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/50 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-slate-700 font-medium">{message}</p>
      </div>
    </div>
  )
}

