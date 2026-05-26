'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CreditAnalysis, Document, Lead } from '@/types/database'
import { formatDate } from '@/lib/utils'

const STEPS = [
  'Preparar documentos',
  'Enviar para análise',
  'Aguardando resposta',
  'Resultado recebido',
]

const STATUS_STEP: Record<string, number> = {
  draft: 1, enviado: 2, aprovado: 4, reprovado: 4, condicionado: 4, recebido: 4,
}

const STATUS_COLORS: Record<string, string> = {
  aprovado: '#10b981', reprovado: '#ef5350', condicionado: '#ffab40', recebido: '#888',
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: '#00000088', backdropFilter: 'blur(2px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
}

const modalStyle: React.CSSProperties = {
  background: '#111', border: '1px solid #222', borderRadius: 16,
  boxShadow: '0 32px 80px #00000099',
  animation: 'fadeUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
}

const inp: React.CSSProperties = {
  width: '100%', background: '#161616', border: '1px solid #2a2a2a',
  borderRadius: 8, padding: '9px 12px', color: '#f0f0f0', fontSize: 13, outline: 'none',
}

const lbl: React.CSSProperties = { fontSize: 11, color: '#555', marginBottom: 4, display: 'block' }

/* ── Email chip input (like Gmail) ───────────────────────── */
function EmailChipInput({
  label,
  chips,
  inputVal,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
  autoFocus,
}: {
  label: string
  chips: string[]
  inputVal: string
  onInputChange: (v: string) => void
  onAdd: (email: string) => void
  onRemove: (email: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function commit(raw: string) {
    const email = raw.trim().replace(/,$/, '')
    if (email && !chips.includes(email)) onAdd(email)
    onInputChange('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit(inputVal)
    } else if (e.key === 'Backspace' && inputVal === '' && chips.length > 0) {
      onRemove(chips[chips.length - 1])
    }
  }

  return (
    <div>
      <label style={lbl}>{label}</label>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5,
          background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8,
          padding: '6px 10px', minHeight: 40, cursor: 'text',
        }}
      >
        {chips.map(email => (
          <span key={email} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#10b98122', border: '1px solid #10b98144',
            borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#10b981',
            whiteSpace: 'nowrap',
          }}>
            {email}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRemove(email) }}
              style={{ background: 'none', border: 'none', color: '#10b98199', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center' }}
            >×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={inputVal}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputVal.trim()) commit(inputVal) }}
          placeholder={chips.length === 0 ? (placeholder ?? '') : ''}
          style={{
            flex: 1, minWidth: 140, background: 'none', border: 'none',
            outline: 'none', color: '#f0f0f0', fontSize: 13, padding: '2px 0',
          }}
        />
      </div>
    </div>
  )
}

/* ── Email body builder ───────────────────────────────────── */
function buildEmailBody(lead: Lead): string {
  const ni = (v: string | null | undefined) => v || 'Não informado'
  const fmtR = (v: number | null | undefined) =>
    v != null ? 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'Não informado'
  const ordinal = (n: number) => n === 1 ? '1º' : n === 2 ? '2º' : n === 3 ? '3º' : n + 'º'

  type P = {
    nome?: string | null; cpf?: string | null; email?: string | null
    telefone?: string | null; endereco?: string | null; profissao?: string | null
    renda?: number | null; tipo_renda?: string | null; cotista?: boolean; fator_social?: boolean
  }

  function propBlock(idx: number, p: P) {
    let s = ordinal(idx) + ' PROPONENTE\n'
    s += 'NOME: ' + ni(p.nome) + '\n'
    s += 'CPF: ' + ni(p.cpf) + '\n'
    s += 'E-MAIL: ' + ni(p.email) + '\n'
    s += 'TELEFONE: ' + ni(p.telefone) + '\n'
    if (p.endereco) s += 'ENDEREÇO: ' + p.endereco + '\n'
    if (p.profissao) s += 'PROFISSÃO: ' + p.profissao + '\n'
    s += 'RENDA: ' + fmtR(p.renda) + '\n'
    if (p.tipo_renda) s += 'TIPO DE RENDA: ' + (p.tipo_renda.charAt(0).toUpperCase() + p.tipo_renda.slice(1)) + '\n'
    s += 'COTISTA FGTS: ' + (p.cotista ? 'Sim' : 'Não') + '\n'
    s += 'FATOR SOCIAL: ' + (p.fator_social ? 'Sim' : 'Não') + '\n'
    return s
  }

  let body = 'Bom dia, solicito a análise de crédito do cliente em questão.\n\n'

  body += propBlock(1, {
    nome: lead.nome, cpf: lead.cpf, email: lead.email,
    telefone: lead.telefone, endereco: lead.endereco, profissao: lead.profissao,
    renda: lead.renda, tipo_renda: lead.tipo_renda, cotista: lead.cotista, fator_social: lead.fator_social,
  }) + '\n'

  const extras = lead.proponentes ?? []
  extras.forEach((p, i) => { body += propBlock(i + 2, p) + '\n' })

  if (lead.observations) body += 'OBSERVAÇÕES: ' + lead.observations + '\n\n'

  body += 'Documentos em anexo.'
  return body
}

