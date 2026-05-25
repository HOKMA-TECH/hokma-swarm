import { createClient } from '@/lib/supabase/server'
import { AgendaClient } from '@/components/agenda/AgendaClient'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, lead:leads(nome, telefone)')
    .order('start_at')
  const { data: leads } = await supabase
    .from('leads')
    .select('id, nome')
    .not('stage', 'in', '("desistencia","concluido")')
    .order('nome')

  return <AgendaClient initialAppointments={appointments ?? []} leads={leads ?? []} />
}
