import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HOKMA SWARM',
  description: 'CRM Imobiliário',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let fullyAuthenticated = false
  if (user) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    const mfaPending = aal?.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel
    fullyAuthenticated = !mfaPending
  }

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          {fullyAuthenticated && <Sidebar />}
          <main style={{ flex: 1, overflow: 'auto' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
