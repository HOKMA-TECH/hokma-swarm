'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AgendaMiniCalendar } from './AgendaMiniCalendar'
import { AgendaWeekView } from './AgendaWeekView'
import { AgendaMonthView } from './AgendaMonthView'
import { AgendaDayView } from './AgendaDayView'
import { AgendaEventDetail } from './AgendaEventDetail'
import { NovoEventoDialog } from './NovoEventoDialog'
import type { Appointment } from '@/types/database'

interface Lead { id: string; nome: string }
type View = 'mes' | 'semana' | 'dia'
type AppointmentWithLead = Appointment & { lead?: { nome: string; telefone: string } }

interface Props {
  initialAppointments: AppointmentWithLead[]
  leads: Lead[]
}

const VIEWS: { id: View; label: string }[] = [
  { id: 'mes', label: 'Mês' },
  { id: 'semana', label: 'Semana' },
  { id: 'dia', label: 'Dia' },
]

export function AgendaClient({ initialAppointments, leads }: Props) {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<AppointmentWithLead[]>(initialAppointments)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [dialogPreset, setDialogPreset] = useState<{ date?: Date; hour?: number } | null>(null)
  const [view, setView] = useState<View>('semana')
  const [sidebarSelected, setSidebarSelected] = useState<AppointmentWithLead | null>(null)

  async function refetch() {
    const { data } = await supabase
      .from('appointments')
      .select('*, lead:leads(nome, telefone)')
      .order('start_at')
    if (data) setAppointments(data as AppointmentWithLead[])
  }

  // Single realtime subscription at the top level — no duplicates in child views
  useEffect(() => {
    const channel = supabase
      .channel('agenda-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, refetch)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function openDialog(date?: Date, hour?: number) { setDialogPreset({ date, hour }) }
  function closeDialog() { setDialogPreset(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        height: 60, background: '#111', borderBottom: '1px solid #222',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>Agenda</h1>

        <div style={{ display: 'flex', background: '#0d0d0d', borderRadius: 8, border: '1px solid #222', padding: 2 }}>
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              background: view === v.id ? '#10b98122' : 'transparent',
              border: 'none', borderRadius: 6, padding: '4px 14px',
              fontSize: 12, color: view === v.id ? '#10b981' : '#555',
              cursor: 'pointer', fontWeight: view === v.id ? 600 : 400,
              transition: 'all 0.15s ease',
            }}>
              {v.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button onClick={() => openDialog()} style={{
          background: '#10b981', border: 'none', borderRadius: 8, padding: '7px 14px',
          fontSize: 13, fontWeight: 700, color: '#000', cursor: 'pointer',
        }}>
          + Novo Evento
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: 220, background: '#111', borderRight: '1px solid #222',
          padding: 16, overflowY: 'auto', flexShrink: 0,
        }}>
          <AgendaMiniCalendar
            appointments={appointments}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            onAppointmentClick={(apt) => setSidebarSelected(apt)}
          />
        </div>

        {/* Calendar views — receive live appointments, call refetch on changes */}
        {view === 'semana' && (
          <AgendaWeekView
            appointments={appointments}
            selectedDate={selectedDate}
            activeFilters={activeFilters}
            onSlotClick={(date, hour) => openDialog(date, hour)}
            onRefresh={refetch}
          />
        )}
        {view === 'mes' && (
          <AgendaMonthView
            appointments={appointments}
            selectedDate={selectedDate}
            activeFilters={activeFilters}
            onSlotClick={(date) => openDialog(date)}
            onRefresh={refetch}
          />
        )}
        {view === 'dia' && (
          <AgendaDayView
            appointments={appointments}
            selectedDate={selectedDate}
            activeFilters={activeFilters}
            onSlotClick={(hour) => openDialog(selectedDate, hour)}
            onRefresh={refetch}
          />
        )}
      </div>

      {/* New event dialog */}
      {dialogPreset !== null && (
        <NovoEventoDialog
          leads={leads}
          initialDate={dialogPreset.date}
          initialHour={dialogPreset.hour}
          onClose={closeDialog}
          onCreated={() => { refetch(); closeDialog() }}
        />
      )}

      {/* Sidebar event detail — fixed panel */}
      {sidebarSelected && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 490 }} onClick={() => setSidebarSelected(null)} />
          <AgendaEventDetail
            appointment={sidebarSelected}
            onClose={() => setSidebarSelected(null)}
            onUpdated={() => { setSidebarSelected(null); refetch() }}
            onDeleted={() => { setSidebarSelected(null); refetch() }}
            containerStyle={{ position: 'fixed', top: 60, right: 0, bottom: 0, width: 300, height: 'auto', zIndex: 500 }}
          />
        </>
      )}
    </div>
  )
}
