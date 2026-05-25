import { type TimelineEvent } from '@/types/database'
import { formatDate } from '@/lib/utils'

const EVENT_ICONS: Record<string, string> = {
  lead_criado: '✦',
  stage_mudou: '→',
  doc_enviado: '📎',
  agendamento_criado: '📅',
  credito_enviado: '📧',
  credito_respondido: '✉️',
  observacao_editada: '✏️',
}

const EVENT_LABELS: Record<string, (payload: Record<string, unknown> | null) => string> = {
  lead_criado: () => 'Lead criado',
  stage_mudou: (p) => `Stage: ${p?.de} → ${p?.para}`,
  doc_enviado: (p) => `Documento enviado: ${p?.name}`,
  agendamento_criado: (p) => `Agendamento criado: ${p?.title}`,
  credito_enviado: () => 'Email de análise de crédito enviado',
  credito_respondido: (p) => `Resposta de crédito recebida: ${p?.status}`,
  observacao_editada: () => 'Observação atualizada',
}

export function ClienteTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {events.length === 0 && (
        <p style={{ color: '#555', fontSize: 12 }}>Nenhum evento ainda.</p>
      )}
      {events.map(event => (
        <div key={event.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: '#1c1c1c',
            border: '1px solid #222', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 12, flexShrink: 0,
          }}>
            {EVENT_ICONS[event.type] ?? '·'}
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#f0f0f0' }}>
              {EVENT_LABELS[event.type]?.(event.payload) ?? event.type}
            </div>
            <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>
              {formatDate(event.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
