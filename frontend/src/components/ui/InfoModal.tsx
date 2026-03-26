'use client'

import { X } from 'lucide-react'

interface InfoModalProps {
  open: boolean
  onClose: () => void
  title: string
  message: string
  icon?: React.ReactNode
}

export default function InfoModal({ open, onClose, title, message, icon }: InfoModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-sm w-full shadow-2xl text-center">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {icon && (
          <div className="bg-cyan-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            {icon}
          </div>
        )}
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 text-sm">{message}</p>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 rounded-lg transition"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
