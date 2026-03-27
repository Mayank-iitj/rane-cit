import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://cnc.mayyanks.app'),
  title: 'cnc.mayyanks.app — CNC Intelligence Platform',
  description: 'Real-time CNC Intelligence & Predictive Automation Platform — cnc.mayyanks.app',
  keywords: 'CNC, intelligence, predictive maintenance, manufacturing, IoT, Industry 4.0',
  authors: [{ name: 'cnc.mayyanks.app' }],
  openGraph: {
    title: 'cnc.mayyanks.app',
    description: 'CNC Intelligence & Predictive Automation',
    url: 'https://cnc.mayyanks.app',
    siteName: 'cnc.mayyanks.app',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" />
        <meta name="theme-color" content="#0a0e1a" />
      </head>
      <body>{children}</body>
    </html>
  )
}