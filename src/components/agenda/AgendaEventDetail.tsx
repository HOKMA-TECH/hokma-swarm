import type { Appointment } from '@/types/database'
import { formatDate } from '@/lib/utils'

const TYPE_COLORS: Record<string, string> = { visita: '#10b981', call: '#42a5f5', reuniao: '#ab47bc' }
const TYPE_LABELS: Record<string, string> = { visita: '🏠 Visita', call: '📞 Call', reuniao: '🤝 Reunião' }

interface Props {
  appointment: Appointment & { lead?: { nome: string; telefone: string } }
  onClose: () => void
}

export function AgendaEventDetail({ appointment: apt, onClose }: Props) {
  const color = TYPE_COLORS[apt.type] ?? '#555'

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, width: 280, height: '100%',
      background: '#111', borderLeft: '1px solid #222', padding: 20,
      display: 'flex', flexDirection: 'column', gap: 16, zIndex: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${color}22`, color, fontWeight: 600 }}>
          {TYPE_LABELS[apt.type]}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0' }}>{apt.title}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>CLIENTE</div>
          <div style={{ fontSize: 13, color: '#f0f0f0' }}>{apt.lead?.nome ?? '—'}</div>
          {apt.lead?.telefone && <div style={{ fontSize: 11, color: '#999' }}>{apt.lead.telefone}</div>}
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>DATA E HORA</div>
          <div style={{ fontSize: 13, color: '#f0f0f0' }}>{formatDate(apt.start_at)}</div>
          <div style={{ fontSize: 11, color: '#999' }}>até {formatDate(apt.end_at, 'HH:mm')}</div>
        </div>
        {apt.location && (
          <div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>LOCAL</div>
            <div style={{ fontSize: 13, color: '#f0f0f0' }}>{apt.location}</div>
          </div>
        )}
        {apt.notes && (
          <div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>OBSERVAÇÃO</div>
            <div style={{ fontSize: 12, color: '#999', lineHeight: 1.5 }}>{apt.notes}</div>
          </div>
        )}
        {apt.created_by === 'agent' && (
          <div style={{ fontSize: 11, padding: '5px 10px', background: '#4a148c22', border: '1px solid #4a148c44', borderRadius: 8, color: '#ce93d8' }}>
            Criado pelo agente IA
          </div>
        )}
      </div>
    </div>
  )
}
