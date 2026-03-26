'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: '$2,999',
      period: '/month',
      description: 'For small operations (1-3 machines)',
      features: [
        'Up to 3 machine tools',
        'Real-time monitoring',
        'Basic anomaly detection',
        'Email alerts',
        'Email support',
      ],
    },
    {
      name: 'Professional',
      price: '$9,999',
      period: '/month',
      description: 'For mid-size facilities (4-12 machines)',
      features: [
        'Up to 12 machine tools',
        'Advanced ML models (LSTM + XGBoost)',
        'Tool wear prediction',
        'Process optimization',
        'Video dashboard',
        'Priority support',
        'Custom integrations',
      ],
      featured: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      description: 'For large operations (13+ machines)',
      features: [
        'Unlimited machines',
        'Full ML suite',
        'Edge deployment',
        'Multi-tenant RBAC',
        'Custom dashboards',
        'Dedicated account manager',
        'SLA guarantee',
      ],
    },
  ]

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
          <h1 className="hero-text mb-8">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h1>
          <p className="text-2xl text-slate-600 mb-4">
            No hidden fees. No setup charges. Pay only for what you use.
          </p>
          <p className="text-slate-500">
            All plans include 30-day free trial. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section-spacing dark-section">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-8 border transition ${
                  plan.featured
                    ? 'bg-cyan-500/10 border-cyan-500/50 ring-2 ring-cyan-500/20'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                {plan.featured && (
                  <div className="mb-4 inline-block px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded-full text-cyan-400 text-sm font-medium">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 ml-2">{plan.period}</span>
                </div>

                <button
                  className={`w-full py-3 rounded-lg font-semibold mb-8 transition ${
                    plan.featured
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  Get Started
                </button>

                <div className="space-y-4">
                  {plan.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-spacing bg-white">
        <div className="container-max max-w-2xl">
          <h2 className="text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <details className="group border-b border-slate-200 pb-6">
              <summary className="font-semibold cursor-pointer text-lg text-slate-900 group-open:text-cyan-600">
                What's included in the free trial?
              </summary>
              <p className="mt-4 text-slate-600">
                Full platform access: all ML models, real-time streaming, dashboards, and integrations. No credit card required.
              </p>
            </details>

            <details className="group border-b border-slate-200 pb-6">
              <summary className="font-semibold cursor-pointer text-lg text-slate-900 group-open:text-cyan-600">
                Can I upgrade or downgrade anytime?
              </summary>
              <p className="mt-4 text-slate-600">
                Yes. Changes take effect immediately. You'll only pay the prorated difference.
              </p>
            </details>

            <details className="group border-b border-slate-200 pb-6">
              <summary className="font-semibold cursor-pointer text-lg text-slate-900 group-open:text-cyan-600">
                Do you offer enterprise discounts?
              </summary>
              <p className="mt-4 text-slate-600">
                Absolutely. Contact sales@mayankiitj.in for custom quotes and volume pricing.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-spacing dark-section text-center">
        <div className="container-max">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <Link href="/auth/signup" className="button-accent inline-block">
            Start Free Trial
          </Link>
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
