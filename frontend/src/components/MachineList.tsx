'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Zap } from 'lucide-react'

interface Machine {
  id: number
  name: string
  status: 'running' | 'idle' | 'error'
  location: string
  rul_percentage?: number
  current_spindle_speed?: number
  current_feed_rate?: number
}

export function MachineList() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/machines')
      .then(res => res.json())
      .then(data => {
        setMachines(data)
        setLoading(false)
      })
      .catch(err => console.error(err))
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {loading ? (
        Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-4 animate-pulse h-48" />
        ))
      ) : (
        machines.map(machine => (
          <div
            key={machine.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-500 transition"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-white">{machine.name}</h3>
              <div className="flex items-center gap-1">
                {machine.status === 'running' ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                ) : machine.status === 'idle' ? (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                ) : (
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-3">{machine.location}</p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">RUL Health</span>
                <span className="text-white font-mono">{machine.rul_percentage || 85}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded transition-all ${
                    (machine.rul_percentage || 85) > 50
                      ? 'bg-green-500'
                      : (machine.rul_percentage || 85) > 20
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${machine.rul_percentage || 85}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
              <Zap className="w-3 h-3" />
              <span>Spindle: {machine.current_spindle_speed || 3200} RPM</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>Feed: {machine.current_feed_rate || 400} mm/min</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
