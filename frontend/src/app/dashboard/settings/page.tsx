'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Bell, Lock, Globe, Eye } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    alertNotifications: true,
    weeklyReports: true,
    dataSharing: false,
    darkMode: true,
    language: 'en',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      router.push('/auth/login')
      return
    }

    // Load user settings from localStorage
    const savedSettings = localStorage.getItem('settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }

    setIsLoading(false)
  }, [router])

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('settings', JSON.stringify(newSettings))
  }

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
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Customize your platform experience</p>
        </div>

        {/* Notification Settings */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-slate-400 text-sm">Receive updates about your account</p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div>
                <p className="text-white font-medium">Alert Notifications</p>
                <p className="text-slate-400 text-sm">Get critical machine alerts in real-time</p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.alertNotifications}
                  onChange={(e) => handleSettingChange('alertNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div>
                <p className="text-white font-medium">Weekly Reports</p>
                <p className="text-slate-400 text-sm">Receive weekly analytics reports</p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.weeklyReports}
                  onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Privacy & Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div>
                <p className="text-white font-medium">Data Sharing</p>
                <p className="text-slate-400 text-sm">Allow anonymous usage analytics</p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dataSharing}
                  onChange={(e) => handleSettingChange('dataSharing', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <button className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition text-left">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Change Password
              </div>
            </button>

            <button className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition text-left">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Two-Factor Authentication
              </div>
            </button>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Display & Language</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <label className="block text-sm font-semibold text-slate-300 mb-3">Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pl">Polish</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600">
              <div>
                <p className="text-white font-medium">Dark Mode</p>
                <p className="text-slate-400 text-sm">Use dark theme (enabled)</p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-slate-800/50 border border-red-500/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-red-400 mb-6">Danger Zone</h2>
          <button className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg transition border border-red-500/50">
            Delete Account
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
