'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { DollarSign } from 'lucide-react'

interface ROIMetrics {
  annual_tool_savings: number
  annual_downtime_savings: number
  annual_scrap_savings: number
  total_annual_savings: number
  platform_cost: number
  net_benefit: number
  roi_percentage: number
  payback_months: number
}

export function ROIDashboard() {
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/roi/annual-metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data)
        setLoading(false)
      })
      .catch(err => console.error(err))
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="h-64 bg-slate-700/50 rounded animate-pulse" />
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  const savingsData = [
    { name: 'Tool Savings', value: metrics.annual_tool_savings, color: '#10b981' },
    { name: 'Downtime Savings', value: metrics.annual_downtime_savings, color: '#3b82f6' },
    { name: 'Scrap Savings', value: metrics.annual_scrap_savings, color: '#f59e0b' },
  ]

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="w-5 h-5 text-green-400" />
        <h2 className="text-lg font-semibold text-white">ROI Analytics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={savingsData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {savingsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          <div>
            <p className="text-slate-400 text-sm">Annual Savings</p>
            <p className="text-2xl font-bold text-green-400">
              ${metrics.total_annual_savings.toLocaleString()}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/50 rounded p-3">
              <p className="text-xs text-slate-400 mb-1">ROI</p>
              <p className="text-xl font-semibold text-white">{metrics.roi_percentage}%</p>
            </div>
            <div className="bg-slate-700/50 rounded p-3">
              <p className="text-xs text-slate-400 mb-1">Payback</p>
              <p className="text-xl font-semibold text-white">{metrics.payback_months.toFixed(1)}m</p>
            </div>
          </div>
          <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-600">
            <p>Tool: ${metrics.annual_tool_savings}</p>
            <p>Downtime: ${metrics.annual_downtime_savings}</p>
            <p>Scrap: ${metrics.annual_scrap_savings}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
