import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY         = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL              = Deno.env.get('FROM_EMAIL') ?? 'analise@hokmatech.com'
const REPLY_TO_EMAIL          = Deno.env.get('REPLY_TO_EMAIL') ?? 'analise@ustsimo.resend.app'
const SUPABASE_URL            = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  if (!req.headers.get('Authorization')) return json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { lead_id, to_email, cc, bcc, subject, body } = await req.json()

  if (!lead_id)   return json({ error: 'lead_id required' }, 400)
  if (!to_email)  return json({ error: 'to_email required' }, 400)
  if (!subject)   return json({ error: 'subject required' }, 400)

  // Verifica se o lead existe
  const { data: lead } = await supabase
    .from('leads')
    .select('id, nome')
    .eq('id', lead_id)
    .single()

  if (!lead) return json({ error: 'Lead not found' }, 404)

  // Gera links assinados dos documentos (válidos 7 dias)
  const { data: docs } = await supabase
    .from('documents')
    .select('name, storage_path')
    .eq('lead_id', lead_id)

  const docLinks = await Promise.all(
    (docs ?? []).map(async (doc: any) => {
      const { data } = await supabase.storage
        .from('documentos')
        .createSignedUrl(doc.storage_path, 604800)
      return `- ${doc.name}: ${data?.signedUrl ?? '(link indisponível)'}`
    })
  )

  // Corpo final: texto do frontend + links dos documentos + ID oculto para match de resposta
  const finalBody = [
    body,
    docLinks.length > 0
      ? '\n\nLinks dos documentos (válidos por 7 dias):\n' + docLinks.join('\n')
      : '',
    `\n\n---\nRef: ID:${lead_id}`,
  ].join('')

  // Assunto inclui o ID para identificar a resposta do banco
  const finalSubject = `${subject} | ID:${lead_id}`

  // Monta payload do Resend
  const toList  = to_email.split(',').map((e: string) => e.trim()).filter(Boolean)
  const ccList  = cc  ? cc.split(',').map((e: string) => e.trim()).filter(Boolean)  : undefined
  const bccList = bcc ? bcc.split(',').map((e: string) => e.trim()).filter(Boolean) : undefined

  const resendPayload: Record<string, unknown> = {
    from:     FROM_EMAIL,
    reply_to: REPLY_TO_EMAIL,
    to:       toList,
    subject:  finalSubject,
    text:     finalBody,
  }
  if (ccList?.length)  resendPayload.cc  = ccList
  if (bccList?.length) resendPayload.bcc = bccList

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resendPayload),
  })

  if (!resendRes.ok) {
    const err = await resendRes.text()
    return json({ error: `Resend error: ${err}` }, 500)
  }

  // Registra no banco
  await Promise.all([
    supabase.from('credit_analyses').upsert(
      { lead_id, status: 'enviado', sent_at: new Date().toISOString() },
      { onConflict: 'lead_id' }
    ),
    supabase.from('timeline_events').insert({
      lead_id,
      type: 'credito_enviado',
      payload: { to: to_email },
    }),
  ])

  return json({ ok: true })
})
