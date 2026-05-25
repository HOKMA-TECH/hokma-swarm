import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import type { Lead } from '@/types/database'

export default async function PipelinePage() {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*, documents(count)')
    .order('created_at', { ascending: false })

  const enriched = (leads ?? []).map((lead: any) => ({
    ...lead,
    doc_count: lead.documents?.[0]?.count ?? 0,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{
        height: 60, background: '#111', borderBottom: '1px solid #222',
        display: 'flex', alignItems: 'center', padding: '0 24px', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>Pipeline</h1>
      </div>

      <div style={{ flex: 1, overflowX: 'auto', padding: 24 }}>
        <KanbanBoard initialLeads={enriched as (Lead & { doc_count: number })[]} />
      </div>
    </div>
  )
}
