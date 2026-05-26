'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Section = 'email' | 'senha' | 'notificacoes' | '2fa' | null

interface MfaFactor {
  id: string
  friendly_name?: string
  factor_type: string
  status: string
}

function SectionCard({
  title,
  description,
  badge,
  open,
  onToggle,
  children,
}: {
  title: string
  description: string
  badge?: { label: string; color: string }
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#111',
      border: `1px solid ${open ? '#10b981' : '#1e1e1e'}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '18px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>{title}</span>
            {badge && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px',
                borderRadius: 20, background: badge.color + '22', color: badge.color,
                border: `1px solid ${badge.color}44`,
              }}>{badge.label}</span>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#555' }}>{description}</span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #1a1a1a' }}>
          <div style={{ paddingTop: 18 }}>{children}</div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, color: '#666', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 7,
  color: '#e0e0e0', fontSize: 13, padding: '9px 12px', outline: 'none',
  width: '100%', boxSizing: 'border-box',
}

function Feedback({ msg, ok }: { msg: string; ok: boolean }) {
  if (!msg) return null
  return (
    <div style={{
      fontSize: 12, padding: '8px 12px', borderRadius: 7,
      background: ok ? '#10b98118' : '#ef444418',
      color: ok ? '#10b981' : '#ef4444',
      border: `1px solid ${ok ? '#10b98133' : '#ef444433'}`,
      marginTop: 4,
    }}>{msg}</div>
  )
}

// ─── Email Section ────────────────────────────────────────────────────────────
function EmailSection({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || email === currentEmail) return
    setLoading(true)
    setFeedback(null)
    const { error } = await supabase.auth.updateUser({ email })
    setLoading(false)
    if (error) {
      setFeedback({ msg: error.message, ok: false })
    } else {
      setFeedback({ msg: `Confirmação enviada para ${email}. Verifique sua caixa de entrada.`, ok: true })
      setEmail('')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="E-mail atual">
        <input style={{ ...inputStyle, color: '#555' }} value={currentEmail} readOnly />
      </Field>
      <Field label="Novo e-mail">
        <input
          style={inputStyle} type="email" placeholder="novo@email.com"
          value={email} onChange={e => setEmail(e.target.value)} required
        />
      </Field>
      {feedback && <Feedback {...feedback} />}
      <button
        type="submit" disabled={loading || !email}
        style={{
          background: '#10b981', color: '#fff', border: 'none', borderRadius: 7,
          padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading || !email ? 0.6 : 1, alignSelf: 'flex-start',
        }}
      >
        {loading ? 'Enviando…' : 'Atualizar e-mail'}
      </button>
    </form>
  )
}

// ─── Password Section ─────────────────────────────────────────────────────────
function SenhaSection() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const supabase = createClient()

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.next.length < 8) return setFeedback({ msg: 'A senha deve ter ao menos 8 caracteres.', ok: false })
    if (form.next !== form.confirm) return setFeedback({ msg: 'As senhas não coincidem.', ok: false })
    setLoading(true)
    setFeedback(null)
    const { error } = await supabase.auth.updateUser({ password: form.next })
    setLoading(false)
    if (error) {
      setFeedback({ msg: error.message, ok: false })
    } else {
      setFeedback({ msg: 'Senha atualizada com sucesso.', ok: true })
      setForm({ current: '', next: '', confirm: '' })
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Senha atual">
        <input style={inputStyle} type="password" placeholder="••••••••" value={form.current} onChange={set('current')} required />
      </Field>
      <Field label="Nova senha">
        <input style={inputStyle} type="password" placeholder="Mín. 8 caracteres" value={form.next} onChange={set('next')} required />
      </Field>
      <Field label="Confirmar nova senha">
        <input style={inputStyle} type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required />
      </Field>
      {feedback && <Feedback {...feedback} />}
      <button
        type="submit" disabled={loading || !form.next || !form.confirm}
        style={{
          background: '#10b981', color: '#fff', border: 'none', borderRadius: 7,
          padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading || !form.next || !form.confirm ? 0.6 : 1, alignSelf: 'flex-start',
        }}
      >
        {loading ? 'Salvando…' : 'Alterar senha'}
      </button>
    </form>
  )
}

// ─── Push Notifications Section ───────────────────────────────────────────────
function NotificacoesSection() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (typeof Notification !== 'undefined') setPermission(Notification.permission)
  }, [])

  async function handleEnable() {
    if (typeof Notification === 'undefined') {
      return setFeedback({ msg: 'Seu navegador não suporta notificações.', ok: false })
    }
    setLoading(true)
    const result = await Notification.requestPermission()
    setPermission(result)
    setLoading(false)
    if (result === 'granted') {
      new Notification('HOKMA SWARM', { body: 'Notificações ativadas com sucesso!' })
      setFeedback({ msg: 'Notificações habilitadas.', ok: true })
    } else if (result === 'denied') {
      setFeedback({ msg: 'Permissão negada. Habilite nas configurações do navegador.', ok: false })
    }
  }

  const statusMap: Record<NotificationPermission, { label: string; color: string }> = {
    granted: { label: 'Ativo', color: '#10b981' },
    denied:  { label: 'Bloqueado', color: '#ef4444' },
    default: { label: 'Não configurado', color: '#f59e0b' },
  }
  const status = statusMap[permission]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1e1e1e',
      }}>
        <div>
          <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500 }}>Status das notificações</div>
          <div style={{ fontSize: 11, color: status.color, marginTop: 2, fontWeight: 600 }}>{status.label}</div>
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: status.color,
          boxShadow: `0 0 6px ${status.color}`,
        }} />
      </div>

      <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
        Receba alertas em tempo real para novos leads, compromissos e atualizações de pipeline diretamente no navegador.
      </div>

      {feedback && <Feedback {...feedback} />}

      {permission === 'denied' ? (
        <div style={{
          fontSize: 12, padding: '10px 14px', borderRadius: 8,
          background: '#ef444411', color: '#ef4444', border: '1px solid #ef444433',
        }}>
          Permissão bloqueada pelo navegador. Acesse as configurações do site no navegador para reativar.
        </div>
      ) : permission === 'granted' ? (
        <div style={{ fontSize: 12, color: '#10b981' }}>
          ✓ Notificações estão ativas. Você receberá alertas neste navegador.
        </div>
      ) : (
        <button
          onClick={handleEnable} disabled={loading}
          style={{
            background: '#10b981', color: '#fff', border: 'none', borderRadius: 7,
            padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1, alignSelf: 'flex-start',
          }}
        >
          {loading ? 'Solicitando…' : 'Habilitar notificações'}
        </button>
      )}
    </div>
  )
}

// ─── 2FA Section ──────────────────────────────────────────────────────────────
type MfaStep = 'idle' | 'enrolling' | 'verifying' | 'disabling'

function MfaSection() {
  const [step, setStep] = useState<MfaStep>('idle')
  const [factor, setFactor] = useState<MfaFactor | null>(null)
  const [enrollData, setEnrollData] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadFactors()
  }, [])

  async function loadFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (!error && data?.totp?.length) {
      const verified = data.totp.find((f: MfaFactor) => f.status === 'verified')
      setFactor(verified ?? null)
    }
  }

  async function startEnroll() {
    setLoading(true)
    setFeedback(null)

    // Remove any existing unverified TOTP factors before enrolling
    const { data: existing } = await supabase.auth.mfa.listFactors()
    if (existing?.totp?.length) {
      for (const f of existing.totp) {
        if (f.status !== 'verified') {
          await supabase.auth.mfa.unenroll({ factorId: f.id })
        }
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'HOKMA SWARM' })
    setLoading(false)
    if (error || !data) return setFeedback({ msg: error?.message ?? 'Erro ao iniciar 2FA.', ok: false })
    const { id: factorId, totp } = data as any
    const challengeResp = await supabase.auth.mfa.challenge({ factorId })
    if (challengeResp.error) return setFeedback({ msg: challengeResp.error.message, ok: false })
    setChallengeId(challengeResp.data.id)
    setEnrollData({ factorId, qrCode: totp.qr_code, secret: totp.secret })
    setStep('verifying')
  }

  async function verifyEnroll() {
    if (!enrollData || !challengeId) return
    setLoading(true)
    setFeedback(null)
    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollData.factorId,
      challengeId,
      code: code.replace(/\s/g, ''),
    })
    setLoading(false)
    if (error) return setFeedback({ msg: 'Código inválido. Tente novamente.', ok: false })
    setFeedback({ msg: '2FA ativado com sucesso!', ok: true })
    setStep('idle')
    setEnrollData(null)
    setChallengeId(null)
    setCode('')
    await loadFactors()
  }

  async function handleDisable() {
    if (!factor) return
    setLoading(true)
    setFeedback(null)
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    setLoading(false)
    if (error) return setFeedback({ msg: error.message, ok: false })
    setFeedback({ msg: '2FA desativado.', ok: true })
    setFactor(null)
    setStep('idle')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Status row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1e1e1e',
      }}>
        <div>
          <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500 }}>Autenticação de dois fatores</div>
          <div style={{ fontSize: 11, marginTop: 2, fontWeight: 600, color: factor ? '#10b981' : '#f59e0b' }}>
            {factor ? 'Ativo' : 'Inativo'}
          </div>
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: factor ? '#10b981' : '#f59e0b',
          boxShadow: `0 0 6px ${factor ? '#10b981' : '#f59e0b'}`,
        }} />
      </div>

      <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
        Adicione uma camada extra de segurança exigindo um código TOTP (Google Authenticator, Authy etc.) ao entrar.
      </div>

      {feedback && <Feedback {...feedback} />}

      {/* Idle: show enroll or disable button */}
      {step === 'idle' && !factor && (
        <button
          onClick={startEnroll} disabled={loading}
          style={{
            background: '#10b981', color: '#fff', border: 'none', borderRadius: 7,
            padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1, alignSelf: 'flex-start',
          }}
        >
          {loading ? 'Iniciando…' : 'Ativar 2FA'}
        </button>
      )}

      {step === 'idle' && factor && (
        <button
          onClick={handleDisable} disabled={loading}
          style={{
            background: 'transparent', color: '#ef4444', border: '1px solid #ef444444',
            borderRadius: 7, padding: '9px 18px', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, alignSelf: 'flex-start',
          }}
        >
          {loading ? 'Desativando…' : 'Desativar 2FA'}
        </button>
      )}

      {/* QR + verify step */}
      {step === 'verifying' && enrollData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.7 }}>
            Escaneie o QR Code com seu app de autenticação (Google Authenticator, Authy, etc.) e em seguida insira o código de 6 dígitos gerado.
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* QR Code */}
              <img
                src={enrollData.qrCode}
                alt="QR Code 2FA"
                style={{ width: 160, height: 160, border: '4px solid #fff', borderRadius: 8 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 180 }}>
              <Field label="Chave manual (se não conseguir escanear)">
                <div style={{
                  fontSize: 11, fontFamily: 'monospace', padding: '8px 10px',
                  background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 6,
                  color: '#10b981', letterSpacing: '0.1em', wordBreak: 'break-all',
                }}>
                  {enrollData.secret}
                </div>
              </Field>
              <Field label="Código de verificação">
                <input
                  style={{ ...inputStyle, letterSpacing: '0.2em', fontSize: 16, textAlign: 'center' }}
                  type="text" inputMode="numeric" maxLength={6}
                  placeholder="000 000"
                  value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </Field>
              {feedback && <Feedback {...feedback} />}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={verifyEnroll} disabled={loading || code.length < 6}
                  style={{
                    background: '#10b981', color: '#fff', border: 'none', borderRadius: 7,
                    padding: '9px 18px', fontSize: 13, fontWeight: 600,
                    cursor: loading || code.length < 6 ? 'not-allowed' : 'pointer',
                    opacity: loading || code.length < 6 ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Verificando…' : 'Confirmar'}
                </button>
                <button
                  onClick={() => { setStep('idle'); setEnrollData(null); setCode('') }}
                  style={{
                    background: 'none', border: '1px solid #2a2a2a', borderRadius: 7,
                    color: '#666', fontSize: 13, cursor: 'pointer', padding: '9px 14px',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ConfiguracoesClient({ userEmail }: { userEmail: string }) {
  const [open, setOpen] = useState<Section>(null)

  function toggle(s: Section) {
    setOpen(o => o === s ? null : s)
  }

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, color: '#f0f0f0', marginBottom: 4 }}>Configurações</h1>
        <p style={{ fontSize: 12, color: '#555' }}>Gerencie sua conta e preferências de segurança.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionCard
          title="E-mail"
          description={`Atual: ${userEmail}`}
          open={open === 'email'}
          onToggle={() => toggle('email')}
        >
          <EmailSection currentEmail={userEmail} />
        </SectionCard>

        <SectionCard
          title="Senha"
          description="Altere sua senha de acesso"
          open={open === 'senha'}
          onToggle={() => toggle('senha')}
        >
          <SenhaSection />
        </SectionCard>

        <SectionCard
          title="Notificações Push"
          description="Alertas em tempo real no navegador"
          open={open === 'notificacoes'}
          onToggle={() => toggle('notificacoes')}
        >
          <NotificacoesSection />
        </SectionCard>

        <SectionCard
          title="Autenticação de Dois Fatores"
          description="Adicione uma camada extra de segurança (TOTP)"
          open={open === '2fa'}
          onToggle={() => toggle('2fa')}
        >
          <MfaSection />
        </SectionCard>
      </div>
    </div>
  )
}
