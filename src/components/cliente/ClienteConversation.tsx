'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Conversation } from '@/types/database'
import { formatDate } from '@/lib/utils'

export function ClienteConversation({ leadId, initial }: { leadId: string; initial: Conversation[] }) {
  const [messages, setMessages] = useState(initial)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`conversations:${leadId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'conversations',
        filter: `lead_id=eq.${leadId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Conversation])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [leadId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#111' }}>
      <div style={{
        padding: '0 0 12px',
        marginBottom: 12,
        borderBottom: '1px solid #222',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0f0' }}>
          Histórico da conversa
        </div>
        <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>
          {messages.length} mensagem{messages.length !== 1 ? 's' : ''} registrada{messages.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '2px 0 8px' }}>
        {messages.length === 0 && (
          <div style={{
            background: '#161616',
            border: '1px dashed #2a2a2a',
            borderRadius: 10,
            padding: '18px 16px',
            color: '#666',
            fontSize: 12,
            lineHeight: 1.5,
          }}>
            Nenhuma conversa registrada para este cliente ainda.
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{ display: 'flex', justifyContent: msg.role === 'agent' ? 'flex-end' : 'flex-start' }}
          >
            <div style={{
              maxWidth: '82%', padding: '9px 12px', borderRadius: 12,
              background: msg.role === 'agent' ? '#10b98122' : '#1c1c1c',
              border: `1px solid ${msg.role === 'agent' ? '#10b98144' : '#222'}`,
              boxShadow: '0 8px 18px #00000022',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 5,
              }}>
                <span style={{
                  fontSize: 10,
                  color: msg.role === 'agent' ? '#10b981' : '#999',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {msg.role === 'agent' ? 'Agente' : 'Cliente'}
                </span>
                <span style={{ fontSize: 10, color: '#555' }}>
                  {formatDate(msg.created_at, 'dd/MM HH:mm')}
                </span>
              </div>
              {msg.type === 'audio' && (
                <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>🎵 Áudio</div>
              )}
              <div style={{ fontSize: 13, color: '#f0f0f0', lineHeight: 1.4 }}>{msg.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
