'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { format, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TYPE_COLORS: Record<string, string> = { visita: '#10b981', call: '#42a5f5', reuniao: '#ab47bc' }
const TYPE_LABELS: Record<string, string> = { visita: 'Visita', call: 'Ligação', reuniao: 'Reunião' }
const STATUS_COLOR: Record<string, string> = { realizado: '#10b981', cancelado: '#ef5350', pendente: '#ffab40' }

interface Apt {
  id: string
  title: string
  type: string
  start_at: string
  status: string
  lead?: { nome: string } | null
}

interface Props {
  appointments: Apt[]
}

export function AgendaWeekDropdown({ appointments }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Group by calendar day, sorted ascending
  const grouped = appointments.reduce<Record<string, Apt[]>>((acc, apt) => {
    const key = apt.start_at.slice(0, 10)
    ;(acc[key] ??= []).push(apt)
    return acc
  }, {})
  const dayGroups = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, apts]) => ({
      dateKey: key,
      date: new Date(`${key}T12:00:00`),
      apts: [...apts].sort((a, b) => a.start_at.localeCompare(b.start_at)),
    }))

  const total = appointments.length
  const todayCount = appointments.filter(a => isToday(new Date(a.start_at))).length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: open ? '#10b98122' : '#161616',
          border: `1px solid ${open ? '#10b981' : '#2a2a2a'}`,
          borderRadius: 8, padding: '8px 14px',
          fontSize: 12, color: open ? '#10b981' : '#999',
          cursor: 'pointer', transition: 'all 0.15s ease',
        }}
      >
        {/* Calendar icon */}
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Agendamentos da semana
        {total > 0 && (
          <span style={{
            background: '#10b981', color: '#000',
            borderRadius: 10, padding: '1px 7px',
            fontSize: 10, fontWeight: 800, lineHeight: 1.5,
          }}>
            {total}
          </span>
        )}
        <svg
          width={10} height={10} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 360, maxHeight: 500, overflowY: 'auto',
          background: '#111', border: '1px solid #222',
          borderRadius: 12, boxShadow: '0 20px 60px #00000099',
          zIndex: 200,
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #1c1c1c',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, background: '#111', zIndex: 1,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0' }}>Semana atual</span>
            {todayCount > 0 && (
              <span style={{ fontSize: 10, color: '#10b981', fontWeight: 500 }}>
                {todayCount} evento{todayCount !== 1 ? 's' : ''} hoje
              </span>
            )}
          </div>

          {dayGroups.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: 12, color: '#555' }}>Nenhum agendamento esta semana</div>
            </div>
          ) : (
            dayGroups.map(({ dateKey, date, apts }) => {
              const today = isToday(date)
              return (
                <div key={dateKey}>
                  <div style={{
                    padding: '10px 16px 5px',
                    fontSize: 10, fontWeight: 700,
                    color: today ? '#10b981' : '#444',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: today ? '#10b98106' : 'transparent',
                  }}>
                    {today ? '● Hoje' : format(date, 'EEEE, d MMM', { locale: ptBR })}
                  </div>

                  {apts.map((apt, i) => {
                    const typeColor = TYPE_COLORS[apt.type] ?? '#555'
                    const statusColor = STATUS_COLOR[apt.status] ?? '#555'
                    const isLast = i === apts.length - 1
                    return (
                      <Link
                        key={apt.id}
                        href="/agenda"
                        onClick={() => setOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 16px',
                          borderBottom: isLast ? 'none' : '1px solid #161616',
                          textDecoration: 'none',
                          background: 'transparent',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#10b98108')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 3, alignSelf: 'stretch',
                          borderRadius: 2, background: typeColor,
                          flexShrink: 0, minHeight: 32,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 12, color: '#f0f0f0', fontWeight: 500,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {apt.title}
                          </div>
                          <div style={{ fontSize: 10, color: '#555', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span>{format(new Date(apt.start_at), 'HH:mm')}</span>
                            {apt.lead?.nome && (
                              <>
                                <span style={{ color: '#333' }}>·</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                  {apt.lead.nome}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <span style={{
                            fontSize: 9, padding: '2px 7px', borderRadius: 10,
                            background: `${typeColor}22`, color: typeColor, fontWeight: 600,
                          }}>
                            {TYPE_LABELS[apt.type] ?? apt.type}
                          </span>
                          <span style={{ fontSize: 9, color: statusColor }}>
                            {apt.status}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )
            })
          )}

          {/* Footer */}
          <div style={{
            padding: '10px 16px', borderTop: '1px solid #1c1c1c',
            position: 'sticky', bottom: 0, background: '#111',
          }}>
            <Link
              href="/agenda"
              onClick={() => setOpen(false)}
              style={{ fontSize: 11, color: '#10b981', textDecoration: 'none' }}
            >
              Ir para agenda completa →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
