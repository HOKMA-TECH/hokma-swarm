import Link from 'next/link'
import { type Lead, STAGE_CONFIG } from '@/types/database'
import { formatPhone, timeAgo } from '@/lib/utils'

export function RecentLeads({ leads }: { leads: Lead[] }) {
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Leads recentes</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {leads.length === 0 && (
          <p style={{ color: '#555', fontSize: 12 }}>Nenhum lead ainda.</p>
        )}
        {leads.map(lead => {
          const stage = STAGE_CONFIG[lead.stage]
          return (
            <Link
              key={lead.id}
              href={`/clientes/${lead.id}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid #1c1c1c', textDecoration: 'none',
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: '#f0f0f0', fontWeight: 500 }}>{lead.nome}</div>
                <div style={{ fontSize: 11, color: '#555' }}>{formatPhone(lead.telefone)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  background: `${stage.color}22`, color: stage.color,
                }}>
                  {stage.label}
                </span>
                <span style={{ fontSize: 10, color: '#555' }}>{timeAgo(lead.created_at)}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
