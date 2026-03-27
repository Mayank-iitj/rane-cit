import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import './globals.css'

const WelcomeScreen = dynamic(() => import('@/components/WelcomeScreen'), {
  ssr: false,
})

export const metadata: Metadata = {
  title: 'CNC Intelligence Platform',
  description: 'AI-Powered CNC Process Intelligence System',
  icons: {
    icon: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WelcomeScreen />
        {children}
      </body>
    </html>
  )
}