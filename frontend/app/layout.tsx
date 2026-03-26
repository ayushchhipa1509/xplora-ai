import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Xplora - AI Discovery Chatbot',
  description: 'AI-powered chat assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}







