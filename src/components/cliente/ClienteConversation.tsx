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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
        {messages.length === 0 && (
          <p style={{ color: '#555', fontSize: 12 }}>Nenhuma mensagem ainda.</p>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{ display: 'flex', justifyContent: msg.role === 'agent' ? 'flex-end' : 'flex-start' }}
          >
            <div style={{
              maxWidth: '80%', padding: '8px 12px', borderRadius: 12,
              background: msg.role === 'agent' ? '#10b98122' : '#1c1c1c',
              border: `1px solid ${msg.role === 'agent' ? '#10b98144' : '#222'}`,
            }}>
              {msg.type === 'audio' && (
                <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>🎵 Áudio</div>
              )}
              <div style={{ fontSize: 13, color: '#f0f0f0', lineHeight: 1.4 }}>{msg.content}</div>
              <div style={{ fontSize: 10, color: '#555', marginTop: 4, textAlign: 'right' }}>
                {formatDate(msg.created_at, 'HH:mm')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
