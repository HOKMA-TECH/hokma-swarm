'use client'

import { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameDay, isSameMonth, addMonths, subMonths, isAfter, startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Appointment } from '@/types/database'

const TYPE_COLORS: Record<string, string> = { atendimento: '#42a5f5', visita: '#10b981', agencia: '#ffab40' }
const TYPE_LABELS: Record<string, string> = { atendimento: 'Atendimento', visita: 'Visita', agencia: 'Agência' }

const FILTERS = [
  { key: 'atendimento', label: 'Atendimento', color: '#42a5f5' },
  { key: 'visita',      label: 'Visita',      color: '#10b981' },
  { key: 'agencia',     label: 'Agência',     color: '#ffab40' },
]

type AppointmentWithLead = Appointment & { lead?: { nome: string; telefone: string } }

interface Props {
  appointments: AppointmentWithLead[]
  selectedDate: Date
  onDateSelect: (d: Date) => void
  activeFilters: string[]
  onFilterChange: (filters: string[]) => void
  onAppointmentClick?: (apt: AppointmentWithLead) => void
}

export function AgendaMiniCalendar({ appointments, selectedDate, onDateSelect, activeFilters, onFilterChange, onAppointmentClick }: Props) {
  const [viewMonth, setViewMonth] = useState(new Date())

  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) })
  const firstDow = (getDay(days[0]) + 6) % 7

  function toggleFilter(f: string) {
    onFilterChange(activeFilters.includes(f) ? activeFilters.filter(x => x !== f) : [...activeFilters, f])
  }

  function getDots(day: Date) {
    return appointments.filter(a => isSameDay(new Date(a.start_at), day))
  }

  const today = startOfDay(new Date())
  const upcoming = [...appointments]
    .filter(a => isAfter(new Date(a.start_at), today) || isSameDay(new Date(a.start_at), today))
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    .slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mini calendar */}
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => setViewMonth(m => subMonths(m, 1))} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16 }}>‹</button>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0' }}>
            {format(viewMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={() => setViewMonth(m => addMonths(m, 1))} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16 }}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
          {['S','T','Q','Q','S','S','D'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 9, color: '#555', padding: '2px 0' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {days.map(day => {
            const dots = getDots(day)
            const isSelected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())
            return (
              <div
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '3px 0', borderRadius: 6, cursor: 'pointer',
                  background: isSelected ? '#10b981' : isToday ? '#10b98122' : 'transparent',
                }}
              >
                <span style={{ fontSize: 11, color: isSelected ? '#000' : isSameMonth(day, viewMonth) ? '#f0f0f0' : '#333', fontWeight: isToday ? 700 : 400 }}>
                  {format(day, 'd')}
                </span>
                {dots.length > 0 && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 1 }}>
                    {dots.slice(0, 3).map((a, i) => (
                      <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#000' : (TYPE_COLORS[a.type] ?? '#555') }} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filtrar por tipo</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FILTERS.map(f => {
            const active = activeFilters.includes(f.key)
            return (
              <button key={f.key} onClick={() => toggleFilter(f.key)} style={{
                display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                cursor: 'pointer', padding: 0,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: active ? f.color : 'transparent',
                  border: `2px solid ${f.color}`,
                }} />
                <span style={{ fontSize: 12, color: active ? '#f0f0f0' : '#555' }}>{f.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Upcoming appointments */}
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Próximos</div>
        {upcoming.length === 0 ? (
          <div style={{ fontSize: 11, color: '#333', textAlign: 'center', padding: '8px 0' }}>Sem eventos</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map(apt => {
              const color = TYPE_COLORS[apt.type] ?? '#555'
              const label = TYPE_LABELS[apt.type] ?? apt.type
              const aptDate = new Date(apt.start_at)
              const isToday = isSameDay(aptDate, new Date())
              return (
                <div key={apt.id}
                onClick={() => onAppointmentClick?.(apt)}
                style={{
                  padding: '8px 10px', borderRadius: 8,
                  background: `${color}0d`, border: `1px solid ${color}33`,
                  cursor: onAppointmentClick ? 'pointer' : 'default',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (onAppointmentClick) (e.currentTarget as HTMLElement).style.background = `${color}1a` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}0d` }}
              >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color, fontWeight: 600 }}>{label}</span>
                    {isToday && (
                      <span style={{ fontSize: 9, background: '#10b98122', color: '#10b981', borderRadius: 4, padding: '1px 5px', marginLeft: 'auto' }}>Hoje</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#f0f0f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.title}</div>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
                    {format(aptDate, isToday ? 'HH:mm' : "d MMM · HH:mm", { locale: ptBR })}
                    {apt.lead && ` · ${apt.lead.nome.split(' ')[0]}`}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
