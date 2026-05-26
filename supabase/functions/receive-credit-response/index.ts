import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Webhook } from 'https://esm.sh/svix@1.15.0'

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const WEBHOOK_SECRET       = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? ''
const RESEND_API_KEY       = Deno.env.get('RESEND_API_KEY') ?? ''

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

  if (WEBHOOK_SECRET) {
    const svixId        = req.headers.get('svix-id') ?? ''
    const svixTimestamp = req.headers.get('svix-timestamp') ?? ''
    const svixSignature = req.headers.get('svix-signature') ?? ''
    if (!svixId || !svixTimestamp || !svixSignature)
      return json({ error: 'Missing Svix headers' }, 401)
    try {
      const wh = new Webhook(WEBHOOK_SECRET)
      wh.verify(rawBody, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': svixSignature })
    } catch {
      return json({ error: 'Invalid signature' }, 403)
    }
  }

  let event: any
  try { event = JSON.parse(rawBody) } catch { return json({ error: 'Invalid JSON' }, 400) }

  console.log('RESEND_KEYS:', JSON.stringify(Object.keys(event?.data ?? {})))
  console.log('RESEND_BODY:', JSON.stringify({
    hasText: !!event?.data?.text, textLen: (event?.data?.text ?? '').length,
    hasHtml: !!event?.data?.html, attachCount: (event?.data?.attachments ?? []).length,
  }))

  const data           = event?.data ?? event
  const subject: string    = data?.subject ?? ''
  const fromEmail: string  = data?.from ?? ''
  const attachments: any[] = data?.attachments ?? []
  const emailId: string    = data?.email_id ?? ''

  // Tenta múltiplos campos onde o Resend pode enviar o corpo
  let body: string =
    data?.text ?? data?.html ?? data?.body ??
    data?.plain_text ?? data?.text_body ?? data?.html_body ?? ''

  // Fallback: tenta buscar corpo via Resend API GET /emails/{id}
  if (!body && emailId && RESEND_API_KEY) {
    try {
      const r = await fetch(`https://api.resend.com/emails/${emailId}`, {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      })
      if (r.ok) {
        const full = await r.json()
        body = full.text ?? full.html ?? ''
        if (body) console.log('Corpo obtido via Resend API')
      }
    } catch { /* segue sem corpo */ }
  }

  // Extrai o lead_id do assunto ou corpo
  const match = (subject + ' ' + body).match(
    /(?:\[ref:|ID:)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]?/i
  )
  if (!match) {
    console.log('lead_id não encontrado. Assunto:', subject)
    return json({ error: 'lead_id not found in email' }, 400)
  }

  const lead_id     = match[1]
  const bodyTrimmed = body.trim()
  const status      = bodyTrimmed ? classifyStatus(subject + ' ' + bodyTrimmed) : 'recebido'

  console.log(`lead_id: ${lead_id} | status: ${status} | temCorpo: ${!!bodyTrimmed}`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: analysis } = await supabase
    .from('credit_analyses').select('id').eq('lead_id', lead_id).maybeSingle()
  if (!analysis) return json({ error: 'analysis not found' }, 404)

  // Processa anexos: se vier com content base64 (inbound custom), faz upload no Storage
  const attachmentsMeta: { filename: string; content_type: string; url?: string }[] = []
  for (const att of attachments.filter((a: any) => a.filename)) {
    const meta: { filename: string; content_type: string; url?: string } = {
      filename:     att.filename,
      content_type: att.content_type ?? '',
    }
    if (att.content) {
      try {
        const filePath = `responses/${lead_id}/${Date.now()}_${att.filename}`
        const bytes    = Uint8Array.from(atob(att.content), (c) => c.charCodeAt(0))
        const blob     = new Blob([bytes], { type: att.content_type ?? 'application/octet-stream' })
        const { error } = await supabase.storage.from('documentos').upload(filePath, blob, { upsert: true })
        if (!error) {
          const { data: urlData } = supabase.storage.from('documentos').getPublicUrl(filePath)
          meta.url = urlData.publicUrl
        }
      } catch { /* ignora erro de upload */ }
    }
    attachmentsMeta.push(meta)
  }

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
