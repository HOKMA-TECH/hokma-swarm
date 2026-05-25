import { createClient } from '@/lib/supabase/server'
import { ClientesClient } from '@/components/clientes/ClientesClient'

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <ClientesClient initialLeads={leads ?? []} />
    </div>
  )
}
