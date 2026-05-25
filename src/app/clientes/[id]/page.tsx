import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClienteHeader } from '@/components/cliente/ClienteHeader'
import { ClienteProfile } from '@/components/cliente/ClienteProfile'
import { ClienteDocuments } from '@/components/cliente/ClienteDocuments'

export default async function ClientePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const [{ data: lead }, { data: docs }, { data: creditAnalysis }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', params.id).single(),
    supabase.from('documents').select('*').eq('lead_id', params.id).order('uploaded_at'),
    supabase.from('credit_analyses').select('*').eq('lead_id', params.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (!lead) notFound()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <ClienteHeader lead={lead} creditAnalysis={creditAnalysis} />

      <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ClienteProfile lead={lead} />
          <ClienteDocuments leadId={params.id} initialDocs={docs ?? []} />
        </div>

        <div style={{
          background: '#111', border: '1px solid #222', borderRadius: 12,
          padding: 18, color: '#555', fontSize: 12,
        }}>
          Conversa · Compromissos · Timeline — Task 9
        </div>
      </div>
    </div>
  )
}