/* ── Compose Email Modal (Step 2) ─────────────────────────── */
function ComposeEmailModal({
  lead,
  onClose,
  onSent,
}: {
  lead: Lead
  onClose: () => void
  onSent: (a: CreditAnalysis | null) => void
}) {
  const supabase = createClient()
  const [docs, setDocs] = useState<Document[]>([])

  const [toChips, setToChips] = useState<string[]>([])
  const [toInput, setToInput] = useState('')
  const [ccChips, setCcChips] = useState<string[]>([])
  const [ccInput, setCcInput] = useState('')
  const [bccChips, setBccChips] = useState<string[]>([])
  const [bccInput, setBccInput] = useState('')

  const [subject, setSubject] = useState(() => {
    const empreend = lead.empreendimento ?? lead.tipo_imovel ?? 'Não informado'
    const extras = (lead.proponentes ?? []).map((p: any) => p.nome).filter(Boolean)
    const todosNomes = [lead.nome, ...extras].join(' + ')
    return 'HOKMA SWARM | SOLICITO ANÁLISE | ' + empreend + ' | ' + todosNomes
  })
  const [body, setBody] = useState(() => buildEmailBody(lead))
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('documents').select('*').eq('lead_id', lead.id).order('uploaded_at')
      .then(({ data }) => setDocs(data ?? []))
  }, [lead.id])

  function removeDoc(id: string) { setDocs(prev => prev.filter(d => d.id !== id)) }

  const allTo = toInput.trim() ? [...toChips, toInput.trim()] : toChips
  const canSend = allTo.length > 0

  async function handleSend() {
    if (!canSend) { setError('Informe ao menos um e-mail de destino.'); return }
    setSending(true)
    setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const ccStr = (ccInput.trim() ? [...ccChips, ccInput.trim()] : ccChips).join(', ')
    const bccStr = (bccInput.trim() ? [...bccChips, bccInput.trim()] : bccChips).join(', ')
    const res = await fetch('/api/send-credit-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session?.access_token },
      body: JSON.stringify({ lead_id: lead.id, to_email: allTo.join(', '), cc: ccStr, bcc: bccStr, subject, body }),
    })
    setSending(false)
    if (!res.ok) { setError('Erro ao enviar. Tente novamente.'); return }
    await supabase.from('leads').update({ stage: 'em_analise' }).eq('id', lead.id)
    const { data } = await supabase.from('credit_analyses').select('*').eq('lead_id', lead.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    // Fallback otimista: se o registro ainda não apareceu (timing), cria localmente
    const analysis = data ?? {
      id: '', lead_id: lead.id, status: 'enviado' as const,
      sent_at: new Date().toISOString(), responded_at: null,
      approved_value: null, response_text: null,
      response_subject: null, response_from: null, response_attachments: null,
      created_at: new Date().toISOString(),
    }
    onSent(analysis)
    onClose()
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...modalStyle, width: 640, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Novo Email</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Enviar para análise de crédito</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <EmailChipInput label="Para *" chips={toChips} inputVal={toInput} onInputChange={setToInput}
            onAdd={e => setToChips(p => [...p, e])} onRemove={e => setToChips(p => p.filter(x => x !== e))}
            placeholder="analise@banco.com" autoFocus />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <EmailChipInput label="Cc" chips={ccChips} inputVal={ccInput} onInputChange={setCcInput}
              onAdd={e => setCcChips(p => [...p, e])} onRemove={e => setCcChips(p => p.filter(x => x !== e))}
              placeholder="copia@empresa.com" />
            <EmailChipInput label="Cco (Bcc)" chips={bccChips} inputVal={bccInput} onInputChange={setBccInput}
              onAdd={e => setBccChips(p => [...p, e])} onRemove={e => setBccChips(p => p.filter(x => x !== e))}
              placeholder="secreto@empresa.com" />
          </div>

          <div>
            <label style={lbl}>Assunto</label>
            <input style={inp} value={subject} onChange={e => setSubject(e.target.value)} />
          </div>

          <div>
            <label style={lbl}>Corpo</label>
            <textarea rows={10} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              value={body} onChange={e => setBody(e.target.value)} />
          </div>

          {docs.length > 0 && (
            <div>
              <label style={lbl}>Anexos ({docs.length})</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {docs.map(doc => (
                  <div key={doc.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8, padding: '7px 12px',
                  }}>
                    <span style={{ fontSize: 14 }}>📎</span>
                    <span style={{ flex: 1, fontSize: 12, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                    {doc.type && <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700, flexShrink: 0 }}>{doc.type.toUpperCase()}</span>}
                    <button type="button" onClick={() => removeDoc(doc.id)} title="Remover anexo"
                      style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 17, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#444', marginTop: 8 }}>Os arquivos são enviados como links de acesso seguro.</div>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: '#ef5350', padding: '8px 12px', background: '#ef535011', border: '1px solid #ef535033', borderRadius: 8 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #1c1c1c', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#161616', border: '1px solid #222', borderRadius: 8, padding: '10px', color: '#999', fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSend} disabled={sending || !canSend}
            style={{
              flex: 2, border: 'none', borderRadius: 8, padding: '10px',
              background: canSend && !sending ? '#10b981' : '#222',
              color: canSend && !sending ? '#000' : '#555',
              fontSize: 13, fontWeight: 700,
              cursor: canSend && !sending ? 'pointer' : 'not-allowed',
            }}>
            {sending ? 'Enviando...' : 'Enviar →'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Awaiting Response Modal (Step 3) ─────────────────────── */
function AwaitingResponseModal({ analysis, onClose }: { analysis: CreditAnalysis | null; onClose: () => void }) {
  const sent = analysis != null && ['enviado', 'aprovado', 'reprovado', 'condicionado'].includes(analysis.status)

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...modalStyle, width: 480 }}>
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Aguardando Resposta</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '24px' }}>
          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ffab4011', border: '1px solid #ffab4033', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  ⏳
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#f0f0f0', fontWeight: 600 }}>Email enviado para análise</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>
                    Enviado em {analysis!.sent_at ? formatDate(analysis!.sent_at) : '—'}
                  </div>
                </div>
              </div>
              <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>Status</div>
                <div style={{ fontSize: 13, color: '#ffab40', fontWeight: 600 }}>Aguardando resposta do banco</div>
              </div>
              <div style={{ fontSize: 11, color: '#444', textAlign: 'center', lineHeight: 1.6 }}>
                Quando receber a resposta, ela aparecerá em "Resultado Recebido".
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#555', textAlign: 'center', padding: '20px 0', lineHeight: 1.6 }}>
              Nenhum email foi enviado ainda.<br />
              Clique em <strong style={{ color: '#f0f0f0' }}>"Enviar para análise"</strong> para iniciar.
            </div>
          )}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid #1c1c1c' }}>
          <button onClick={onClose} style={{ width: '100%', background: '#161616', border: '1px solid #222', borderRadius: 8, padding: '10px', color: '#999', fontSize: 13, cursor: 'pointer' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── PDF Viewer via blob URL (bypasses Content-Disposition: attachment) ── */
function PdfViewer({ url }: { url: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    let blobUrl: string | null = null
    fetch(url)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.blob() })
      .then(blob => { blobUrl = URL.createObjectURL(blob); setSrc(blobUrl) })
      .catch(() => setErr(true))
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [url])

  if (err) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
      <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>Não foi possível pré-visualizar.</div>
      <a href={url} target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 13, color: '#10b981', textDecoration: 'underline' }}>
        Abrir em nova aba
      </a>
    </div>
  )
  if (!src) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#555', fontSize: 13 }}>Carregando...</div>
  )
  return (
    <embed src={src} type="application/pdf"
      style={{ width: '80vw', height: '76vh', display: 'block' }} />
  )
}

