import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function classifyStatus(text: string): 'aprovado' | 'reprovado' | 'condicionado' {
  const lower = text.toLowerCase()
  if (lower.includes('aprovado') || lower.includes('aprovada') || lower.includes('aprovação'))
    return 'aprovado'
  if (
    lower.includes('reprovado') || lower.includes('negado') ||
    lower.includes('recusado') || lower.includes('indeferido')
  ) return 'reprovado'
  return 'condicionado'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const subject: string = payload?.subject ?? payload?.data?.subject ?? ''
  const body: string    = payload?.text ?? payload?.data?.text ?? payload?.html ?? payload?.data?.html ?? ''

  // Extrai o lead_id do assunto (formato: ID:uuid)
  const match = (subject + ' ' + body).match(/ID:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  if (!match) {
    console.log('lead_id não encontrado no email. Assunto:', subject)
    return json({ error: 'lead_id not found in email' }, 400)
  }

  const lead_id = match[1]
  const status  = classifyStatus(subject + ' ' + body)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Verifica se existe análise registrada para esse lead
  const { data: analysis } = await supabase
    .from('credit_analyses')
    .select('id')
    .eq('lead_id', lead_id)
    .maybeSingle()

  if (!analysis) {
    console.log('credit_analysis não encontrada para lead:', lead_id)
    return json({ error: 'analysis not found' }, 404)
  }

  await Promise.all([
    supabase.from('credit_analyses').update({
      status,
      response_text: body.slice(0, 4000),
      responded_at: new Date().toISOString(),
    }).eq('lead_id', lead_id),

    supabase.from('timeline_events').insert({
      lead_id,
      type: 'credito_respondido',
      payload: { status, from: payload?.from ?? payload?.data?.from },
    }),
  ])

  return json({ ok: true, lead_id, status })
})
