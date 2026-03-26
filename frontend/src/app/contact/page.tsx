'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MapPin, Mail, Phone, MessageSquare } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.email || !formData.company || !formData.message) {
      setError('All fields are required.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      // Send to backend
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to send message')

      setSubmitted(true)
      setFormData({ name: '', email: '', company: '', message: '' })

      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setError('An error occurred. Please try again or email admin@mayankiitj.in')
    }
  }

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="container-max flex items-center justify-between py-6">
          <Link href="/" className="text-2xl font-bold">
            CNC <span className="gradient-text">INTELLIGENCE</span>
          </Link>
          <Link href="/" className="button-accent px-6 py-2 text-sm">Back Home</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="section-spacing bg-white">
        <div className="container-max text-center">
          <h1 className="hero-text mb-6">
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className="text-xl text-slate-600">
            Questions? Our team is here to help. Contact us anytime.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="section-spacing dark-section">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <Mail className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
              <a href="mailto:admin@mayankiitj.in" className="text-cyan-400 hover:text-cyan-300">
                admin@mayankiitj.in
              </a>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <Phone className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Phone</h3>
              <p className="text-slate-300">Available 9 AM - 6 PM IST</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <MessageSquare className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Response Time</h3>
              <p className="text-slate-300">Usually within 24 hours</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12">
              <h2 className="text-2xl font-bold text-white mb-8">Send us a Message</h2>

              {submitted && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
                  ✓ Thank you! We'll get back to you shortly.
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@company.com"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="ABC Manufacturing"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your manufacturing needs..."
                    rows={6}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <button type="submit" className="button-accent w-full py-3">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-spacing bg-white">
        <div className="container-max max-w-2xl">
          <h2 className="text-4xl font-bold mb-12 text-center">Before You Contact Us</h2>

          <div className="space-y-6">
            <details className="group border-b border-slate-200 pb-6">
              <summary className="font-semibold cursor-pointer text-lg text-slate-900 group-open:text-cyan-600">
                What information should I provide?
              </summary>
              <p className="mt-4 text-slate-600">
                Include your company name, your role, number of machines, and specific use case or challenge you're facing.
              </p>
            </details>

            <details className="group border-b border-slate-200 pb-6">
              <summary className="font-semibold cursor-pointer text-lg text-slate-900 group-open:text-cyan-600">
                What's the typical implementation timeline?
              </summary>
              <p className="mt-4 text-slate-600">
                Most implementations take 2-4 weeks from purchase to production deployment, depending on your infrastructure setup.
              </p>
            </details>

            <details className="group border-b border-slate-200 pb-6">
              <summary className="font-semibold cursor-pointer text-lg text-slate-900 group-open:text-cyan-600">
                Do you provide onboarding and training?
              </summary>
              <p className="mt-4 text-slate-600">
                Yes. All plans except Starter include dedicated onboarding and training for your team.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white border-t border-slate-800 py-12">
        <div className="container-max text-center">
          <p className="text-slate-400">© 2026 CNC Intelligence. Building the future of precision manufacturing.</p>
        </div>
      </footer>
    </div>
  )
}
