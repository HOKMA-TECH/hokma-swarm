'use client'

import Link from 'next/link'
import { useState } from 'react'
import { type Lead, STAGE_CONFIG } from '@/types/database'
import { formatPhone, timeAgo } from '@/lib/utils'

function LeadRow({ lead }: { lead: Lead }) {
  const [hovered, setHovered] = useState(false)
  const stage = STAGE_CONFIG[lead.stage]

  return (
    <Link
      href={`/clientes/${lead.id}`}
      className="anim-fade-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', marginLeft: -12, marginRight: -12,
        borderBottom: '1px solid #1c1c1c', textDecoration: 'none',
        borderRadius: 8,
        background: hovered ? '#10b98108' : 'transparent',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: `${stage.color}22`, border: `1px solid ${stage.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: stage.color,
          flexShrink: 0,
        }}>
          {lead.nome.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 13, color: '#f0f0f0', fontWeight: 500 }}>{lead.nome}</div>
          <div style={{ fontSize: 11, color: '#555' }}>{formatPhone(lead.telefone)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          background: `${stage.color}22`, color: stage.color,
          border: `1px solid ${stage.color}33`,
        }}>
          {stage.label}
        </span>
        <span style={{ fontSize: 10, color: '#555' }}>{timeAgo(lead.created_at)}</span>
      </div>
    </Link>
  )
}

export function RecentLeads({ leads }: { leads: Lead[] }) {
  return (
    <div
      className="card-hover anim-fade-up"
      style={{
        background: '#111', border: '1px solid #222',
        borderRadius: 12, padding: '16px 20px',
        animationDelay: '200ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>Leads recentes</div>
        <Link href="/pipeline" style={{ fontSize: 11, color: '#10b981', textDecoration: 'none' }}>
          Ver todos →
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {leads.length === 0 && (
          <p style={{ color: '#555', fontSize: 12, padding: '8px 0' }}>Nenhum lead ainda.</p>
        )}
        {leads.map(lead => <LeadRow key={lead.id} lead={lead} />)}
      </div>
    </div>
  )
}
