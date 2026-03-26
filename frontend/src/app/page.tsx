'use client'

import { ChevronRight, Zap, TrendingUp, Shield, Cpu, BarChart3, Settings, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="container-max flex items-center justify-between py-6">
          <Link href="/" className="text-2xl font-bold">
            CNC <span className="gradient-text">INTELLIGENCE</span>
          </Link>
          <div className="hidden md:flex gap-12 items-center">
            <a href="#about" className="text-sm font-medium hover:text-cyan-500 transition">ABOUT</a>
            <a href="#services" className="text-sm font-medium hover:text-cyan-500 transition">SERVICES</a>
            <a href="#process" className="text-sm font-medium hover:text-cyan-500 transition">PROCESS</a>
            <a href="#portfolio" className="text-sm font-medium hover:text-cyan-500 transition">PORTFOLIO</a>
            <a href="#contact" className="button-accent px-6 py-2 text-sm">CONTACT</a>
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
              Machine Intelligence,
              <br />
              <span className="gradient-text">that counts.</span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              We combine Machine Learning, signal processing, and data analytics into one unified platform for precision CNC machine tools. Tool life prediction, anomaly detection, and process optimization — all in real time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-8">
              <Link href="/dashboard" className="button-primary">
                VIEW DEMO
              </Link>
              <button className="button-secondary">
                DOCUMENTATION <ChevronRight className="inline ml-2 w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-16 border-t border-slate-200">
              <div>
                <p className="text-5xl font-bold text-cyan-500">700%</p>
                <p className="text-sm text-slate-600 mt-2">Average ROI</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-cyan-500">1.4</p>
                <p className="text-sm text-slate-600 mt-2">Months to ROI</p>
              </div>
              <div>
                <p className="text-5xl font-bold text-cyan-500">$127K</p>
                <p className="text-sm text-slate-600 mt-2">Annual Savings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* O NAS - ABOUT */}
      <section id="about" className="section-spacing dark-section">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="divider-accent"></div>
              <h2 className="section-title">
                We build intelligence for factories that cannot afford mistakes.
              </h2>
              <p className="text-slate-300 mt-6">
                For six years we have worked with precision machine tool manufacturers around the world. We know what it means to lose a tool during live production. We know what an unplanned stoppage looks like. We know what noise in the data costs.
              </p>
              <p className="text-slate-300 mt-4">
                That is why we built a platform that does not guess. One that measures, analyses, and predicts with 95% confidence.
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
              <h2 className="section-title">OUR SERVICES</h2>
              <p className="text-xl text-slate-600 max-w-2xl">
                Six modules that together create a complete picture of your machines' health.
              </p>
            </div>

            {/* Service Cards */}
            <div className="grid-cols-services">
              {/* 01 RUL */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">01</p>
                  <h3 className="text-2xl font-bold">Tool Life Prediction</h3>
                  <p>LSTM deep learning delivers remaining tool life forecasts with 95%+ accuracy. Real-time.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    75% reduction in downtime
                  </div>
                </div>
              </div>

              {/* 02 Anomaly */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">02</p>
                  <h3 className="text-2xl font-bold">Anomaly Detection</h3>
                  <p>Isolation Forest and hybrid analysis identify abnormal behaviour before it becomes a problem.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Early problem detection
                  </div>
                </div>
              </div>

              {/* 03 Optimization */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">03</p>
                  <h3 className="text-2xl font-bold">Process Optimization</h3>
                  <p>XGBoost recommends feed rate and spindle speed parameters for maximum efficiency and tool longevity.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <Zap className="w-5 h-5 mr-2" />
                    5-40% efficiency increase
                  </div>
                </div>
              </div>

              {/* 04 Protocols */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">04</p>
                  <h3 className="text-2xl font-bold">Multi-Protocol Integration</h3>
                  <p>MTConnect, OPC-UA, Modbus, MQTT — we work with any machine tool. Zero hardware modifications.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <Settings className="w-5 h-5 mr-2" />
                    Compatible with any CNC
                  </div>
                </div>
              </div>

              {/* 05 Streaming */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">05</p>
                  <h3 className="text-2xl font-bold">Real-Time Streaming</h3>
                  <p>Kafka + WebSocket for live dashboards. 1-2 second latency, thousands of machines simultaneously.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Live visibility
                  </div>
                </div>
              </div>

              {/* 06 ROI */}
              <div className="card-platform">
                <div className="space-y-6">
                  <p className="service-number">06</p>
                  <h3 className="text-2xl font-bold">ROI Analytics</h3>
                  <p>Savings calculations: tools (-30%), downtime (-75%), scrap (-55%). Financial dashboard.</p>
                  <div className="flex items-center text-cyan-500 font-semibold">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    $127K annual savings
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="section-spacing dark-section">
        <div className="container-max">
          <div className="space-y-20">
            <div>
              <div className="divider-accent"></div>
              <h2 className="section-title">OUR PROCESS</h2>
              <p className="text-xl text-slate-300">
                From conversation to full production in four steps.
              </p>
            </div>

            <div className="grid-cols-process">
              {/* Step 1 */}
              <div className="space-y-6">
                <div className="bg-cyan-500 text-white w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl">
                  01
                </div>
                <h3 className="text-2xl font-bold">Diagnosis & Strategy</h3>
                <p className="text-slate-300">
                  We analyse your machines, protocols, and current pain points. We build an implementation plan and schedule.
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-6">
                <div className="bg-cyan-500 text-white w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl">
                  02
                </div>
                <h3 className="text-2xl font-bold">Integration & Testing</h3>
                <p className="text-slate-300">
                  We install protocol adapters. Tested for 30 days in parallel with production. Zero risk.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-6">
                <div className="bg-cyan-500 text-white w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl">
                  03
                </div>
                <h3 className="text-2xl font-bold">Deployment & Training</h3>
                <p className="text-slate-300">
                  Full deployment. Team training. Dashboards in production — operators see value immediately.
                </p>
              </div>

              {/* Step 4 */}
              <div className="space-y-6">
                <div className="bg-cyan-500 text-white w-16 h-16 rounded-lg flex items-center justify-center font-bold text-2xl">
                  04
                </div>
                <h3 className="text-2xl font-bold">Support & Optimization</h3>
                <p className="text-slate-300">
                  Ongoing support. Model optimisation. New features. We are your long-term partner.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PORTFOLIO */}
      <section id="portfolio" className="section-spacing bg-white">
        <div className="container-max">
          <div className="space-y-20">
            <div>
              <div className="divider-accent"></div>
              <h2 className="section-title">CASE STUDIES</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Case 1 */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 h-64 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Cpu className="w-16 h-16 text-slate-400 mx-auto" />
                    <p className="text-slate-500 mt-4">Fanuc Manufacturing Plant</p>
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Precision Aerospace Parts Factory</h3>
                <p className="text-slate-600">75% reduction in unplanned downtime. Tool life forecast accuracy of 96%. ROI 820% in 1.2 months.</p>
                <p className="text-sm text-slate-400 font-semibold">12 machines • LSTM + Isolation Forest • Kafka streaming</p>
              </div>

              {/* Case 2 */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 h-64 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-slate-400 mx-auto" />
                    <p className="text-slate-500 mt-4">Siemens Production Line</p>
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Industrial Hydraulics Production Line</h3>
                <p className="text-slate-600">Tool savings of $180K per year. Process optimisation: +22% efficiency. Deployment: 3 weeks.</p>
                <p className="text-sm text-slate-400 font-semibold">24 machines • MTConnect + OPC-UA • Multi-tenant</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section-spacing dark-section border-t border-slate-700">
        <div className="container-max">
          <div className="max-w-2xl">
            <div className="space-y-8">
              <div>
                <div className="divider-accent"></div>
                <h2 className="section-title text-white">
                  Let's talk <br />
                  about your strategy.
                </h2>
              </div>
              
              <p className="text-xl text-slate-300">
                You don't need a ready brief. Just tell us about your machines — we'll take care of the rest.
              </p>

              <form className="space-y-6 pt-8">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">Tell us about your factory</label>
                  <textarea 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    rows={6}
                    placeholder="How many machines? What controllers? What are the pain points?"
                  />
                </div>
                <button type="submit" className="button-accent w-full">
                  SEND MESSAGE
                </button>
              </form>

              <div className="border-t border-slate-700 pt-8 space-y-4">
                <p className="text-sm text-slate-400">CONTACT</p>
                <p className="text-white font-semibold">contact@cncintelligence.com</p>
                <p className="text-slate-300">Warsaw, Poland</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white border-t border-slate-800 py-12">
        <div className="container-max">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-4">PRODUCT</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition">Features</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Demo</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-4">COMPANY</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition">About</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-4">RESOURCES</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition">Docs</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">API</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Support</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-4">LEGAL</p>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Terms</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8">
            <p className="text-sm text-slate-500">© 2026 CNC Intelligence. Building the future of precision manufacturing.</p>
            <div className="flex gap-6 mt-6 md:mt-0">
              <a href="#" className="text-slate-500 hover:text-cyan-400 text-sm transition">Instagram</a>
              <a href="#" className="text-slate-500 hover:text-cyan-400 text-sm transition">LinkedIn</a>
              <a href="#" className="text-slate-500 hover:text-cyan-400 text-sm transition">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
