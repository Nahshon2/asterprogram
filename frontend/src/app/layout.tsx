import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/layout/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Doctor Identity Generator | Hospital Branding Platform',
  description: 'Generate premium, identity-preserved doctor profile images and branded medical assets for hospitals and clinics.',
  keywords: 'doctor profile, medical branding, hospital identity, doctor images, healthcare marketing',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
