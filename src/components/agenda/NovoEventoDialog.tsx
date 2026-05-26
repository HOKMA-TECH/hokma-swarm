'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface Lead { id: string; nome: string }

interface Props {
  leads: Lead[]
  initialDate?: Date
  initialHour?: number
  onClose: () => void
  onCreated: () => void
}

const TYPE_CONFIG = [
  { key: 'atendimento' as const, label: 'Atendimento', icon: '📋' },
  { key: 'visita'      as const, label: 'Visita',      icon: '🏠' },
  { key: 'agencia'     as const, label: 'Agência',     icon: '🏢' },
]

export function NovoEventoDialog({ leads, initialDate, initialHour, onClose, onCreated }: Props) {
  const baseDate = initialDate ?? new Date()
  const baseHour = initialHour ?? 10

  const [type, setType] = useState<'atendimento' | 'visita' | 'agencia'>('atendimento')
  const [title, setTitle] = useState('')
  const [leadId, setLeadId] = useState('')
  const [date, setDate] = useState(format(baseDate, 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(`${String(baseHour).padStart(2, '0')}:00`)
  const [endTime, setEndTime] = useState(`${String(baseHour + 1).padStart(2, '0')}:00`)
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function toISO(d: string, t: string) {
    return new Date(`${d}T${t}:00`).toISOString()
  }

  async function handleSave() {
    if (!title || !leadId) return
    setSaving(true)
    await supabase.from('appointments').insert({
      lead_id: leadId,
      type,
      title,
      start_at: toISO(date, startTime),
      end_at: toISO(date, endTime),
      location: location || null,
      notes: notes || null,
      created_by: 'corretor',
    })
    setSaving(false)
    onCreated()
    onClose()
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: '#00000088',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  }
  const box: React.CSSProperties = {
    background: '#111', border: '1px solid #222', borderRadius: 14,
    padding: 28, width: 420, display: 'flex', flexDirection: 'column', gap: 16,
  }
  const input: React.CSSProperties = {
    background: '#161616', border: '1px solid #222', borderRadius: 8,
    padding: '9px 12px', color: '#f0f0f0', fontSize: 13, outline: 'none', width: '100%',
  }
  const label: React.CSSProperties = { fontSize: 11, color: '#555', display: 'block', marginBottom: 5 }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Novo Evento</div>

        <div>
          <span style={label}>Tipo</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {TYPE_CONFIG.map(t => (
              <button key={t.key} onClick={() => setType(t.key)} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: type === t.key ? '#10b98122' : '#161616',
                border: `1px solid ${type === t.key ? '#10b981' : '#222'}`,
                color: type === t.key ? '#10b981' : '#999',
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={label}>Título *</label>
          <input style={input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Visita ao empreendimento" />
        </div>

        <div>
          <label style={label}>Cliente *</label>
          <select style={{ ...input, cursor: 'pointer' }} value={leadId} onChange={e => setLeadId(e.target.value)}>
            <option value="">Selecione um cliente</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div>
            <label style={label}>Data</label>
            <input type="date" style={input} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={label}>Início</label>
            <input type="time" style={input} value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div>
            <label style={label}>Fim</label>
            <input type="time" style={input} value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label style={label}>Local</label>
          <input style={input} value={location} onChange={e => setLocation(e.target.value)} placeholder="Endereço ou link" />
        </div>

        <div>
          <label style={label}>Observação</label>
          <textarea style={{ ...input, resize: 'none', fontFamily: 'inherit' }} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas adicionais" />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#161616', border: '1px solid #222', borderRadius: 8, padding: 10, color: '#999', fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !title || !leadId} style={{
            flex: 1, background: title && leadId ? '#10b981' : '#222', border: 'none', borderRadius: 8,
            padding: 10, color: title && leadId ? '#000' : '#555', fontSize: 13, fontWeight: 700,
            cursor: title && leadId ? 'pointer' : 'not-allowed',
          }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
