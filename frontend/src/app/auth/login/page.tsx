'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify({ email, name: email.split('@')[0] }))
      window.location.href = '/dashboard'
    } catch (err) {
      setError('Invalid credentials. Demo: admin@mayankiitj.in / password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-cyan-500/20 p-3 rounded-lg">
                <LogIn className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
            <p className="text-slate-400">Sign in to your CNC Intelligence account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center space-y-3">
            <p className="text-slate-400">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                Sign Up
              </Link>
            </p>
            <div className="text-xs text-slate-500">
              <p>Demo: admin@mayankiitj.in / password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
