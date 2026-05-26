'use client'

import { useState } from 'react'
import { type Lead } from '@/types/database'
import { formatPhone, timeAgo } from '@/lib/utils'
import { Draggable } from '@hello-pangea/dnd'
import { CalendarPlus, FileSearch, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

export type LeadCardAction = 'editar' | 'agendar' | 'analise' | 'excluir'

interface LeadCardProps {
  lead: Lead & { doc_count: number }
  index: number
  onClick: () => void
  onAction: (action: LeadCardAction) => void
}

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  border: 'none',
  borderRadius: 6,
  padding: '8px 10px',
  color: '#d0d0d0',
  fontSize: 12,
  textAlign: 'left',
  cursor: 'pointer',
}

export function LeadCard({ lead, index, onClick, onAction }: LeadCardProps) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  function runAction(event: React.MouseEvent, action: LeadCardAction) {
    event.stopPropagation()
    setMenuOpen(false)
    onAction(action)
  }

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => { setHovered(false); setMenuOpen(false) }}
          style={{
            background: snapshot.isDragging ? '#1c1c1c' : '#161616',
            border: '1px solid #222',
            borderRadius: 10,
            padding: '12px',
            cursor: 'pointer',
            marginBottom: 8,
            boxShadow: snapshot.isDragging ? '0 8px 24px #00000066' : 'none',
            position: 'relative',
            ...provided.draggableProps.style,
          }}
        >
          {(hovered || snapshot.isDragging || menuOpen) && (
            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }}>
              <button
                type="button"
                aria-label={`Ações de ${lead.nome}`}
                title="Ações"
                onClick={(event) => {
                  event.stopPropagation()
                  setMenuOpen(open => !open)
                }}
                onMouseDown={event => event.stopPropagation()}
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#0d0d0d',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  color: '#999',
                  cursor: 'pointer',
                  boxShadow: '0 8px 18px #00000066',
                }}
              >
                <MoreHorizontal size={16} />
              </button>

              {menuOpen && (
                <div
                  onClick={event => event.stopPropagation()}
                  onMouseDown={event => event.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 34,
                    right: 0,
                    width: 150,
                    background: '#0d0d0d',
                    border: '1px solid #2a2a2a',
                    borderRadius: 10,
                    padding: 6,
                    boxShadow: '0 18px 40px #00000099',
                  }}
                >
                  <button type="button" onClick={event => runAction(event, 'editar')} style={menuItemStyle}>
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button type="button" onClick={event => runAction(event, 'agendar')} style={menuItemStyle}>
                    <CalendarPlus size={14} />
                    Agendar
                  </button>
                  <button type="button" onClick={event => runAction(event, 'analise')} style={menuItemStyle}>
                    <FileSearch size={14} />
                    Análise
                  </button>
                  <button
                    type="button"
                    onClick={event => runAction(event, 'excluir')}
                    style={{ ...menuItemStyle, color: '#ef5350' }}
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', marginBottom: 4, paddingRight: 28 }}>
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
