'use client'

import { useEffect, useState } from 'react'

type Phase = 'visible' | 'fading' | 'hidden'

export default function WelcomeScreen() {
  const [phase, setPhase] = useState<Phase>('visible')

  useEffect(() => {
    // Begin fade-out after 2.4 s, fully unmount at 3 s
    const fadeTimer = setTimeout(() => setPhase('fading'), 2400)
    const hideTimer = setTimeout(() => setPhase('hidden'), 3000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (phase === 'hidden') return null

  return (
    <div
      className={`welcome-overlay${phase === 'fading' ? ' welcome-fade-out' : ''}`}
      aria-hidden="true"
    >
      {/* Background grid lines */}
      <div className="welcome-grid" />

      {/* Pulsing ring */}
      <div className="welcome-ring welcome-ring-1" />
      <div className="welcome-ring welcome-ring-2" />

      {/* Brand */}
      <div className="welcome-content">
        <div className="welcome-divider" />

        <p className="welcome-eyebrow">INDUSTRIAL AI PLATFORM</p>

        <h1 className="welcome-title">
          CNC{' '}
          <span className="welcome-gradient">INTELLIGENCE</span>
        </h1>

        <p className="welcome-subtitle">
          Machine Intelligence That Matters.
        </p>

        {/* Animated loading bar */}
        <div className="welcome-bar-track">
          <div className="welcome-bar-fill" />
        </div>

        <p className="welcome-loading-text">Initializing platform…</p>
      </div>
    </div>
  )
}
