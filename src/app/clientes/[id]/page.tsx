import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClienteHeader } from '@/components/cliente/ClienteHeader'
import { ClienteProfile } from '@/components/cliente/ClienteProfile'
import { ClienteDocuments } from '@/components/cliente/ClienteDocuments'
import { ClienteConversation } from '@/components/cliente/ClienteConversation'
import { ClienteAppointments } from '@/components/cliente/ClienteAppointments'
import { ClienteTimeline } from '@/components/cliente/ClienteTimeline'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ClientePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const [
    { data: lead },
    { data: docs },
    { data: creditAnalysis },
    { data: conversations },
    { data: appointments },
    { data: timeline },
  ] = await Promise.all([
    supabase.from('leads').select('*').eq('id', params.id).single(),
    supabase.from('documents').select('*').eq('lead_id', params.id).order('uploaded_at'),
    supabase.from('credit_analyses').select('*').eq('lead_id', params.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('conversations').select('*').eq('lead_id', params.id).order('created_at'),
    supabase.from('appointments').select('*').eq('lead_id', params.id).order('start_at', { ascending: false }),
    supabase.from('timeline_events').select('*').eq('lead_id', params.id).order('created_at', { ascending: false }),
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

        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
          <Tabs defaultValue="conversa" style={{ height: '100%', display: 'flex', flexDirection: 'column' } as React.CSSProperties}>
            <TabsList style={{ background: '#161616', borderRadius: 0, borderBottom: '1px solid #222' }}>
              <TabsTrigger value="conversa">Conversa</TabsTrigger>
              <TabsTrigger value="compromissos">Compromissos</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            <TabsContent value="conversa" style={{ flex: 1, padding: 16, overflow: 'auto' }}>
              <ClienteConversation leadId={params.id} initial={conversations ?? []} />
            </TabsContent>
            <TabsContent value="compromissos" style={{ padding: 16, overflow: 'auto' }}>
              <ClienteAppointments appointments={appointments ?? []} />
            </TabsContent>
            <TabsContent value="timeline" style={{ padding: 16, overflow: 'auto' }}>
              <ClienteTimeline events={timeline ?? []} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
