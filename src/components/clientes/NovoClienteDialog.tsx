'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/types/database'

const inp: React.CSSProperties = {
  background: '#161616', border: '1px solid #222', borderRadius: 8,
  padding: '9px 12px', color: '#f0f0f0', fontSize: 13, outline: 'none', width: '100%',
}
const lbl: React.CSSProperties = {
  fontSize: 11, color: '#555', display: 'block', marginBottom: 5,
}

type TipoRenda = 'formal' | 'informal' | ''

interface PropForm {
  nome: string; cpf: string; email: string; telefone: string
  endereco: string; profissao: string; renda: string
  tipo_renda: TipoRenda; cotista: boolean; fator_social: boolean
}

function emptyProp(): PropForm {
  return { nome: '', cpf: '', email: '', telefone: '', endereco: '', profissao: '', renda: '', tipo_renda: '', cotista: false, fator_social: false }
}

function PillToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #222' }}>
        {(['Sim', 'Não'] as const).map(opt => {
          const selected = opt === 'Sim' ? value : !value
          return (
            <button key={opt} type="button" onClick={() => onChange(opt === 'Sim')} style={{
              flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: selected ? '#10b98122' : '#161616',
              color: selected ? '#10b981' : '#555',
              transition: 'all 0.15s',
            }}>{opt}</button>
          )
        })}
      </div>
    </div>
  )
}

function RendaToggle({ value, onChange }: { value: TipoRenda; onChange: (v: TipoRenda) => void }) {
  return (
    <div>
      <label style={lbl}>Tipo de renda</label>
      <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #222' }}>
        {(['formal', 'informal'] as const).map(opt => (
          <button key={opt} type="button" onClick={() => onChange(opt)} style={{
            flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
            background: value === opt ? '#10b98122' : '#161616',
            color: value === opt ? '#10b981' : '#555',
            textTransform: 'capitalize',
            transition: 'all 0.15s',
          }}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</button>
        ))}
      </div>
    </div>
  )
}

