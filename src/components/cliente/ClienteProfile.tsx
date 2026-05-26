'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Lead } from '@/types/database'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#161616',
  border: '1px solid #222',
  borderRadius: 8,
  padding: '9px 12px',
  color: '#f0f0f0',
  fontSize: 13,
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#555',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
}

type LeadForm = {
  nome: string
  telefone: string
  email: string
  cpf: string
  renda: string
  tipo_imovel: string
  campaign_source: string
  observations: string
}

function formatInitialRenda(value: number | null) {
  return value === null ? '' : String(value)
}

function parseRenda(value: string) {
  const normalized = value
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '')

  return normalized ? Number(normalized) : null
}

export function ClienteProfile({ lead }: { lead: Lead }) {
  const [form, setForm] = useState<LeadForm>({
    nome: lead.nome,
    telefone: lead.telefone,
    email: lead.email ?? '',
    cpf: lead.cpf ?? '',
    renda: formatInitialRenda(lead.renda),
    tipo_imovel: lead.tipo_imovel ?? '',
    campaign_source: lead.campaign_source ?? '',
    observations: lead.observations ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const supabase = createClient()

  function updateField(field: keyof LeadForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setStatus('')
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.telefone.trim()) {
      setStatus('Nome e telefone são obrigatórios.')
      return
    }

    setSaving(true)
    setStatus('')

    const { error } = await supabase
      .from('leads')
      .update({
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim() || null,
        cpf: form.cpf.trim() || null,
        renda: parseRenda(form.renda),
        tipo_imovel: form.tipo_imovel.trim() || null,
        campaign_source: form.campaign_source.trim() || null,
        observations: form.observations.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id)

    setSaving(false)
    setStatus(error ? 'Erro ao salvar. Tente novamente.' : 'Dados salvos.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 18 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Dados do cliente</div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? '#222' : '#10b981',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              color: saving ? '#555' : '#000',
              fontSize: 12,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Nome</span>
            <input style={inputStyle} value={form.nome} onChange={e => updateField('nome', e.target.value)} />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Telefone</span>
            <input style={inputStyle} value={form.telefone} onChange={e => updateField('telefone', e.target.value)} />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Email</span>
            <input style={inputStyle} type="email" value={form.email} onChange={e => updateField('email', e.target.value)} />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>CPF</span>
            <input style={inputStyle} value={form.cpf} onChange={e => updateField('cpf', e.target.value)} />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Renda declarada</span>
            <input style={inputStyle} value={form.renda} onChange={e => updateField('renda', e.target.value)} />
          </label>
          <label style={fieldStyle}>
            <span style={labelStyle}>Tipo de imóvel</span>
            <input style={inputStyle} value={form.tipo_imovel} onChange={e => updateField('tipo_imovel', e.target.value)} />
          </label>
          <label style={{ ...fieldStyle, gridColumn: '1/-1' }}>
            <span style={labelStyle}>Origem / campanha</span>
            <input style={inputStyle} value={form.campaign_source} onChange={e => updateField('campaign_source', e.target.value)} />
          </label>
        </div>

        {status && (
          <div style={{
            marginTop: 12,
            fontSize: 12,
            color: status.includes('Erro') || status.includes('obrigatórios') ? '#ef5350' : '#10b981',
          }}>
            {status}
          </div>
        )}
      </div>

      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Observações</div>
        <textarea
          value={form.observations}
          onChange={e => updateField('observations', e.target.value)}
          placeholder="Adicione uma observação..."
          rows={4}
          style={{
            width: '100%',
            background: '#161616',
            border: '1px solid #222',
            borderRadius: 8,
            padding: '10px 12px',
            color: '#f0f0f0',
            fontSize: 13,
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  )
}
