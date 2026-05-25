'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CreditAnalysis } from '@/types/database'
import { formatDate } from '@/lib/utils'

const STEPS = [
  'Preparar documentos',
  'Enviar para análise',
  'Aguardando resposta',
  'Resultado recebido',
]

const STATUS_STEP: Record<string, number> = {
  draft: 1, enviado: 2, aprovado: 3, reprovado: 3, condicionado: 3,
}

const STATUS_COLORS: Record<string, string> = {
  aprovado: '#10b981', reprovado: '#ef5350', condicionado: '#ffab40',
}

interface Props {
  leadId: string
  creditAnalysis: CreditAnalysis | null
}

export function CreditAnalysisDropdown({ leadId, creditAnalysis }: Props) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [analysis, setAnalysis] = useState(creditAnalysis)
  const supabase = createClient()

  const currentStep = analysis ? STATUS_STEP[analysis.status] ?? 1 : 0

  async function handleSend() {
    setSending(true)
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/send-credit-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ lead_id: leadId }),
    })
    const { data } = await supabase.from('credit_analyses').select('*').eq('lead_id', leadId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    setAnalysis(data)
    setSending(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: '#161616', border: '1px solid #222', borderRadius: 8,
          padding: '7px 14px', fontSize: 13, color: '#f0f0f0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        Análise de Crédito
        <span style={{ fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 100,
          background: '#111', border: '1px solid #222', borderRadius: 12,
          padding: 20, width: 320, boxShadow: '0 8px 32px #00000066',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {STEPS.map((step, i) => {
              const done = i < currentStep
              const active = i === currentStep
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: done ? '#10b981' : active ? '#10b98144' : '#1c1c1c',
                    border: `1px solid ${done ? '#10b981' : active ? '#10b981' : '#222'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: done ? '#000' : active ? '#10b981' : '#555',
                    fontWeight: 700,
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: done ? '#10b981' : active ? '#f0f0f0' : '#555' }}>
                    {step}
                  </span>
                </div>
              )
            })}
          </div>

          {analysis && ['aprovado', 'reprovado', 'condicionado'].includes(analysis.status) && (
            <div style={{
              background: `${STATUS_COLORS[analysis.status]}11`,
              border: `1px solid ${STATUS_COLORS[analysis.status]}44`,
              borderRadius: 10, padding: '12px 14px', marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: `${STATUS_COLORS[analysis.status]}22`,
                  color: STATUS_COLORS[analysis.status],
                }}>
                  {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
                </span>
                <span style={{ fontSize: 10, color: '#555' }}>
                  {analysis.responded_at ? formatDate(analysis.responded_at) : ''}
                </span>
              </div>
              {analysis.response_text && (
                <p style={{ fontSize: 11, color: '#999', lineHeight: 1.5 }}>
                  {analysis.response_text.slice(0, 200)}
                  {analysis.response_text.length > 200 ? '…' : ''}
                </p>
              )}
            </div>
          )}

          {(!analysis || analysis.status === 'draft') && (
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                width: '100%', background: '#10b981', border: 'none', borderRadius: 8,
                padding: '10px', color: '#000', fontWeight: 700, fontSize: 13,
                cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? 'Enviando...' : 'Enviar para análise'}
            </button>
          )}

          {analysis?.status === 'enviado' && (
            <p style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
              Aguardando resposta desde {analysis.sent_at ? formatDate(analysis.sent_at) : '—'}
            </p>
          )}

          {analysis && ['aprovado', 'reprovado', 'condicionado'].includes(analysis.status) && (
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                width: '100%', background: '#161616', border: '1px solid #222',
                borderRadius: 8, padding: '9px', color: '#999', fontSize: 12,
                cursor: 'pointer', marginTop: 10,
              }}
            >
              Reenviar para análise
            </button>
          )}
        </div>
      )}
    </div>
  )
}