function ProponenteSection({ index, data, onChange, onRemove }: {
  index: number; data: PropForm
  onChange: (key: keyof PropForm, value: string | boolean) => void
  onRemove?: () => void
}) {
  return (
    <div style={{ border: '1px solid #1c1c1c', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ background: '#0d0d0d', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Proponente {index + 1}
          {index === 0 && <span style={{ color: '#555', marginLeft: 8, textTransform: 'none', fontWeight: 400, fontSize: 10 }}>Principal</span>}
        </div>
        {onRemove && (
          <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', color: '#ef5350', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px' }}>×</button>
        )}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Nome */}
        <div>
          <label style={lbl}>Nome completo {index === 0 && <span style={{ color: '#ef5350' }}>*</span>}</label>
          <input style={inp} value={data.nome} onChange={e => onChange('nome', e.target.value)} placeholder="Nome completo" autoFocus={index === 0} />
        </div>

        {/* CPF | Telefone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>CPF</label>
            <input style={inp} value={data.cpf} onChange={e => onChange('cpf', e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div>
            <label style={lbl}>Telefone / WhatsApp {index === 0 && <span style={{ color: '#ef5350' }}>*</span>}</label>
            <input style={inp} value={data.telefone} onChange={e => onChange('telefone', e.target.value)} placeholder="(11) 99999-9999" />
          </div>
        </div>

        {/* Email | Endereço */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>E-mail</label>
            <input style={inp} type="email" value={data.email} onChange={e => onChange('email', e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div>
            <label style={lbl}>Endereço</label>
            <input style={inp} value={data.endereco} onChange={e => onChange('endereco', e.target.value)} placeholder="Rua, número, bairro" />
          </div>
        </div>

        {/* Profissão | Renda */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>Profissão</label>
            <input style={inp} value={data.profissao} onChange={e => onChange('profissao', e.target.value)} placeholder="Ex: Engenheiro, Autônomo" />
          </div>
          <div>
            <label style={lbl}>Renda mensal (R$)</label>
            <input style={inp} value={data.renda} onChange={e => onChange('renda', e.target.value)} placeholder="5.000,00" />
          </div>
        </div>

        {/* Tipo renda | Cotista | Fator Social */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <RendaToggle value={data.tipo_renda} onChange={v => onChange('tipo_renda', v)} />
          <PillToggle label="Cotista FGTS" value={data.cotista} onChange={v => onChange('cotista', v)} />
          <PillToggle label="Fator Social" value={data.fator_social} onChange={v => onChange('fator_social', v)} />
        </div>
      </div>
    </div>
  )
}

interface Props {
  onClose: () => void
  onCreated?: (lead: Lead & { doc_count: number }) => void
  onDocumentUploaded?: (leadId: string) => void
  redirectOnFinish?: boolean
}

export function NovoClienteDialog({ onClose, onCreated, onDocumentUploaded, redirectOnFinish = true }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<'form' | 'docs'>('form')
  const [newLeadId, setNewLeadId] = useState<string | null>(null)
  const [newLeadNome, setNewLeadNome] = useState('')

  const [proponentes, setProponentes] = useState<PropForm[]>([emptyProp()])
  const [regiaoInteresse, setRegiaoInteresse] = useState('')
  const [empreendimento, setEmpreendimento] = useState('')
  const [vgv, setVgv] = useState('')
  const [campaignSource, setCampaignSource] = useState('')
  const [observations, setObservations] = useState('')

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  function updateProp(idx: number, key: keyof PropForm, value: string | boolean) {
    setProponentes(prev => prev.map((p, i) => i === idx ? { ...p, [key]: value } : p))
  }

  function parseRenda(r: string) {
    if (!r.trim()) return null
    return parseFloat(r.replace(/[^\d,]/g, '').replace(',', '.')) || null
  }

  async function handleCreate() {
    const main = proponentes[0]
    if (!main.nome.trim() || !main.telefone.trim()) {
      setFormError('Nome e telefone do proponente principal são obrigatórios.')
      return
    }
    setFormError('')
    setSaving(true)

    const extraProps = proponentes.slice(1).map(p => ({
      nome: p.nome.trim() || null,
      cpf: p.cpf.trim() || null,
      email: p.email.trim() || null,
      telefone: p.telefone.trim() || null,
      endereco: p.endereco.trim() || null,
      profissao: p.profissao.trim() || null,
      renda: parseRenda(p.renda),
      tipo_renda: p.tipo_renda || null,
      cotista: p.cotista,
      fator_social: p.fator_social,
    }))

    const { data, error } = await supabase
      .from('leads')
      .insert({
        nome: main.nome.trim(),
        telefone: main.telefone.trim(),
        email: main.email.trim() || null,
        cpf: main.cpf.trim() || null,
        renda: parseRenda(main.renda),
        tipo_renda: main.tipo_renda || null,
        cotista: main.cotista,
        fator_social: main.fator_social,
        endereco: main.endereco.trim() || null,
        profissao: main.profissao.trim() || null,
        regiao_interesse: regiaoInteresse.trim() || null,
        empreendimento: empreendimento.trim() || null,
        vgv: parseRenda(vgv),
        campaign_source: campaignSource.trim() || null,
        observations: observations.trim() || null,
        proponentes: extraProps.length > 0 ? extraProps : null,
        stage: 'pendente',
      })
      .select()
      .single()

    setSaving(false)

    if (error || !data) {
      setFormError('Erro ao criar cliente. Verifique os dados e tente novamente.')
      return
    }

    setNewLeadNome(main.nome.trim())
    setNewLeadId(data.id)
    onCreated?.({ ...(data as Lead), doc_count: 0 })
    setStep('docs')
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!newLeadId) return
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)

    for (const file of files) {
      const path = `${newLeadId}/${crypto.randomUUID()}-${file.name}`
      const { error: uploadErr } = await supabase.storage.from('documentos').upload(path, file)
      if (!uploadErr) {
        await supabase.from('documents').insert({
          lead_id: newLeadId,
          name: file.name,
          type: file.name.split('.').pop() ?? 'arquivo',
          storage_path: path,
          uploaded_by: 'corretor',
        })
        setUploadedDocs(prev => [...prev, file.name])
        onDocumentUploaded?.(newLeadId)
      }
    }

    setUploading(false)
    e.target.value = ''
  }

  function handleFinish() {
    if (redirectOnFinish && newLeadId) router.push(`/clientes/${newLeadId}`)
    onClose()
  }

  const mainValid = proponentes[0].nome.trim() && proponentes[0].telefone.trim()

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#00000088', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#111', border: '1px solid #222', borderRadius: 16,
        width: 680, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px #00000099',
        animation: 'fadeUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>
              {step === 'form' ? 'Novo Cliente' : 'Documentos'}
            </div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
              {step === 'form' ? 'Preencha os dados do cliente' : `${newLeadNome} — faça o upload dos documentos (opcional)`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[1, 2].map((n, i) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <div style={{ width: 24, height: 1, background: step === 'docs' ? '#10b981' : '#2a2a2a', transition: 'background 0.3s' }} />}
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: (n === 1 || step === 'docs') ? '#10b981' : '#222',
                  color: (n === 1 || step === 'docs') ? '#000' : '#555',
                  transition: 'all 0.3s',
                }}>{n}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {step === 'form' && (
            <>
              {proponentes.map((p, i) => (
                <ProponenteSection
                  key={i}
                  index={i}
                  data={p}
                  onChange={(key, val) => updateProp(i, key, val)}
                  onRemove={i > 0 ? () => setProponentes(prev => prev.filter((_, j) => j !== i)) : undefined}
                />
              ))}

              {/* Add proponent */}
              <button
                type="button"
                onClick={() => setProponentes(prev => [...prev, emptyProp()])}
                style={{
                  width: '100%', background: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 10,
                  padding: '12px 0', fontSize: 12, color: '#555', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b98166'; e.currentTarget.style.color = '#10b981' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Adicionar Proponente
              </button>

              {/* Empreendimento */}
              <div style={{ borderTop: '1px solid #1c1c1c', paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Empreendimento</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lbl}>Região de interesse</label>
                    <input style={inp} value={regiaoInteresse} onChange={e => setRegiaoInteresse(e.target.value)} placeholder="Ex: Zona Leste, Centro" />
                  </div>
                  <div>
                    <label style={lbl}>Empreendimento</label>
                    <input style={inp} value={empreendimento} onChange={e => setEmpreendimento(e.target.value)} placeholder="Nome do empreendimento" />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>VGV (R$)</label>
                    <input style={inp} value={vgv} onChange={e => setVgv(e.target.value)} placeholder="Ex: 250.000,00" />
                  </div>
                </div>
              </div>

              {/* Origem */}
              <div style={{ borderTop: '1px solid #1c1c1c', paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Origem</div>
                <div>
                  <label style={lbl}>Origem / Campanha</label>
                  <input style={inp} value={campaignSource} onChange={e => setCampaignSource(e.target.value)} placeholder="Meta Ads, Google, Indicação..." />
                </div>
              </div>

              {/* Observações */}
              <div style={{ borderTop: '1px solid #1c1c1c', paddingTop: 16 }}>
                <label style={lbl}>Observações</label>
                <textarea
                  style={{ ...inp, resize: 'none', fontFamily: 'inherit' }}
                  rows={3}
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Informações adicionais sobre o cliente..."
                />
              </div>

              {formError && (
                <div style={{ fontSize: 12, color: '#ef5350', padding: '10px 14px', background: '#ef535011', border: '1px solid #ef535033', borderRadius: 8 }}>
                  {formError}
                </div>
              )}
            </>
          )}

          {step === 'docs' && (
            <>
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed #2a2a2a', borderRadius: 12, padding: '36px 24px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
                background: 'transparent',
              }}
                onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = '#10b98166'; e.currentTarget.style.background = '#10b98106' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>📎</div>
                <div style={{ fontSize: 14, color: '#f0f0f0', fontWeight: 600, marginBottom: 4 }}>
                  {uploading ? 'Enviando...' : uploadedDocs.length > 0 ? 'Clique para adicionar mais arquivos' : 'Clique para selecionar arquivos'}
                </div>
                <div style={{ fontSize: 11, color: '#555' }}>PDF, JPG, PNG, DOC — máx. 10MB por arquivo</div>
                <input type="file" hidden onChange={handleUpload} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" disabled={uploading} multiple />
              </label>

              {uploadedDocs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>
                    {uploadedDocs.length} arquivo{uploadedDocs.length !== 1 ? 's' : ''} enviado{uploadedDocs.length !== 1 ? 's' : ''}
                  </div>
                  {uploadedDocs.map((name, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: '#161616', border: '1px solid #10b98133', borderRadius: 8 }}>
                      <span style={{ color: '#10b981', fontSize: 14 }}>✓</span>
                      <span style={{ fontSize: 12, color: '#f0f0f0', flex: 1 }}>{name}</span>
                      <span style={{ fontSize: 10, color: '#10b981' }}>Enviado</span>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ fontSize: 12, color: '#444', textAlign: 'center', marginTop: 4 }}>
                Você pode adicionar mais documentos depois, na ficha do cliente.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #1c1c1c', display: 'flex', gap: 10, flexShrink: 0 }}>
          {step === 'form' ? (
            <>
              <button onClick={onClose} style={{ flex: 1, background: '#161616', border: '1px solid #222', borderRadius: 8, padding: '11px 0', color: '#999', fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !mainValid}
                style={{
                  flex: 2, border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 13, fontWeight: 700,
                  background: mainValid ? '#10b981' : '#222',
                  color: mainValid ? '#000' : '#555',
                  cursor: mainValid ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                {saving ? 'Criando...' : 'Criar Cliente →'}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleFinish} style={{ flex: 1, background: '#161616', border: '1px solid #333', borderRadius: 8, padding: '11px 0', color: '#666', fontSize: 13, cursor: 'pointer' }}>
                Pular documentos
              </button>
              <button onClick={handleFinish} disabled={uploading} style={{ flex: 2, background: '#10b981', border: 'none', borderRadius: 8, padding: '11px 0', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {redirectOnFinish ? 'Ver ficha do cliente →' : 'Concluir'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
