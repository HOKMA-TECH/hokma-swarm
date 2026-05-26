'use client'

import { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Appointment } from '@/types/database'
import { AgendaEventDetail } from './AgendaEventDetail'

const TYPE_COLORS: Record<string, string> = { atendimento: '#42a5f5', visita: '#10b981', agencia: '#ffab40' }
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

type AppointmentWithLead = Appointment & { lead?: { nome: string; telefone: string } }

interface Props {
  appointments: AppointmentWithLead[]
  selectedDate: Date
  activeFilters: string[]
  onSlotClick: (date: Date) => void
  onRefresh: () => void
}

export function AgendaMonthView({ appointments, selectedDate, activeFilters, onSlotClick, onRefresh }: Props) {
  const [selected, setSelected] = useState<AppointmentWithLead | null>(null)

  const filtered = activeFilters.length === 0
    ? appointments
    : appointments.filter(a => activeFilters.includes(a.type))

  const calDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 1 }),
  })

  const today = new Date()

  function getEventsForDay(day: Date) {
    return filtered.filter(a => isSameDay(new Date(a.start_at), day))
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#f0f0f0', background: '#111', borderBottom: '1px solid #222' }}>
        {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#111', borderBottom: '1px solid #222' }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{ padding: '6px 0', textAlign: 'center', fontSize: 10, color: '#555', textTransform: 'uppercase' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1 }}>
        {calDays.map(day => {
          const inMonth = isSameMonth(day, selectedDate)
          const isToday = isSameDay(day, today)
          const events  = getEventsForDay(day)

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSlotClick(day)}
              style={{
                minHeight: 90, padding: '6px 8px',
                borderBottom: '1px solid #1c1c1c', borderRight: '1px solid #1c1c1c',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#10b98106' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%', marginBottom: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isToday ? '#10b981' : 'transparent',
                fontSize: 12, fontWeight: isToday ? 700 : 400,
                color: !inMonth ? '#333' : isToday ? '#000' : '#f0f0f0',
              }}>
                {format(day, 'd')}
              </div>
              {events.slice(0, 2).map(evt => {
                const done = evt.status === 'realizado'
                return (
                  <div
                    key={evt.id}
                    onClick={e => { e.stopPropagation(); setSelected(evt) }}
                    style={{
                      fontSize: 9, padding: '1px 5px', borderRadius: 3, marginBottom: 2,
                      background: `${TYPE_COLORS[evt.type] ?? '#555'}22`,
                      color: done ? '#555' : (TYPE_COLORS[evt.type] ?? '#555'),
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                      cursor: 'pointer',
                      textDecoration: done ? 'line-through' : 'none',
                      opacity: done ? 0.6 : 1,
                    }}
                  >
                    {evt.title}
                  </div>
                )
              })}
              {events.length > 2 && <div style={{ fontSize: 9, color: '#555' }}>+{events.length - 2}</div>}
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
