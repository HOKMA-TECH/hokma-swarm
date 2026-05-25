'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Lead } from '@/types/database'
import { formatCurrency } from '@/lib/utils'

export function ClienteProfile({ lead }: { lead: Lead }) {
  const [obs, setObs] = useState(lead.observations ?? '')
  const supabase = createClient()

  async function saveObs() {
    await supabase.from('leads').update({ observations: obs, updated_at: new Date().toISOString() }).eq('id', lead.id)
  }

  const field = (label: string, value: string | null) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 13, color: value ? '#f0f0f0' : '#555' }}>{value ?? '—'}</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Dados do cliente</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {field('Email', lead.email)}
          {field('Telefone', lead.telefone)}
          {field('CPF', lead.cpf)}
          {field('Renda declarada', lead.renda ? formatCurrency(lead.renda) : null)}
          {field('Tipo de imóvel', lead.tipo_imovel)}
          {field('Stage atual', lead.stage)}
        </div>
      </div>

      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Observações</div>
        <textarea
          value={obs}
          onChange={e => setObs(e.target.value)}
          onBlur={saveObs}
          placeholder="Adicione uma observação..."
          rows={4}
          style={{
            width: '100%', background: '#161616', border: '1px solid #222',
            borderRadius: 8, padding: '10px 12px', color: '#f0f0f0',
            fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>
    </div>
  )
}
