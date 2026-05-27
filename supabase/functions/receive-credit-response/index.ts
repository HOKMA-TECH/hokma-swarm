import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Webhook }      from 'https://esm.sh/svix@1.15.0'

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

// Remove a parte citada do email (resposta original do banco aparece no topo, email enviado fica em baixo)
function stripQuotedReply(text: string): string {
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (
      /^<[^>]+>\s+escreveu/i.test(line)   ||  // PT Gmail: "<email> escreveu"
      /^Em .{5,100} escreveu:?$/i.test(line) || // PT Gmail: "Em ... escreveu:"
      /^On .{5,100} wrote:?$/i.test(line)   ||  // EN Gmail: "On ... wrote:"
      /^-{3,}\s*(Original Message|Mensagem original)/i.test(line) ||
      /^_{3,}/.test(line)
    ) {
      return lines.slice(0, i).join('\n').trim()
    }
    // Bloco de citação (linhas começando com >)
    if (line.startsWith('>') && i > 0) {
      return lines.slice(0, i).join('\n').trim()
    }
  }
  return text.trim()
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

  const data               = event?.data ?? event
  const emailId: string    = data?.email_id ?? ''
  const subject: string    = data?.subject ?? ''
  const fromEmail: string  = data?.from ?? ''
  const webhookAtts: any[] = data?.attachments ?? []

  // GET /emails/receiving/{id} — endpoint correto conforme docs do Resend
  let body = ''
  let fullAtts: any[] = []
  if (emailId && RESEND_API_KEY) {
    try {
      const r = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      })
      console.log(`GET /emails/receiving/${emailId} → ${r.status}`)
      if (r.ok) {
        const received = await r.json()
        body     = received?.text ?? received?.html ?? ''
        fullAtts = received?.attachments ?? []
        console.log(`Received: temCorpo=${!!body} len=${body.length} atts=${fullAtts.length}`)
      }
    } catch (e) {
      console.log('Received fetch error:', e)
    }
  }

  // Extrai o lead_id do assunto (ou corpo)
  const match = (subject + ' ' + body).match(
    /(?:\[ref:|ID:)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]?/i
  )
  if (!match) {
    console.log('lead_id não encontrado. Assunto:', subject)
    return json({ error: 'lead_id not found in email' }, 400)
  }

  const lead_id   = match[1]
  const bodyClean = stripQuotedReply(body).replace(/\[image:\s*[^\]]+\]/gi, '').trim()
  const status    = bodyClean ? classifyStatus(subject + ' ' + bodyClean) : 'recebido'

  console.log(`lead_id: ${lead_id} | status: ${status} | bodyLen: ${bodyClean.length}`)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: analysis } = await supabase
    .from('credit_analyses').select('id').eq('lead_id', lead_id).maybeSingle()
  if (!analysis) return json({ error: 'analysis not found' }, 404)

  // Processa anexos: usa os do retrieve (podem ter content) ou do webhook (só metadados)
  const attsSource = fullAtts.length > 0 ? fullAtts : webhookAtts
  const attachmentsMeta: { filename: string; content_type: string; url?: string; inline?: boolean }[] = []

  for (const att of attsSource.filter((a: any) => a.filename)) {
    // Log completo para diagnóstico — omite o content base64 para não poluir
    const debugKeys = Object.keys(att)
    const debugSnap: Record<string, unknown> = {}
    for (const k of debugKeys) {
      debugSnap[k] = k === 'content' ? (att[k] ? `[base64 len=${att[k].length}]` : null) : att[k]
    }
    console.log(`ATT "${att.filename}":`, JSON.stringify(debugSnap))

    const contentType = att.content_type ?? att.mimeType ?? att.mime_type ?? ''
    // Resend usa "content_disposition" (não "disposition")
    const isInline    = att.content_disposition === 'inline' || att.disposition === 'inline'
                     || !!att.content_id || !!att.cid

    const meta: { filename: string; content_type: string; url?: string; inline?: boolean } = {
      filename:     att.filename,
      content_type: contentType,
      ...(isInline ? { inline: true } : {}),
    }

    async function uploadBuf(buf: ArrayBuffer): Promise<string | null> {
      const filePath = `responses/${lead_id}/${Date.now()}_${att.filename}`
      const mimeType = contentType || 'application/octet-stream'
      const blob     = new Blob([buf], { type: mimeType })
      const { error: upErr } = await supabase.storage
        .from('documentos').upload(filePath, blob, { upsert: true, contentType: mimeType })
      if (upErr) { console.log('Upload erro:', JSON.stringify(upErr)); return null }
      // Signed URL válida por 10 anos — funciona para bucket público e privado
      const { data: signed } = await supabase.storage
        .from('documentos').createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10)
      return signed?.signedUrl ?? null
    }

    function b64toBuffer(b64: string): ArrayBuffer {
      const bin = atob(b64)
      const buf = new ArrayBuffer(bin.length)
      const view = new Uint8Array(buf)
      for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i)
      return buf
    }

    const b64 = att.content ?? att.data ?? att.body ?? ''
    if (b64) {
      try {
        const url = await uploadBuf(b64toBuffer(b64))
        if (url) { meta.url = url; console.log(`Anexo salvo (b64): ${att.filename}`) }
      } catch (e) { console.log('Upload exc:', e) }
    } else if (att.id && emailId && RESEND_API_KEY) {
      // Resend não inclui conteúdo no webhook — busca via endpoint individual
      try {
        const attRes = await fetch(
          `https://api.resend.com/emails/receiving/${emailId}/attachments/${att.id}`,
          { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } }
        )
        console.log(`GET attachment/${att.id} → ${attRes.status}`)
        if (attRes.ok) {
          const ct = attRes.headers.get('content-type') ?? ''
          console.log(`Att content-type header: ${ct}`)
          if (ct.includes('application/json')) {
            const d = await attRes.json()
            console.log('Att JSON keys:', JSON.stringify(Object.keys(d ?? {})))
            const c = d?.content ?? d?.data ?? d?.body ?? ''
            if (c) {
              const url = await uploadBuf(b64toBuffer(c))
              if (url) { meta.url = url; console.log(`Anexo salvo (json b64): ${att.filename}`) }
            } else {
              // JSON retornou URL externa — tenta baixar e re-hospedar no Supabase
              const extUrl = d?.url ?? d?.download_url ?? d?.href ?? null
              if (extUrl) {
                console.log(`Tentando baixar URL externa: ${extUrl}`)
                try {
                  const extRes = await fetch(extUrl)
                  if (extRes.ok) {
                    const buf = await extRes.arrayBuffer()
                    if (buf.byteLength > 0) {
                      const url = await uploadBuf(buf)
                      if (url) { meta.url = url; console.log(`Anexo re-hospedado: ${att.filename}`) }
                    }
                  }
                } catch (e) { console.log('Download ext URL err:', e) }
                if (!meta.url) { meta.url = extUrl; console.log(`Usando URL externa direta: ${extUrl}`) }
              }
            }
          } else {
            // Resposta binária direta
            const buf = await attRes.arrayBuffer()
            console.log(`Att binário: ${buf.byteLength} bytes`)
            if (buf.byteLength > 0) {
              const url = await uploadBuf(buf)
              if (url) { meta.url = url; console.log(`Anexo salvo (bin): ${att.filename}`) }
            }
          }
        }
      } catch (e) { console.log('Att endpoint err:', e) }

      if (!meta.url) {
        const externalUrl = att.download_url ?? att.url ?? null
        if (externalUrl) { meta.url = externalUrl; console.log(`Fallback URL direta: ${att.filename}`) }
        else console.log(`Anexo sem conteúdo acessível: ${att.filename}`)
      }
    }

    attachmentsMeta.push(meta)
  }

  await Promise.all([
    supabase.from('credit_analyses').update({
      status,
      response_subject:     subject || null,
      response_from:        fromEmail || null,
      response_text:        bodyClean ? bodyClean.slice(0, 4000) : null,
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
