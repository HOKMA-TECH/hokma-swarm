import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function classifyStatus(text: string): 'aprovado' | 'reprovado' | 'condicionado' {
  const lower = text.toLowerCase()
  if (lower.includes('aprovado') || lower.includes('aprovada')) return 'aprovado'
  if (lower.includes('reprovado') || lower.includes('negado') || lower.includes('recusado')) return 'reprovado'
  if (lower.includes('condicionado') || lower.includes('condicional')) return 'condicionado'
  return 'condicionado'
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const payload = await req.json()
  const subject: string = payload?.subject ?? ''
  const body: string = payload?.text ?? payload?.html ?? ''

  const match = subject.match(/ID:([0-9a-f-]{36})/i)
  if (!match) return new Response(JSON.stringify({ error: 'lead_id not found in subject' }), { status: 400 })
  const lead_id = match[1]

  const status = classifyStatus(subject + ' ' + body)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  await supabase.from('credit_analyses').update({
    status,
    response_text: body.slice(0, 2000),
    responded_at: new Date().toISOString(),
  }).eq('lead_id', lead_id)

  await supabase.from('timeline_events').insert({
    lead_id,
    type: 'credito_respondido',
    payload: { status },
  })

  return new Response(JSON.stringify({ ok: true, status }), { status: 200 })
})
