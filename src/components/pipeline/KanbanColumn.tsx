import { Droppable } from '@hello-pangea/dnd'
import { LeadCard, type LeadCardAction } from './LeadCard'
import type { Lead } from '@/types/database'

interface KanbanColumnProps {
  stageId: string
  label: string
  color: string
  leads: (Lead & { doc_count: number })[]
  onCardClick: (lead: Lead) => void
  onCardAction: (lead: Lead & { doc_count: number }, action: LeadCardAction) => void
}

export function KanbanColumn({ stageId, label, color, leads, onCardClick, onCardAction }: KanbanColumnProps) {
  return (
    <div style={{
      background: '#111', border: '1px solid #222', borderRadius: 12,
      width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '12px 14px', borderBottom: '1px solid #222',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0' }}>{label}</span>
        </div>
        <span style={{
          fontSize: 10, padding: '2px 6px', borderRadius: 20,
          background: `${color}22`, color,
        }}>
          {leads.length}
        </span>
      </div>

      <Droppable droppableId={stageId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1, padding: '10px 10px 4px',
              background: snapshot.isDraggingOver ? '#161616' : 'transparent',
              minHeight: 80, transition: 'background 0.15s',
            }}
          >
            {leads.map((lead, index) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                index={index}
                onClick={() => onCardClick(lead)}
                onAction={(action) => onCardAction(lead, action)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
