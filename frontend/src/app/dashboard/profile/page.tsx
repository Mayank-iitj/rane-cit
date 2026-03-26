'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { User, Mail, Building2, Calendar } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
      <DashboardLayout>
        <div className="text-center text-white">Loading...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-slate-400">Manage your account settings and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          <div className="space-y-8">
            {/* Avatar & Name */}
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user?.name || 'User'}</h2>
                <p className="text-slate-400">{user?.email}</p>
                <p className="text-sm text-slate-500 mt-2">Premium Plan • Active</p>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-700 pt-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Mail className="w-4 h-4" />
                  <label className="text-sm font-semibold">Email Address</label>
                </div>
                <p className="text-white font-medium">{user?.email}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Building2 className="w-4 h-4" />
                  <label className="text-sm font-semibold">Company</label>
                </div>
                <p className="text-white font-medium">{user?.company || 'Not specified'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <label className="text-sm font-semibold">Member Since</label>
                </div>
                <p className="text-white font-medium">2024</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <User className="w-4 h-4" />
                  <label className="text-sm font-semibold">Status</label>
                </div>
                <p className="text-green-400 font-medium">Active</p>
              </div>
            </div>

            {/* Machines */}
            <div className="border-t border-slate-700 pt-8">
              <h3 className="text-xl font-bold text-white mb-4">Connected Machines</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                  <div>
                    <p className="text-white font-medium">Machine #1 - CNC VMC</p>
                    <p className="text-slate-400 text-sm">Status: Online • Last seen: 2 min ago</p>
                  </div>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                  <div>
                    <p className="text-white font-medium">Machine #2 - CNC Turning</p>
                    <p className="text-slate-400 text-sm">Status: Online • Last seen: 5 min ago</p>
                  </div>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-700 pt-8 flex gap-4">
              <button className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition">
                Edit Profile
              </button>
              <button className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
