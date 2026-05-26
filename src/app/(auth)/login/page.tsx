'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NetworkBackground } from '@/components/layout/NetworkBackground'

type LoginStep = 'password' | 'totp'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<LoginStep>('password')
  const [totpCode, setTotpCode] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null)
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
      return
    }

    // Check if MFA is required
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
      // List factors to get the verified TOTP factor
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp?.find(f => f.status === 'verified')
      if (totpFactor) {
        const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id })
        setLoading(false)
        if (challengeErr || !challenge) {
          setError('Erro ao iniciar verificação 2FA.')
          return
        }
        setMfaFactorId(totpFactor.id)
        setMfaChallengeId(challenge.id)
        setStep('totp')
        return
      }
    }

    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  async function handleTotp(e: React.FormEvent) {
    e.preventDefault()
    if (!mfaFactorId || !mfaChallengeId) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: mfaChallengeId,
      code: totpCode.replace(/\s/g, ''),
    })
    setLoading(false)
    if (error) {
      setError('Código inválido. Tente novamente.')
      return
    }
    router.push('/dashboard')
    router.refresh()
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

        {step === 'password' && (
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
              {loading ? 'Verificando…' : 'Entrar'}
            </button>
          </form>
        )}

        {step === 'totp' && (
          <form onSubmit={handleTotp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6, marginBottom: 4 }}>
                Insira o código de 6 dígitos do seu aplicativo autenticador.
              </div>
              <label style={{ fontSize: 12, color: '#999' }}>Código de verificação</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000 000"
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                style={{
                  background: '#161616', border: '1px solid #222', borderRadius: 8,
                  padding: '10px 12px', color: '#f0f0f0', fontSize: 20, outline: 'none',
                  letterSpacing: '0.3em', textAlign: 'center',
                }}
              />
            </div>
            {error && <p style={{ color: '#ef5350', fontSize: 12 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || totpCode.length < 6}
              style={{
                background: '#10b981', border: 'none', borderRadius: 8, padding: '11px',
                color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                opacity: loading || totpCode.length < 6 ? 0.7 : 1
              }}
            >
              {loading ? 'Verificando…' : 'Confirmar'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('password'); setError(''); setTotpCode('') }}
              style={{
                background: 'none', border: 'none', color: '#555', fontSize: 12,
                cursor: 'pointer', textAlign: 'center',
              }}
            >
              Voltar ao login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
