import { type Appointment } from '@/types/database'
import { formatDate } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = { visita: '🏠 Visita', call: '📞 Call', reuniao: '🤝 Reunião' }
const STATUS_COLORS: Record<string, string> = { pendente: '#ffab40', realizado: '#10b981', cancelado: '#ef5350' }

export function ClienteAppointments({ appointments }: { appointments: Appointment[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {appointments.length === 0 && (
        <p style={{ color: '#555', fontSize: 12 }}>Nenhum compromisso agendado.</p>
      )}
      {appointments.map(apt => (
        <div key={apt.id} style={{
          background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '10px 14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0' }}>
                {TYPE_LABELS[apt.type]} — {apt.title}
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>
                {formatDate(apt.start_at)} {apt.location ? `· ${apt.location}` : ''}
              </div>
            </div>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 20,
              background: `${STATUS_COLORS[apt.status]}22`, color: STATUS_COLORS[apt.status],
            }}>
              {apt.status}
            </span>
          </div>
          {apt.created_by === 'agent' && (
            <div style={{ fontSize: 10, color: '#555', marginTop: 6 }}>Criado pelo agente IA</div>
          )}
        </div>
      ))}
    </div>
  )
}
