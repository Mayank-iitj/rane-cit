'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface Recommendation {
  id: number
  machine_id: number
  feed_rate_recommendation: number
  spindle_speed_recommendation: number
  efficiency_gain_percent: number
  reason: string
}

export function OptimizationPanel() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/recommendations')
      .then(res => res.json())
      .then(data => {
        setRecommendations(data)
        setLoading(false)
      })
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Optimization Recommendations</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="bg-slate-700/50 rounded h-20 animate-pulse" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No recommendations available</p>
      ) : (
        <div className="space-y-4">
          {recommendations.map(rec => (
            <div key={rec.id} className="bg-slate-700/30 border border-slate-600 rounded p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-slate-300 mb-1">
                    <span className="font-medium">Feed Rate:</span> {rec.feed_rate_recommendation} mm/min
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="font-medium">Spindle Speed:</span> {rec.spindle_speed_recommendation} RPM
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-400">+{rec.efficiency_gain_percent}%</p>
                  <p className="text-xs text-slate-400">efficiency gain</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 italic">{rec.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
