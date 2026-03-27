'use client'

import { ChevronRight, Zap, TrendingUp, Cpu, BarChart3, Settings, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useEffect, useState } from 'react'

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(() => {
    const seenKey = 'cnc_mayyanks_welcome_seen'

    if (typeof window === 'undefined') {
      return false
    }

    const hasSeen = window.sessionStorage.getItem(seenKey)
    if (hasSeen) {
      return false
    }

    window.sessionStorage.setItem(seenKey, '1')
    return true
  })

  useEffect(() => {
    if (!showWelcome) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setShowWelcome(false)
    }, 3600)

    return () => window.clearTimeout(timer)
  }, [showWelcome])

  return (
    <div className="bg-white">
      {showWelcome && (
        <div className="welcome-overlay" role="status" aria-live="polite">
          <div className="welcome-card">
            <div className="welcome-lottie-wrap" aria-hidden="true">
              <DotLottieReact
                src="/loading.lottie"
                autoplay
                loop
              />
            </div>
            <p className="welcome-kicker">System Init</p>
            <h2 className="welcome-title">Engine Rebooting</h2>
            <p className="welcome-subtitle">Synchronizing machine intelligence cores</p>
            <button
              type="button"
              className="welcome-skip"
              onClick={() => setShowWelcome(false)}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="container-max flex items-center justify-between py-6">
          <Link href="/" className="text-2xl font-bold">
            CNC <span className="gradient-text">INTELLIGENCE</span>
          </Link>
          <div className="hidden md:flex gap-12 items-center">
            <a href="#about" className="text-sm font-medium hover:text-cyan-500 transition">ABOUT</a>
            <a href="#services" className="text-sm font-medium hover:text-cyan-500 transition">SERVICES</a>
            <a href="#process" className="text-sm font-medium hover:text-cyan-500 transition">CAPABILITIES</a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="section-spacing bg-white">
        <div className="container-max">
          <div className="space-y-8">
            <div className="inline-block">
              <div className="divider-accent"></div>
              <p className="text-sm font-semibold text-slate-600 tracking-widest">INDUSTRIAL AI PLATFORM</p>
            </div>

            <h1 className="hero-text">
              Machine Intelligence
              <br />
              <span className="gradient-text">That Matters.</span>
            </h1>

            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              Combining Machine Learning, signal processing, and data analytics into one unified platform for precision CNC machining. Tool wear prediction, anomaly detection, and process optimization – all in real-time.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <Link href="/dashboard" className="button-primary">
                EXPLORE DASHBOARD
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-16 border-t border-slate-200">
              <div>
                <p className="text-5xl font-bold text-cyan-500">700%</p>
                <p className="text-sm text-slate-600 mt-2">Average ROI</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-cyan-500">1.4</p>
                <p className="text-sm text-slate-600 mt-2">Payback Months</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-cyan-500">$127K</p>
                <p className="text-sm text-slate-600 mt-2">Annual Savings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section-spacing dark-section">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="divider-accent"></div>
              <h2 className="section-title">
                Building Intelligence for Factories That Cannot Afford to Fail.
              </h2>
              <p className="text-slate-300 mt-6">
                For years we have partnered with precision machine tool manufacturers worldwide. We understand the cost of tool loss during production. We know what unplanned downtime looks like. We know what noisy data costs you.
              </p>
              <p className="text-slate-300 mt-4">
                That&rsquo;s why we built a platform that doesn&rsquo;t guess. One that measures, analyzes, and predicts with 95% certainty.     
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-12 aspect-square flex items-center justify-center">
              <div className="text-center">
                <Cpu className="w-24 h-24 text-cyan-400 mx-auto mb-4" />
                <p className="text-slate-300 text-sm">Real-time ML inference</p>
                <p className="text-slate-400 text-xs mt-2">LSTM + XGBoost + Isolation Forest</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="section-spacing bg-white">
        <div className="container-max">
          <div className="space-y-20">
            <div>
              <div className="divider-accent"></div>
              <h2 className="section-title">OUR PLATFORM</h2>
              <p className="text-xl text-slate-600 max-w-2xl">
                Six modules working together to give you complete visibility into machine health.
              </p>
            </div>

            {/* Service Cards */}
            <div className="grid-cols-services">
              {/* 01 RUL */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">01</p>
                  <h3 className="text-2xl font-bold">Tool Wear Prediction</h3>
                  <p>LSTM deep learning provides remaining useful life forecasts with 95%+ accuracy. Real-time.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    75% Reduction in Downtime
                  </div>
                </div>
              </div>

              {/* 02 Anomaly */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">02</p>
                  <h3 className="text-2xl font-bold">Anomaly Detection</h3>
                  <p>Isolation Forest and hybrid analysis identify abnormal behavior before it becomes a problem.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Early Warning System
                  </div>
                </div>
              </div>

              {/* 03 Optimization */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">03</p>
                  <h3 className="text-2xl font-bold">Process Optimization</h3>
                  <p>XGBoost recommends feed rates and spindle speeds for maximum efficiency and tool life.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <Zap className="w-5 h-5 mr-2" />
                    5-40% Throughput Increase
                  </div>
                </div>
              </div>

              {/* 04 Protocols */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">04</p>
                  <h3 className="text-2xl font-bold">Multi-Protocol Integration</h3>
                  <p>MTConnect, OPC-UA, Modbus, MQTT – we work with every machine tool. Zero hardware modifications.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <Settings className="w-5 h-5 mr-2" />
                    Compatible with Any CNC
                  </div>
                </div>
              </div>

              {/* 05 Streaming */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">05</p>
                  <h3 className="text-2xl font-bold">Real-Time Streaming</h3>
                  <p>Kafka + WebSocket for live dashboards. 1-2 second latency. 1000s of machines simultaneously.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Live Visibility
                  </div>
                </div>
              </div>

              {/* 06 ROI */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">06</p>
                  <h3 className="text-2xl font-bold">ROI Analytics</h3>
                  <p>Savings calculation: tools (-30%), downtime (-75%), scrap (-55%). Financial dashboard included.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    $127K Annual Savings
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="section-spacing bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="container-max text-center space-y-8">
          <h2 className="text-4xl font-bold">Ready to explore?</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Start exploring the dashboard immediately. No signup required. Full access to all features.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 button-primary">
            OPEN DASHBOARD <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="container-max py-12">
          <div className="grid grid-cols-4 gap-8 mb-12">
            <div>
              <p className="font-bold text-white mb-4">CNC INTELLIGENCE</p>
              <p className="text-sm">Machine learning for precision manufacturing</p>
            </div>
            <div>
              <p className="font-bold text-white mb-4">PLATFORM</p>
              <ul className="text-sm space-y-2">
                <li><a href="#services" className="hover:text-cyan-400 transition">Features</a></li>
                <li><a href="/dashboard" className="hover:text-cyan-400 transition">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white mb-4">COMPANY</p>
              <ul className="text-sm space-y-2">
                <li><a href="#about" className="hover:text-cyan-400 transition">About</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white mb-4">CONTACT</p>
              <ul className="text-sm space-y-2">
                <li>support@cnc.mayyanks.app</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>© 2026 CNC Intelligence Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
