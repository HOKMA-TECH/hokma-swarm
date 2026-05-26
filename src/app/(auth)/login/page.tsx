'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NetworkBackground } from '@/components/layout/NetworkBackground'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha inválidos.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', display: 'flex',
      alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <NetworkBackground />
      <div style={{
        background: '#111', border: '1px solid #222', borderRadius: 16,
        padding: '40px 36px', width: 360, display: 'flex', flexDirection: 'column', gap: 24,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <svg width="56" height="56" viewBox="0 0 72 72" fill="none">
            <polygon points="36,5 64,21 64,53 36,69 8,53 8,21" fill="none" stroke="#10b981" strokeWidth="2.5"/>
            <circle cx="36" cy="37" r="6.5" fill="#10b981"/>
            <circle cx="22" cy="25" r="4.2" fill="#052e16" stroke="#6ee7b7" strokeWidth="1.4"/>
            <circle cx="50" cy="25" r="4.2" fill="#052e16" stroke="#6ee7b7" strokeWidth="1.4"/>
            <circle cx="22" cy="49" r="4.2" fill="#052e16" stroke="#6ee7b7" strokeWidth="1.4"/>
            <circle cx="50" cy="49" r="4.2" fill="#052e16" stroke="#6ee7b7" strokeWidth="1.4"/>
            <circle cx="36" cy="16" r="3" fill="#052e16" stroke="#6ee7b7" strokeWidth="1.2"/>
            <circle cx="36" cy="58" r="3" fill="#052e16" stroke="#6ee7b7" strokeWidth="1.2"/>
            <line x1="36" y1="37" x2="22" y2="25" stroke="#6ee7b7" strokeWidth="1.4" opacity="0.85"/>
            <line x1="36" y1="37" x2="50" y2="25" stroke="#6ee7b7" strokeWidth="1.4" opacity="0.85"/>
            <line x1="36" y1="37" x2="22" y2="49" stroke="#6ee7b7" strokeWidth="1.4" opacity="0.85"/>
            <line x1="36" y1="37" x2="50" y2="49" stroke="#6ee7b7" strokeWidth="1.4" opacity="0.85"/>
            <line x1="36" y1="37" x2="36" y2="19" stroke="#6ee7b7" strokeWidth="1.1" opacity="0.55"/>
            <line x1="36" y1="37" x2="36" y2="55" stroke="#6ee7b7" strokeWidth="1.1" opacity="0.55"/>
          </svg>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f0f0', letterSpacing: '0.1em' }}>HOKMA</div>
            <div style={{ fontSize: 11, color: '#10b981', letterSpacing: '0.2em', fontWeight: 300, marginTop: 2 }}>SWARM CRM</div>
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#999' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                background: '#161616', border: '1px solid #222', borderRadius: 8,
                padding: '10px 12px', color: '#f0f0f0', fontSize: 14, outline: 'none'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#999' }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                background: '#161616', border: '1px solid #222', borderRadius: 8,
                padding: '10px 12px', color: '#f0f0f0', fontSize: 14, outline: 'none'
              }}
            />
          </div>
          {error && <p style={{ color: '#ef5350', fontSize: 12 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#10b981', border: 'none', borderRadius: 8, padding: '11px',
              color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
