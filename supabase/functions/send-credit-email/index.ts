import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const CREDIT_ANALYSIS_EMAIL = Deno.env.get('CREDIT_ANALYSIS_EMAIL')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { lead_id } = await req.json()
  if (!lead_id) return new Response(JSON.stringify({ error: 'lead_id required' }), { status: 400 })

  const [{ data: lead }, { data: docs }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', lead_id).single(),
    supabase.from('documents').select('*').eq('lead_id', lead_id),
  ])
  if (!lead) return new Response(JSON.stringify({ error: 'Lead not found' }), { status: 404 })

  const docLinks = await Promise.all(
    (docs ?? []).map(async (doc: any) => {
      const { data } = await supabase.storage
        .from('documentos')
        .createSignedUrl(doc.storage_path, 3600)
      return `- ${doc.name}: ${data?.signedUrl ?? '(link indisponível)'}`
    })
  )

  const emailBody = `
Análise de Crédito — Solicitação

Cliente: ${lead.nome}
Telefone: ${lead.telefone}
Email: ${lead.email ?? 'Não informado'}
CPF: ${lead.cpf ?? 'Não informado'}
Renda Declarada: ${lead.renda ? `R$ ${lead.renda.toLocaleString('pt-BR')}` : 'Não informado'}
Tipo de imóvel desejado: ${lead.tipo_imovel ?? 'Não informado'}
Campanha de origem: ${lead.campaign_source ?? 'Não informado'}

Documentos:
${docLinks.length > 0 ? docLinks.join('\n') : '(nenhum documento enviado)'}

Lead ID (inclua no assunto da resposta): ${lead_id}
  `.trim()

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'hokma-swarm@seudominio.com',
      to: CREDIT_ANALYSIS_EMAIL,
      subject: `Análise de Crédito — ${lead.nome} — ID:${lead_id}`,
      text: emailBody,
    }),
  })

  if (!resendRes.ok) {
    const err = await resendRes.text()
    return new Response(JSON.stringify({ error: err }), { status: 500 })
  }

  await supabase.from('credit_analyses').upsert({
    lead_id,
    status: 'enviado',
    sent_at: new Date().toISOString(),
  }, { onConflict: 'lead_id' })

  await supabase.from('timeline_events').insert({
    lead_id,
    type: 'credito_enviado',
    payload: { email: CREDIT_ANALYSIS_EMAIL },
  })

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