/* ── Attachment Preview Popup ─────────────────────────────── */
function AttachmentPopup({
  att,
  onClose,
}: {
  att: { filename: string; content_type: string; url?: string; inline?: boolean }
  onClose: () => void
}) {
  const isImage = att.content_type?.startsWith('image/')
  const isPdf   = att.content_type === 'application/pdf'
  const ext     = att.content_type?.split('/')[1]?.toUpperCase() ?? ''

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#000000cc', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ ...modalStyle, maxWidth: '90vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>{isPdf ? '📄' : isImage ? '🖼' : '📎'}</span>
            <span style={{ fontSize: 13, color: '#f0f0f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {att.filename}
            </span>
            {ext && <span style={{ fontSize: 10, color: '#555', flexShrink: 0 }}>{ext}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {att.url && (
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#aaa', background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 6, padding: '5px 10px', textDecoration: 'none' }}
              >
                Abrir ↗
              </a>
            )}
            {att.url && (
              <a
                href={att.url}
                download={att.filename}
                style={{ fontSize: 12, color: '#10b981', background: '#10b98122', border: '1px solid #10b98144', borderRadius: 6, padding: '5px 10px', textDecoration: 'none', fontWeight: 600 }}
              >
                Baixar ↓
              </a>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>
        </div>

        {/* Content */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, background: isImage ? '#0a0a0a' : '#111' }}>
          {att.url && isImage ? (
            <img
              src={att.url}
              alt={att.filename}
              style={{ maxWidth: '85vw', maxHeight: '78vh', objectFit: 'contain', display: 'block' }}
            />
          ) : att.url && isPdf ? (
            <PdfViewer url={att.url} />
          ) : att.url ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📎</div>
              <div style={{ fontSize: 14, color: '#f0f0f0', marginBottom: 20 }}>{att.filename}</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a href={att.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#aaa', background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 18px', textDecoration: 'none' }}>
                  Abrir ↗
                </a>
                <a href={att.url} download={att.filename}
                  style={{ fontSize: 13, color: '#10b981', background: '#10b98122', border: '1px solid #10b98144', borderRadius: 8, padding: '9px 18px', textDecoration: 'none', fontWeight: 600 }}>
                  Baixar ↓
                </a>
              </div>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{isImage ? '🖼' : '📎'}</div>
              <div style={{ fontSize: 14, color: '#f0f0f0', marginBottom: 6 }}>{att.filename}</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, maxWidth: 280 }}>
                Anexo recebido pelo banco.<br />
                O conteúdo do arquivo não é disponibilizado pela API do Resend.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Result Modal (Step 4) ────────────────────────────────── */
function ResultModal({ analysis, onClose }: { analysis: CreditAnalysis | null; onClose: () => void }) {
  const [previewAtt, setPreviewAtt] = useState<{ filename: string; content_type: string; url?: string; inline?: boolean } | null>(null)

  const hasResult = analysis != null && ['aprovado', 'reprovado', 'condicionado', 'recebido'].includes(analysis.status)
  const statusColor = hasResult ? (STATUS_COLORS[analysis!.status] ?? '#555') : '#555'
  const statusLabel = hasResult
    ? analysis!.status === 'recebido' ? 'Recebido' : (analysis!.status.charAt(0).toUpperCase() + analysis!.status.slice(1))
    : ''

  return (
    <>
      {previewAtt && <AttachmentPopup att={previewAtt} onClose={() => setPreviewAtt(null)} />}

      <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ ...modalStyle, width: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Resultado da Análise</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
          <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {hasResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Status + data */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
                    background: statusColor + '22', color: statusColor, border: '1px solid ' + statusColor + '44',
                  }}>
                    {statusLabel}
                  </span>
                  {analysis!.responded_at && (
                    <span style={{ fontSize: 11, color: '#555' }}>{formatDate(analysis!.responded_at)}</span>
                  )}
                </div>

                {/* Valor aprovado */}
                {analysis!.approved_value != null && (
                  <div style={{ background: '#10b98111', border: '1px solid #10b98133', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>Valor aprovado</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>
                      {'R$ ' + analysis!.approved_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )}

                {/* Cabeçalho do email */}
                <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, opacity: 0.5 }}>✉</span>
                    <span style={{ fontSize: 11, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email recebido</span>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {analysis!.response_from && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 11, color: '#555', minWidth: 52, flexShrink: 0, paddingTop: 1 }}>De:</span>
                        <span style={{ fontSize: 12, color: '#aaa', wordBreak: 'break-all' }}>{analysis!.response_from}</span>
                      </div>
                    )}
                    {analysis!.response_subject && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 11, color: '#555', minWidth: 52, flexShrink: 0, paddingTop: 1 }}>Assunto:</span>
                        <span style={{ fontSize: 12, color: '#f0f0f0', fontWeight: 600, lineHeight: 1.4 }}>
                          {analysis!.response_subject.replace(/\s*\[ref:[^\]]+\]/gi, '').trim()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Corpo do email + imagens inline */}
                {(() => {
                  const inlineImgs = (analysis!.response_attachments ?? []).filter(
                    a => a.inline && a.url && a.content_type?.startsWith('image/')
                  )
                  return (
                    <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: '#555', marginBottom: 10 }}>Mensagem</div>
                      {analysis!.response_text ? (
                        <div style={{ fontSize: 13, color: '#f0f0f0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          {analysis!.response_text}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#555', fontStyle: 'italic' }}>
                          Sem texto no corpo da mensagem.
                        </div>
                      )}
                      {inlineImgs.length > 0 && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {inlineImgs.map((img, i) => (
                            <img
                              key={i}
                              src={img.url}
                              alt={img.filename}
                              onClick={() => setPreviewAtt(img)}
                              style={{
                                maxWidth: '100%', borderRadius: 8, cursor: 'zoom-in',
                                border: '1px solid #2a2a2a', display: 'block',
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Anexos clicáveis */}
                {analysis!.response_attachments && analysis!.response_attachments.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>
                      Anexos ({analysis!.response_attachments.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {analysis!.response_attachments.map((att, i) => {
                        const isImg = att.content_type?.startsWith('image/')
                        return (
                          <button
                            key={i}
                            onClick={() => att.url ? setPreviewAtt(att) : setPreviewAtt(att)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                              background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px',
                              cursor: 'pointer', transition: 'border-color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = '#10b98155')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                          >
                            <span style={{ fontSize: 14, flexShrink: 0 }}>{isImg ? '🖼' : '📎'}</span>
                            <span style={{ flex: 1, fontSize: 12, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {att.filename}
                            </span>
                            {att.content_type && (
                              <span style={{ fontSize: 10, color: '#555', flexShrink: 0, marginRight: 4 }}>
                                {att.content_type.split('/')[1]?.toUpperCase()}
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: att.url ? '#10b981' : '#333', flexShrink: 0 }}>
                              {att.url ? '↗' : '›'}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#555', textAlign: 'center', padding: '20px 0', lineHeight: 1.6 }}>
                Nenhum resultado disponível ainda.<br />Aguardando resposta do banco.
              </div>
            )}
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid #1c1c1c', flexShrink: 0 }}>
            <button onClick={onClose} style={{ width: '100%', background: '#161616', border: '1px solid #222', borderRadius: 8, padding: '10px', color: '#999', fontSize: 13, cursor: 'pointer' }}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Main Dropdown ────────────────────────────────────────── */
interface Props {
  leadId: string
  lead: Lead
  creditAnalysis: CreditAnalysis | null
}

export function CreditAnalysisDropdown({ leadId, lead, creditAnalysis }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [analysis, setAnalysis] = useState(creditAnalysis)
  const [activeModal, setActiveModal] = useState<null | 'compose' | 'awaiting' | 'result'>(null)
  const ref = useRef<HTMLDivElement>(null)

  const currentStep = analysis ? (STATUS_STEP[analysis.status] ?? 1) : 0

  useEffect(() => {
    if (window.location.hash === '#analise') setOpen(true)
  }, [])

  useEffect(() => {
    if (activeModal) return
    function handleOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOut)
    return () => document.removeEventListener('mousedown', handleOut)
  }, [activeModal])

  function handleStepClick(idx: number) {
    if (idx === 0) { setOpen(false); return }
    if (idx === 1) setActiveModal('compose')
    if (idx === 2) setActiveModal('awaiting')
    if (idx === 3) setActiveModal('result')
  }

  const hasResult = analysis != null && ['aprovado', 'reprovado', 'condicionado', 'recebido'].includes(analysis.status)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: '#161616', border: '1px solid #222', borderRadius: 8,
          padding: '7px 14px', fontSize: 13, color: '#f0f0f0', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        Análise de Crédito
        <span style={{ fontSize: 10, display: 'inline-block', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 100,
          background: '#111', border: '1px solid #222', borderRadius: 12,
          paddingTop: 8, paddingBottom: 8, width: 280,
          boxShadow: '0 8px 32px #00000088',
        }}>
          <div style={{ fontSize: 10, color: '#444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 16px 8px' }}>
            Etapas da Análise
          </div>

          {STEPS.map((label, i) => {
            const done = i < currentStep
            const active = i === currentStep
            return (
              <button
                key={i}
                onClick={() => handleStepClick(i)}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', textAlign: 'left', transition: 'background 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#10b98108' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: done ? '#10b981' : active ? '#10b98133' : '#1a1a1a',
                  border: '1.5px solid ' + (done ? '#10b981' : active ? '#10b98188' : '#2a2a2a'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: done ? '#000' : active ? '#10b981' : '#444',
                  transition: 'all 0.2s',
                }}>
                  {i + 1}
                </div>
                <span style={{
                  flex: 1, fontSize: 13,
                  color: done ? '#10b981' : active ? '#f0f0f0' : '#555',
                  fontWeight: done || active ? 600 : 400,
                }}>
                  {label}
                </span>
                <span style={{ fontSize: 13, color: '#333' }}>›</span>
              </button>
            )
          })}

          {hasResult && (
            <div style={{ margin: '8px 16px 4px', padding: '8px 12px', background: STATUS_COLORS[analysis!.status] + '11', border: '1px solid ' + STATUS_COLORS[analysis!.status] + '33', borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: STATUS_COLORS[analysis!.status], fontWeight: 700 }}>
                {analysis!.status.charAt(0).toUpperCase() + analysis!.status.slice(1)}
              </span>
              {analysis!.responded_at && (
                <span style={{ fontSize: 10, color: '#555', marginLeft: 8 }}>{formatDate(analysis!.responded_at)}</span>
              )}
            </div>
          )}
        </div>
      )}

      {activeModal === 'compose' && (
        <ComposeEmailModal
          lead={lead}
          onClose={() => setActiveModal(null)}
          onSent={newAnalysis => { setAnalysis(newAnalysis); setOpen(false); router.refresh() }}
        />
      )}
      {activeModal === 'awaiting' && (
        <AwaitingResponseModal analysis={analysis} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'result' && (
        <ResultModal analysis={analysis} onClose={() => setActiveModal(null)} />
      )}
    </div>
  )
}
