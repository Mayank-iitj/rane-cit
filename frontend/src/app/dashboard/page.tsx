'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { MachineList } from '@/components/MachineList'
import { AlertTimeline } from '@/components/AlertTimeline'
import { OptimizationPanel } from '@/components/OptimizationPanel'
import { ROIDashboard } from '@/components/ROIDashboard'

export default function Dashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check for authentication token
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token) {
      router.push('/auth/login')
      return
    }

    if (userData) {
      setUser(JSON.parse(userData))
    }

    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Real-time CNC machine intelligence and optimization</p>
        </div>

        {/* Machine Status Cards */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Machine Status</h2>
          <MachineList />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts */}
          <AlertTimeline />

          {/* Optimization */}
          <OptimizationPanel />
        </div>

        {/* ROI Dashboard */}
        <div>
          <ROIDashboard />
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Active Machines</p>
            <p className="text-2xl font-bold text-white">4</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Predictions</p>
            <p className="text-2xl font-bold text-cyan-400">98%</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Critical Alerts</p>
            <p className="text-2xl font-bold text-red-400">0</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Avg RUL Health</p>
            <p className="text-2xl font-bold text-green-400">82%</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
