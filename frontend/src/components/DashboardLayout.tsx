'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { LogOut, Settings, User } from 'lucide-react'

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/auth/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">▢</span>
              </div>
              <span className="text-white font-bold text-xl">CNC Intelligence</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/dashboard" className="text-slate-300 hover:text-white transition text-sm">Dashboard</Link>
              <Link href="/dashboard" className="text-slate-300 hover:text-white transition text-sm">Machines</Link>
              <Link href="/dashboard" className="text-slate-300 hover:text-white transition text-sm">Analytics</Link>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition"
                >
                  <User className="w-4 h-4 text-slate-300" />
                  <span className="text-sm text-slate-300">Account</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-lg">
                    <Link href="/dashboard/profile" className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-600/50 hover:text-white transition text-sm border-b border-slate-600">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-600/50 hover:text-white transition text-sm border-b border-slate-600">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-600/50 hover:text-red-300 transition text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
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
