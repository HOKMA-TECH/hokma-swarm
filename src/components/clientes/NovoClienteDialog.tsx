'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Lead } from '@/types/database'

const TIPO_OPTIONS = [
  'Apartamento', 'Casa', 'Terreno', 'Sala Comercial',
  'Galpão', 'Rural', 'Studio', 'Outro',
]

const inp: React.CSSProperties = {
  background: '#161616', border: '1px solid #222', borderRadius: 8,
  padding: '9px 12px', color: '#f0f0f0', fontSize: 13, outline: 'none', width: '100%',
}
const lbl: React.CSSProperties = {
  fontSize: 11, color: '#555', display: 'block', marginBottom: 5,
}
const divider: React.CSSProperties = {
  borderTop: '1px solid #1c1c1c', paddingTop: 16, marginTop: 4,
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

  // Step 1 fields
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [renda, setRenda] = useState('')
  const [tipoImovel, setTipoImovel] = useState('')
  const [campaignSource, setCampaignSource] = useState('')
  const [observations, setObservations] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Step 2
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  async function handleCreate() {
    if (!nome.trim() || !telefone.trim()) {
      setFormError('Nome e telefone são obrigatórios.')
      return
    }
    setFormError('')
    setSaving(true)

    const { data, error } = await supabase
      .from('leads')
      .insert({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || null,
        cpf: cpf.trim() || null,
        renda: renda ? parseFloat(renda.replace(/\D/g, '')) || null : null,
        tipo_imovel: tipoImovel || null,
        campaign_source: campaignSource.trim() || null,
        stage: 'pendente',
        observations: observations.trim() || null,
      })
      .select()
      .single()

    setSaving(false)

    if (error || !data) {
      setFormError('Erro ao criar cliente. Verifique os dados e tente novamente.')
      return
    }

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
      const { error: uploadErr } = await supabase.storage
        .from('documentos')
        .upload(path, file)

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

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: '#00000088', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#111', border: '1px solid #222', borderRadius: 16,
        width: 540, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px #00000099',
        animation: 'fadeUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid #1c1c1c',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>
              {step === 'form' ? 'Novo Cliente' : 'Documentos'}
            </div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
              {step === 'form'
                ? 'Preencha os dados do cliente'
                : `${nome} — faça o upload dos documentos (opcional)`}
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[1, 2].map((n, i) => (
              <>
                {i > 0 && (
                  <div key={`line-${n}`} style={{
                    width: 24, height: 1,
                    background: step === 'docs' ? '#10b981' : '#2a2a2a',
                    transition: 'background 0.3s',
                  }} />
                )}
                <div key={n} style={{
                  width: 26, height: 26, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  background: (n === 1 || step === 'docs') ? '#10b981' : '#222',
                  color: (n === 1 || step === 'docs') ? '#000' : '#555',
                  transition: 'all 0.3s',
                }}>
                  {n}
                </div>
              </>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {step === 'form' && (
            <>
              {/* Dados básicos */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Dados básicos
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Nome completo *</label>
                    <input style={inp} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João da Silva" autoFocus />
                  </div>
                  <div>
                    <label style={lbl}>Telefone / WhatsApp *</label>
                    <input style={inp} value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                  <div>
                    <label style={lbl}>E-mail</label>
                    <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joao@email.com" />
                  </div>
                  <div>
                    <label style={lbl}>CPF</label>
                    <input style={inp} value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <label style={lbl}>Renda mensal (R$)</label>
                    <input style={inp} value={renda} onChange={e => setRenda(e.target.value)} placeholder="5.000" />
                  </div>
                </div>
              </div>

              {/* Interesse */}
              <div style={divider}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  Interesse
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={lbl}>Tipo de imóvel</label>
                    <select style={{ ...inp, cursor: 'pointer' }} value={tipoImovel} onChange={e => setTipoImovel(e.target.value)}>
                      <option value="">Selecione...</option>
                      {TIPO_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Origem / Campanha</label>
                    <input style={inp} value={campaignSource} onChange={e => setCampaignSource(e.target.value)} placeholder="Meta Ads, Google, Indicação..." />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div style={divider}>
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
                <div style={{
                  fontSize: 12, color: '#ef5350', padding: '10px 14px',
                  background: '#ef535011', border: '1px solid #ef535033', borderRadius: 8,
                }}>
                  {formError}
                </div>
              )}
            </>
          )}

          {step === 'docs' && (
            <>
              {/* Upload zone */}
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed #2a2a2a', borderRadius: 12, padding: '36px 24px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
                background: 'transparent',
              }}
                onMouseEnter={e => { if (!uploading) (e.currentTarget.style.borderColor = '#10b98166'); (e.currentTarget.style.background = '#10b98106') }}
                onMouseLeave={e => { (e.currentTarget.style.borderColor = '#2a2a2a'); (e.currentTarget.style.background = 'transparent') }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>📎</div>
                <div style={{ fontSize: 14, color: '#f0f0f0', fontWeight: 600, marginBottom: 4 }}>
                  {uploading
                    ? 'Enviando...'
                    : uploadedDocs.length > 0
                      ? 'Clique para adicionar mais arquivos'
                      : 'Clique para selecionar arquivos'}
                </div>
                <div style={{ fontSize: 11, color: '#555' }}>
                  PDF, JPG, PNG, DOC — máx. 10MB por arquivo
                </div>
                <input
                  type="file"
                  hidden
                  onChange={handleUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  disabled={uploading}
                  multiple
                />
              </label>

              {/* Uploaded list */}
              {uploadedDocs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>
                    {uploadedDocs.length} arquivo{uploadedDocs.length !== 1 ? 's' : ''} enviado{uploadedDocs.length !== 1 ? 's' : ''}
                  </div>
                  {uploadedDocs.map((name, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', background: '#161616',
                      border: '1px solid #10b98133', borderRadius: 8,
                    }}>
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
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #1c1c1c',
          display: 'flex', gap: 10, flexShrink: 0,
        }}>
          {step === 'form' ? (
            <>
              <button
                onClick={onClose}
                style={{
                  flex: 1, background: '#161616', border: '1px solid #222', borderRadius: 8,
                  padding: '11px 0', color: '#999', fontSize: 13, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !nome.trim() || !telefone.trim()}
                style={{
                  flex: 2, border: 'none', borderRadius: 8,
                  padding: '11px 0', fontSize: 13, fontWeight: 700,
                  background: nome.trim() && telefone.trim() ? '#10b981' : '#222',
                  color: nome.trim() && telefone.trim() ? '#000' : '#555',
                  cursor: nome.trim() && telefone.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >
                {saving ? 'Criando...' : 'Criar Cliente →'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleFinish}
                style={{
                  flex: 1, background: '#161616', border: '1px solid #333', borderRadius: 8,
                  padding: '11px 0', color: '#666', fontSize: 13, cursor: 'pointer',
                }}
              >
                Pular documentos
              </button>
              <button
                onClick={handleFinish}
                disabled={uploading}
                style={{
                  flex: 2, background: '#10b981', border: 'none', borderRadius: 8,
                  padding: '11px 0', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {redirectOnFinish ? 'Ver ficha do cliente →' : 'Concluir'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
