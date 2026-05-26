import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Webhook } from 'https://esm.sh/svix@1.15.0'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WEBHOOK_SECRET       = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? ''

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
    lower.includes('recusado')  || lower.includes('indeferido')
  ) return 'reprovado'
  return 'condicionado'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const rawBody = await req.text()

  // Verifica assinatura Svix do Resend
  if (WEBHOOK_SECRET) {
    const svixId        = req.headers.get('svix-id') ?? ''
    const svixTimestamp = req.headers.get('svix-timestamp') ?? ''
    const svixSignature = req.headers.get('svix-signature') ?? ''

    if (!svixId || !svixTimestamp || !svixSignature) {
      return json({ error: 'Missing Svix headers' }, 401)
    }

    try {
      const wh = new Webhook(WEBHOOK_SECRET)
      wh.verify(rawBody, {
        'svix-id':        svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      })
    } catch {
      return json({ error: 'Invalid signature' }, 403)
    }
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  // Resend envia { type: 'email.received', data: { subject, text, html, from, attachments, ... } }
  const data = event?.data ?? event
  const subject: string     = data?.subject ?? ''
  const body: string        = data?.text ?? data?.html ?? ''
  const fromEmail: string   = data?.from ?? ''
  const attachments: any[]  = data?.attachments ?? []

  // Extrai o lead_id do assunto ou corpo (formatos: [ref:uuid] ou ID:uuid)
  const match = (subject + ' ' + body).match(
    /(?:\[ref:|ID:)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]?/i
  )
  if (!match) {
    console.log('lead_id não encontrado. Assunto:', subject)
    return json({ error: 'lead_id not found in email' }, 400)
  }

  const lead_id = match[1]

  // Só classifica se o corpo tiver conteúdo; senão marca como 'recebido' (sem inventar resultado)
  const bodyTrimmed = body.trim()
  const status = bodyTrimmed
    ? classifyStatus(subject + ' ' + bodyTrimmed)
    : 'recebido'

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: analysis } = await supabase
    .from('credit_analyses')
    .select('id')
    .eq('lead_id', lead_id)
    .maybeSingle()

  if (!analysis) {
    console.log('credit_analysis não encontrada para lead:', lead_id)
    return json({ error: 'analysis not found' }, 404)
  }

  // Normaliza metadados dos anexos (só nome e tipo, sem conteúdo)
  const attachmentsMeta = attachments
    .filter((a: any) => a.filename)
    .map((a: any) => ({ filename: a.filename, content_type: a.content_type ?? '' }))

  await Promise.all([
    supabase.from('credit_analyses').update({
      status,
      response_subject:     subject || null,
      response_from:        fromEmail || null,
      response_text:        bodyTrimmed ? bodyTrimmed.slice(0, 4000) : null,
      response_attachments: attachmentsMeta.length > 0 ? attachmentsMeta : null,
      responded_at:         new Date().toISOString(),
    }).eq('lead_id', lead_id),

    supabase.from('timeline_events').insert({
      lead_id,
      type:    'credito_respondido',
      payload: { status, from: fromEmail },
    }),
  ])

  return json({ ok: true, lead_id, status })
})
