import { type Lead } from '@/types/database'
import { formatPhone, timeAgo } from '@/lib/utils'
import { Draggable } from '@hello-pangea/dnd'

interface LeadCardProps {
  lead: Lead & { doc_count: number }
  index: number
  onClick: () => void
}

export function LeadCard({ lead, index, onClick }: LeadCardProps) {
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={{
            background: snapshot.isDragging ? '#1c1c1c' : '#161616',
            border: '1px solid #222',
            borderRadius: 10,
            padding: '12px',
            cursor: 'pointer',
            marginBottom: 8,
            boxShadow: snapshot.isDragging ? '0 8px 24px #00000066' : 'none',
            ...provided.draggableProps.style,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', marginBottom: 4 }}>
            {lead.nome}
          </div>
          <a
            href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 11, color: '#10b981', marginBottom: 8, display: 'block', textDecoration: 'none' }}
          >
            {formatPhone(lead.telefone)}
          </a>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 20,
              background: lead.doc_count > 0 ? '#10b98122' : '#ffab4022',
              color: lead.doc_count > 0 ? '#10b981' : '#ffab40',
            }}>
              {lead.doc_count > 0 ? `${lead.doc_count} docs` : 'Sem docs'}
            </span>
            <span style={{ fontSize: 10, color: '#555' }}>{timeAgo(lead.created_at)}</span>
          </div>
          {lead.observations && (
            <div style={{
              marginTop: 8, padding: '5px 8px', background: '#ffab4011',
              borderLeft: '2px solid #ffab40', borderRadius: '0 4px 4px 0',
              fontSize: 10, color: '#ffab40',
            }}>
              {lead.observations.slice(0, 60)}{lead.observations.length > 60 ? '…' : ''}
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
