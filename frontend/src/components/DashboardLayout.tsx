'use client'

import { ReactNode } from 'react'
import Link from 'next/link'

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">▢</span>
              </div>
              <span className="text-white font-bold text-xl">CNC Intelligence</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-slate-300 hover:text-white transition">Dashboard</Link>
              <Link href="/machines" className="text-slate-300 hover:text-white transition">Machines</Link>
              <Link href="/analytics" className="text-slate-300 hover:text-white transition">Analytics</Link>
              <Link href="/profile" className="text-slate-300 hover:text-white transition">Profile</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800/50 backdrop-blur-sm mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>CNC Intelligence Platform v1.0.0 © 2024. Built for Real Factories.</p>
        </div>
      </footer>
    </div>
  )
}
