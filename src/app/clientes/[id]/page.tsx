import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClienteHeader } from '@/components/cliente/ClienteHeader'
import { ClienteProfile } from '@/components/cliente/ClienteProfile'
import { ClienteDocuments } from '@/components/cliente/ClienteDocuments'
import { ClienteConversation } from '@/components/cliente/ClienteConversation'
import { ClienteAppointments } from '@/components/cliente/ClienteAppointments'
import { ClienteTimeline } from '@/components/cliente/ClienteTimeline'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: lead },
    { data: docs },
    { data: creditAnalysis },
    { data: conversations },
    { data: appointments },
    { data: timeline },
  ] = await Promise.all([
    supabase.from('leads').select('*').eq('id', id).single(),
    supabase.from('documents').select('*').eq('lead_id', id).order('uploaded_at'),
    supabase.from('credit_analyses').select('*').eq('lead_id', id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('conversations').select('*').eq('lead_id', id).order('created_at'),
    supabase.from('appointments').select('*').eq('lead_id', id).order('start_at', { ascending: false }),
    supabase.from('timeline_events').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
  ])

  if (!lead) notFound()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <style>{`
        .client-folder-tabs [data-slot="tabs-list"] {
          width: 100%;
          height: 42px;
          justify-content: flex-start;
          gap: 6px;
          padding: 6px;
          background: #111 !important;
          border-bottom: 1px solid #222;
          border-radius: 0;
        }
        .client-folder-tabs [data-slot="tabs-trigger"] {
          flex: 0 0 auto;
          height: 30px;
          padding: 0 14px;
          border: 1px solid #242424;
          border-radius: 8px;
          background: #161616 !important;
          color: #777 !important;
          box-shadow: none !important;
        }
        .client-folder-tabs [data-slot="tabs-trigger"]:hover {
          color: #f0f0f0 !important;
          border-color: #333;
        }
        .client-folder-tabs [data-slot="tabs-trigger"][data-active] {
          background: #10b98122 !important;
          border-color: #10b98166 !important;
          color: #10b981 !important;
        }
        .client-folder-tabs [data-slot="tabs-content"] {
          background: #111;
          color: #f0f0f0;
        }
      `}</style>
      <ClienteHeader lead={lead} creditAnalysis={creditAnalysis} />

      <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ClienteProfile lead={lead} />
          <ClienteDocuments leadId={id} initialDocs={docs ?? []} />
        </div>

        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
          <Tabs className="client-folder-tabs" defaultValue="conversa" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0 } as React.CSSProperties}>
            <TabsList>
              <TabsTrigger value="conversa">Conversa</TabsTrigger>
              <TabsTrigger value="compromissos">Compromissos</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            <TabsContent value="conversa" style={{ flex: 1, padding: 16, overflow: 'auto' }}>
              <ClienteConversation leadId={id} initial={conversations ?? []} />
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
