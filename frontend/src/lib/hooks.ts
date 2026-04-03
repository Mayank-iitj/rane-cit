'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useLiveData<T>(initialData: T, onMessage?: (data: T) => void) {
  const [data, setData] = useState<T>(initialData)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Connect to WebSocket
    const wsUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}`.replace(/^http/, 'ws') + '/api/v1/stream/live'
    
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data)
        setData(newData)
        if (onMessage) {
          onMessage(newData)
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }

    wsRef.current = ws

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
  }, [onMessage])

  return data
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }
    return localStorage.getItem('auth_token')
  })
  const [user, setUser] = useState<Record<string, unknown> | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const { access_token } = await response.json()
    localStorage.setItem('auth_token', access_token)
    setToken(access_token)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }, [])

  return { token, user, login, logout }
}
