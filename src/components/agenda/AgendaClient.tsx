'use client'

import { useState } from 'react'
import { AgendaMiniCalendar } from './AgendaMiniCalendar'
import { AgendaWeekView } from './AgendaWeekView'
import { NovoEventoDialog } from './NovoEventoDialog'
import type { Appointment } from '@/types/database'

interface Lead { id: string; nome: string }

interface Props {
  initialAppointments: (Appointment & { lead?: { nome: string; telefone: string } })[]
  leads: Lead[]
}

export function AgendaClient({ initialAppointments, leads }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [key, setKey] = useState(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{
        height: 60, background: '#111', borderBottom: '1px solid #222',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>Agenda</h1>
        <button
          onClick={() => setShowDialog(true)}
          style={{
            background: '#00c853', border: 'none', borderRadius: 8, padding: '7px 14px',
            fontSize: 13, fontWeight: 700, color: '#000', cursor: 'pointer',
          }}
        >
          + Novo Evento
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 220, background: '#111', borderRight: '1px solid #222', padding: 16, overflowY: 'auto', flexShrink: 0 }}>
          <AgendaMiniCalendar
            appointments={initialAppointments}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
          />
        </div>

        <AgendaWeekView
          key={key}
          initialAppointments={initialAppointments}
          selectedDate={selectedDate}
          activeFilters={activeFilters}
        />
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
