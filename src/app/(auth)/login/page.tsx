'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#111', border: '1px solid #222', borderRadius: 16,
        padding: '40px 36px', width: 360, display: 'flex', flexDirection: 'column', gap: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="16" fill="#00c853" fillOpacity="0.15"/>
            <path d="M20 20 L50 50 L20 80 L35 80 L50 65 L65 80 L80 80 L50 50 L80 20 L65 20 L50 35 L35 20 Z" fill="#00c853"/>
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#00c853', letterSpacing: '0.05em' }}>HOKMA SWARM</div>
            <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>IMOBILIÁRIA</div>
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
              background: '#00c853', border: 'none', borderRadius: 8, padding: '11px',
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
