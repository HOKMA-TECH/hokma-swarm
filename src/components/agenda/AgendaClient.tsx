'use client'

import { useState } from 'react'
import { AgendaMiniCalendar } from './AgendaMiniCalendar'
import { AgendaWeekView } from './AgendaWeekView'
import { AgendaMonthView } from './AgendaMonthView'
import { AgendaDayView } from './AgendaDayView'
import { NovoEventoDialog } from './NovoEventoDialog'
import type { Appointment } from '@/types/database'

interface Lead { id: string; nome: string }
type View = 'mes' | 'semana' | 'dia'

interface Props {
  initialAppointments: (Appointment & { lead?: { nome: string; telefone: string } })[]
  leads: Lead[]
}

const VIEWS: { id: View; label: string }[] = [
  { id: 'mes', label: 'Mês' },
  { id: 'semana', label: 'Semana' },
  { id: 'dia', label: 'Dia' },
]

export function AgendaClient({ initialAppointments, leads }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [key, setKey] = useState(0)
  const [view, setView] = useState<View>('semana')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{
        height: 60, background: '#111', borderBottom: '1px solid #222',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>Agenda</h1>

        <div style={{
          display: 'flex', background: '#0d0d0d', borderRadius: 8,
          border: '1px solid #222', padding: 2,
        }}>
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                background: view === v.id ? '#10b98122' : 'transparent',
                border: 'none', borderRadius: 6, padding: '4px 14px',
                fontSize: 12, color: view === v.id ? '#10b981' : '#555',
                cursor: 'pointer', fontWeight: view === v.id ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setShowDialog(true)}
          style={{
            background: '#10b981', border: 'none', borderRadius: 8, padding: '7px 14px',
            fontSize: 13, fontWeight: 700, color: '#000', cursor: 'pointer',
          }}
        >
          + Novo Evento
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: 220, background: '#111', borderRight: '1px solid #222',
          padding: 16, overflowY: 'auto', flexShrink: 0,
        }}>
          <AgendaMiniCalendar
            appointments={initialAppointments}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
          />
        </div>

        {view === 'semana' && (
          <AgendaWeekView
            key={key}
            initialAppointments={initialAppointments}
            selectedDate={selectedDate}
            activeFilters={activeFilters}
          />
        )}
        {view === 'mes' && (
          <AgendaMonthView
            key={key}
            initialAppointments={initialAppointments}
            selectedDate={selectedDate}
            activeFilters={activeFilters}
          />
        )}
        {view === 'dia' && (
          <AgendaDayView
            key={key}
            initialAppointments={initialAppointments}
            selectedDate={selectedDate}
            activeFilters={activeFilters}
          />
        )}
      </div>

      {showDialog && (
        <NovoEventoDialog
          leads={leads}
          onClose={() => setShowDialog(false)}
          onCreated={() => { setKey(k => k + 1); setShowDialog(false) }}
        />
      )}
    </div>
  )
}
