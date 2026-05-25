'use client'

import { useState } from 'react'
import { format, isSameDay, getHours, getMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Appointment } from '@/types/database'
import { AgendaEventDetail } from './AgendaEventDetail'

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8)
const TYPE_COLORS: Record<string, string> = { visita: '#10b981', call: '#42a5f5', reuniao: '#ab47bc' }

type AppointmentWithLead = Appointment & { lead?: { nome: string; telefone: string } }

interface Props {
  initialAppointments: AppointmentWithLead[]
  selectedDate: Date
  activeFilters: string[]
}

export function AgendaDayView({ initialAppointments, selectedDate, activeFilters }: Props) {
  const [selected, setSelected] = useState<AppointmentWithLead | null>(null)

  const filtered = activeFilters.length === 0
    ? initialAppointments
    : initialAppointments.filter(a => activeFilters.includes(a.type))

  const dayEvents = filtered.filter(a => isSameDay(new Date(a.start_at), selectedDate))

  function getEventsForHour(hour: number) {
    return dayEvents.filter(a => getHours(new Date(a.start_at)) === hour)
  }

  function getTopPercent(a: Appointment) {
    return (getMinutes(new Date(a.start_at)) / 60) * 100
  }

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
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
              <div style={{
                width: 50, flexShrink: 0,
                display: 'flex', alignItems: 'flex-start', padding: '6px 8px',
                height: 80,
              }}>
                <span style={{ fontSize: 10, color: '#555' }}>{String(hour).padStart(2, '0')}h</span>
              </div>
              <div style={{
                flex: 1, height: 80, position: 'relative',
                borderLeft: '1px solid #1c1c1c',
              }}>
                {events.map(evt => {
                  const color = evt.created_by === 'agent' ? '#4a148c' : (TYPE_COLORS[evt.type] ?? '#555')
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelected(evt)}
                      style={{
                        position: 'absolute', left: 8, right: 8,
                        top: `${getTopPercent(evt)}%`,
                        background: `${color}22`, border: `1px solid ${color}66`,
                        borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                        fontSize: 12, color, fontWeight: 600, zIndex: 1,
                      }}
                    >
                      <div>{evt.title}</div>
                      {evt.lead && (
                        <div style={{ fontSize: 10, fontWeight: 400, color: `${color}cc` }}>
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

      {selected && <AgendaEventDetail appointment={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
