'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, AlertCircle, Info, Check } from 'lucide-react'

interface Alert {
  id: number
  machine_id: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  timestamp: string
  acknowledged: boolean
}

export function AlertTimeline() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/anomalies/recent')
      .then(res => res.json())
      .then(data => {
        setAlerts(data)
        setLoading(false)
      })
      .catch(err => console.error(err))
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30 text-red-400'
      case 'high':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400'
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
      case 'low':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />
      case 'high':
        return <AlertCircle className="w-4 h-4" />
      case 'medium':
        return <Info className="w-4 h-4" />
      default:
        return <Check className="w-4 h-4" />
    }
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Recent Alerts</h2>

      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-slate-700/50 rounded h-16 animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No recent alerts</p>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`border rounded-lg p-3 flex items-start gap-3 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{alert.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
              {alert.acknowledged && (
                <span className="text-xs opacity-75">✓ Acknowledged</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
