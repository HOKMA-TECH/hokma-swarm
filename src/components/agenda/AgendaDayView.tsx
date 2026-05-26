'use client'

import { useState } from 'react'
import { format, isSameDay, getHours, getMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Appointment } from '@/types/database'
import { AgendaEventDetail } from './AgendaEventDetail'

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8)
const TYPE_COLORS: Record<string, string> = { atendimento: '#42a5f5', visita: '#10b981', agencia: '#ffab40' }

type AppointmentWithLead = Appointment & { lead?: { nome: string; telefone: string } }

interface Props {
  appointments: AppointmentWithLead[]
  selectedDate: Date
  activeFilters: string[]
  onSlotClick: (hour: number) => void
  onRefresh: () => void
}

export function AgendaDayView({ appointments, selectedDate, activeFilters, onSlotClick, onRefresh }: Props) {
  const [selected, setSelected] = useState<AppointmentWithLead | null>(null)

  const filtered = activeFilters.length === 0
    ? appointments
    : appointments.filter(a => activeFilters.includes(a.type))

  const dayEvents = filtered.filter(a => isSameDay(new Date(a.start_at), selectedDate))

  function getEventsForHour(hour: number) {
    return dayEvents.filter(a => getHours(new Date(a.start_at)) === hour)
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
      <div style={{
        background: '#111', borderBottom: '1px solid #222', padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: '#10b98122',
          border: '1px solid #10b98144', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#10b981',
        }}>
          {format(selectedDate, 'd')}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0', textTransform: 'capitalize' }}>
            {format(selectedDate, 'EEEE', { locale: ptBR })}
          </div>
          <div style={{ fontSize: 11, color: '#555' }}>
            {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#555' }}>
          {dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div>
        {HOURS.map(hour => {
          const events = getEventsForHour(hour)
          return (
            <div key={hour} style={{ display: 'flex', borderBottom: '1px solid #1c1c1c' }}>
              <div style={{ width: 50, flexShrink: 0, display: 'flex', alignItems: 'flex-start', padding: '6px 8px', height: 80 }}>
                <span style={{ fontSize: 10, color: '#555' }}>{String(hour).padStart(2, '0')}h</span>
              </div>
              <div
                onClick={() => onSlotClick(hour)}
                style={{
                  flex: 1, height: 80, position: 'relative',
                  borderLeft: '1px solid #1c1c1c', cursor: 'pointer', transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (events.length === 0) (e.currentTarget as HTMLElement).style.background = '#10b98106' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                {events.map(evt => {
                  const color = evt.created_by === 'agent' ? '#4a148c' : (TYPE_COLORS[evt.type] ?? '#555')
                  const done = evt.status === 'realizado'
                  return (
                    <div
                      key={evt.id}
                      onClick={e => { e.stopPropagation(); setSelected(evt) }}
                      style={{
                        position: 'absolute', left: 8, right: 8,
                        top: `${(getMinutes(new Date(evt.start_at)) / 60) * 100}%`,
                        background: `${color}22`, border: `1px solid ${color}66`,
                        borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                        fontSize: 12, color: done ? '#555' : color, fontWeight: 600, zIndex: 1,
                        textDecoration: done ? 'line-through' : 'none',
                        opacity: done ? 0.6 : 1,
                      }}
                    >
                      <div>{evt.title}</div>
                      {evt.lead && (
                        <div style={{ fontSize: 10, fontWeight: 400, color: done ? '#444' : `${color}cc` }}>
                          {evt.lead.nome}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <AgendaEventDetail
          appointment={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { setSelected(null); onRefresh() }}
          onDeleted={() => { setSelected(null); onRefresh() }}
        />
      )}
    </div>
  )
}
