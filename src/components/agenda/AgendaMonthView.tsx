'use client'

import { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Appointment } from '@/types/database'
import { AgendaEventDetail } from './AgendaEventDetail'

const TYPE_COLORS: Record<string, string> = { visita: '#10b981', call: '#42a5f5', reuniao: '#ab47bc' }
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

type AppointmentWithLead = Appointment & { lead?: { nome: string; telefone: string } }

interface Props {
  initialAppointments: AppointmentWithLead[]
  selectedDate: Date
  activeFilters: string[]
}

export function AgendaMonthView({ initialAppointments, selectedDate, activeFilters }: Props) {
  const [clickedDay, setClickedDay] = useState<Date | null>(null)
  const [selected, setSelected] = useState<AppointmentWithLead | null>(null)

  const filtered = activeFilters.length === 0
    ? initialAppointments
    : initialAppointments.filter(a => activeFilters.includes(a.type))

  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd })

  const today = new Date()

  function getEventsForDay(day: Date) {
    return filtered.filter(a => isSameDay(new Date(a.start_at), day))
  }

  const dayEvents = clickedDay ? getEventsForDay(clickedDay) : []

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#f0f0f0', background: '#111', borderBottom: '1px solid #222' }}>
        {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#111', borderBottom: '1px solid #222' }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{ padding: '6px 0', textAlign: 'center', fontSize: 10, color: '#555', textTransform: 'uppercase' }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1 }}>
        {calDays.map(day => {
          const inMonth = isSameMonth(day, selectedDate)
          const isToday = isSameDay(day, today)
          const isClicked = clickedDay ? isSameDay(day, clickedDay) : false
          const events = getEventsForDay(day)

          return (
            <div
              key={day.toISOString()}
              onClick={() => setClickedDay(isClicked ? null : day)}
              style={{
                minHeight: 90, padding: '6px 8px',
                borderBottom: '1px solid #1c1c1c', borderRight: '1px solid #1c1c1c',
                background: isClicked ? '#10b98108' : 'transparent',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 4,
                background: isToday ? '#10b981' : 'transparent',
                fontSize: 12, fontWeight: isToday ? 700 : 400,
                color: !inMonth ? '#333' : isToday ? '#000' : '#f0f0f0',
              }}>
                {format(day, 'd')}
              </div>
              {events.slice(0, 2).map(evt => (
                <div
                  key={evt.id}
                  onClick={e => { e.stopPropagation(); setSelected(evt) }}
                  style={{
                    fontSize: 9, padding: '1px 5px', borderRadius: 3, marginBottom: 2,
                    background: `${TYPE_COLORS[evt.type] ?? '#555'}22`,
                    color: TYPE_COLORS[evt.type] ?? '#555',
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    cursor: 'pointer',
                  }}
                >
                  {evt.title}
                </div>
              ))}
              {events.length > 2 && (
                <div style={{ fontSize: 9, color: '#555' }}>+{events.length - 2}</div>
              )}
            </div>
          )
        })}
      </div>

      {clickedDay && dayEvents.length > 0 && (
        <div style={{ borderTop: '1px solid #222', padding: 16, background: '#111' }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: '#f0f0f0' }}>
            {format(clickedDay, "d 'de' MMMM", { locale: ptBR })}
          </div>
          {dayEvents.map(evt => {
            const color = evt.created_by === 'agent' ? '#4a148c' : (TYPE_COLORS[evt.type] ?? '#555')
            return (
              <div
                key={evt.id}
                onClick={() => setSelected(evt)}
                style={{
                  padding: '8px 12px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  background: `${color}11`, border: `1px solid ${color}33`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#f0f0f0', fontWeight: 500 }}>{evt.title}</div>
                  <div style={{ fontSize: 10, color: '#555' }}>
                    {format(new Date(evt.start_at), 'HH:mm')}
                    {evt.lead ? ` · ${evt.lead.nome}` : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected && <AgendaEventDetail appointment={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
