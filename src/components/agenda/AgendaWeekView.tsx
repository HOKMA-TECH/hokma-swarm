'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfWeek, addDays, isSameDay, getHours, getMinutes } from 'date-fns'
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

export function AgendaWeekView({ initialAppointments, selectedDate, activeFilters }: Props) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [selected, setSelected] = useState<AppointmentWithLead | null>(null)
  const supabase = createClient()

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    const channel = supabase
      .channel('appointments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        supabase.from('appointments').select('*, lead:leads(nome, telefone)')
          .order('start_at').then(({ data }) => data && setAppointments(data as AppointmentWithLead[]))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = activeFilters.length === 0
    ? appointments
    : appointments.filter(a => activeFilters.includes(a.type))

  function getEventsForDayHour(day: Date, hour: number) {
    return filtered.filter(a => {
      const start = new Date(a.start_at)
      return isSameDay(start, day) && getHours(start) === hour
    })
  }

  function getTopPercent(a: Appointment) {
    return (getMinutes(new Date(a.start_at)) / 60) * 100
  }

  const today = new Date()

  return (
    <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', minWidth: 700 }}>
        <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '10px 0' }} />
        {weekDays.map(day => {
          const isToday = isSameDay(day, today)
          return (
            <div key={day.toISOString()} style={{
              background: '#111', borderBottom: '1px solid #222', borderLeft: '1px solid #222',
              padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase' }}>
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div style={{
                fontSize: 18, fontWeight: 700, marginTop: 2,
                color: isToday ? '#10b981' : '#f0f0f0',
                width: 32, height: 32, borderRadius: '50%', margin: '2px auto 0',
                background: isToday ? '#10b98122' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {format(day, 'd')}
              </div>
            </div>
          )
        })}

        {HOURS.map(hour => (
          <React.Fragment key={hour}>
            <div style={{
              borderBottom: '1px solid #1c1c1c', padding: '0 8px',
              display: 'flex', alignItems: 'flex-start', paddingTop: 6, height: 64,
            }}>
              <span style={{ fontSize: 10, color: '#555' }}>{String(hour).padStart(2, '0')}h</span>
            </div>
            {weekDays.map(day => {
              const events = getEventsForDayHour(day, hour)
              return (
                <div key={`${day.toISOString()}-${hour}`} style={{
                  borderBottom: '1px solid #1c1c1c', borderLeft: '1px solid #1c1c1c',
                  height: 64, position: 'relative',
                }}>
                  {events.map(evt => {
                    const color = TYPE_COLORS[evt.type] ?? '#555'
                    const agentColor = evt.created_by === 'agent' ? '#4a148c' : color
                    return (
                      <div
                        key={evt.id}
                        onClick={() => setSelected(evt)}
                        style={{
                          position: 'absolute', left: 3, right: 3,
                          top: `${getTopPercent(evt)}%`,
                          background: `${agentColor}22`, border: `1px solid ${agentColor}66`,
                          borderRadius: 6, padding: '3px 6px', cursor: 'pointer',
                          fontSize: 10, color: agentColor, fontWeight: 600,
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          zIndex: 1,
                        }}
                      >
                        {evt.title}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>

      {selected && (
        <AgendaEventDetail appointment={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
