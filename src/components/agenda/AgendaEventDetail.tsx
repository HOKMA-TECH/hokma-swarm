'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Appointment } from '@/types/database'
import { formatDate } from '@/lib/utils'

const TYPE_COLORS: Record<string, string> = { atendimento: '#42a5f5', visita: '#10b981', agencia: '#ffab40' }
const TYPE_LABELS: Record<string, string> = { atendimento: '📋 Atendimento', visita: '🏠 Visita', agencia: '🏢 Agência' }
const TYPE_SHORT:  Record<string, string> = { atendimento: 'Atend.', visita: 'Visita', agencia: 'Agência' }

type AptType = 'atendimento' | 'visita' | 'agencia'

interface Props {
  appointment: Appointment & { lead?: { nome: string; telefone: string } }
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
  containerStyle?: React.CSSProperties
}

const inp: React.CSSProperties = {
  background: '#161616', border: '1px solid #2a2a2a', borderRadius: 7,
  padding: '7px 10px', color: '#f0f0f0', fontSize: 12, outline: 'none', width: '100%',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

function toISO(d: string, t: string) {
  return new Date(`${d}T${t}:00`).toISOString()
}

const defaultContainerStyle: React.CSSProperties = {
  position: 'absolute', top: 0, right: 0, width: 300, height: '100%',
  background: '#111', borderLeft: '1px solid #222',
  display: 'flex', flexDirection: 'column', gap: 14, zIndex: 10, overflowY: 'auto',
}

export function AgendaEventDetail({ appointment: apt, onClose, onUpdated, onDeleted, containerStyle }: Props) {
  const supabase = createClient()
  const [editing, setEditing]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [type, setType]           = useState<AptType>((apt.type as AptType) ?? 'atendimento')
  const [title, setTitle]         = useState(apt.title)
  const [date, setDate]           = useState(format(new Date(apt.start_at), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(format(new Date(apt.start_at), 'HH:mm'))
  const [endTime, setEndTime]     = useState(format(new Date(apt.end_at),   'HH:mm'))
  const [location, setLocation]   = useState(apt.location ?? '')
  const [notes, setNotes]         = useState(apt.notes ?? '')

  const viewColor = TYPE_COLORS[apt.type] ?? '#555'

  async function handleMarkDone() {
    setLoading(true)
    await supabase.from('appointments').update({ status: 'realizado' }).eq('id', apt.id)
    setLoading(false)
    onUpdated()
  }

  async function handleDelete() {
    if (!window.confirm('Excluir este evento?')) return
    setLoading(true)
    await supabase.from('appointments').delete().eq('id', apt.id)
    setLoading(false)
    onDeleted()
  }

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)
    await supabase.from('appointments').update({
      type, title: title.trim(),
      start_at: toISO(date, startTime),
      end_at:   toISO(date, endTime),
      location: location.trim() || null,
      notes:    notes.trim()    || null,
    }).eq('id', apt.id)
    setLoading(false)
    onUpdated()
  }

  const merged: React.CSSProperties = { ...defaultContainerStyle, padding: '18px 20px', ...containerStyle }

  /* ── Edit mode ── */
  if (editing) {
    return (
      <div style={merged} className="no-scrollbar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0' }}>Editar Evento</span>
          <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {/* Type */}
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['atendimento', 'visita', 'agencia'] as AptType[]).map(t => {
              const c = TYPE_COLORS[t]
              return (
                <button key={t} onClick={() => setType(t)} style={{
                  flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  background: type === t ? `${c}22` : '#161616',
                  border: `1px solid ${type === t ? c : '#2a2a2a'}`,
                  color: type === t ? c : '#555',
                }}>{TYPE_SHORT[t]}</button>
              )
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Título</div>
          <input style={inp} value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Date — full row */}
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Data</div>
          <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {/* Start + End — side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Início</div>
            <input type="time" style={inp} value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fim</div>
            <input type="time" style={inp} value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>

        {/* Location */}
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Local</div>
          <input style={inp} value={location} onChange={e => setLocation(e.target.value)} placeholder="Endereço ou link" />
        </div>

        {/* Notes */}
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Observação</div>
          <textarea style={{ ...inp, resize: 'none' }} rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {/* Client (read-only) */}
        {apt.lead && (
          <div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cliente</div>
            <div style={{ fontSize: 12, color: '#888', padding: '7px 10px', background: '#0d0d0d', borderRadius: 7, border: '1px solid #1c1c1c' }}>
              {apt.lead.nome}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
          <button onClick={() => setEditing(false)} style={{
            flex: 1, background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8,
            padding: '9px 0', color: '#888', fontSize: 12, cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={handleSave} disabled={loading || !title.trim()} style={{
            flex: 2, background: title.trim() ? '#10b981' : '#222', border: 'none', borderRadius: 8,
            padding: '9px 0', color: title.trim() ? '#000' : '#555',
            fontSize: 12, fontWeight: 700, cursor: title.trim() ? 'pointer' : 'not-allowed',
          }}>{loading ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    )
  }

  /* ── View mode ── */
  return (
    <div style={merged}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${viewColor}22`, color: viewColor, fontWeight: 600 }}>
            {TYPE_LABELS[apt.type] ?? apt.type}
          </div>
          {apt.status === 'realizado' && (
            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: '#10b98122', color: '#10b981', fontWeight: 600 }}>
              ✓ Concluído
            </span>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>✕</button>
      </div>

      <div style={{
        fontSize: 15, fontWeight: 700, color: apt.status === 'realizado' ? '#555' : '#f0f0f0',
        textDecoration: apt.status === 'realizado' ? 'line-through' : 'none',
        lineHeight: 1.3,
      }}>{apt.title}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>CLIENTE</div>
          <div style={{ fontSize: 13, color: '#f0f0f0' }}>{apt.lead?.nome ?? '—'}</div>
          {apt.lead?.telefone && <div style={{ fontSize: 11, color: '#999' }}>{apt.lead.telefone}</div>}
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>DATA E HORA</div>
          <div style={{ fontSize: 13, color: '#f0f0f0' }}>{formatDate(apt.start_at)}</div>
          <div style={{ fontSize: 11, color: '#999' }}>até {formatDate(apt.end_at, 'HH:mm')}</div>
        </div>
        {apt.location && (
          <div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>LOCAL</div>
            <div style={{ fontSize: 13, color: '#f0f0f0' }}>{apt.location}</div>
          </div>
        )}
        {apt.notes && (
          <div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>OBSERVAÇÃO</div>
            <div style={{ fontSize: 12, color: '#999', lineHeight: 1.5 }}>{apt.notes}</div>
          </div>
        )}
        {apt.created_by === 'agent' && (
          <div style={{ fontSize: 11, padding: '5px 10px', background: '#4a148c22', border: '1px solid #4a148c44', borderRadius: 8, color: '#ce93d8' }}>
            Criado pelo agente IA
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        {apt.status !== 'realizado' && (
          <button onClick={handleMarkDone} disabled={loading} style={{
            background: '#10b98122', border: '1px solid #10b98155', borderRadius: 8,
            padding: '9px 0', color: '#10b981', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>✓ Marcar como Concluído</button>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEditing(true)} style={{
            flex: 1, background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8,
            padding: '8px 0', color: '#ccc', fontSize: 12, cursor: 'pointer',
          }}>Editar</button>
          <button onClick={handleDelete} disabled={loading} style={{
            flex: 1, background: '#ef535011', border: '1px solid #ef535033', borderRadius: 8,
            padding: '8px 0', color: '#ef5350', fontSize: 12, cursor: 'pointer',
          }}>Excluir</button>
        </div>
      </div>
    </div>
  )
}
