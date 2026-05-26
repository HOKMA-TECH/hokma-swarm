import { createClient } from '@/lib/supabase/server'
import { RelatorioKpis } from '@/components/relatorios/RelatorioKpis'
import { LeadsLineChart } from '@/components/relatorios/LeadsLineChart'
import { ConversionFunnel } from '@/components/relatorios/ConversionFunnel'
import { OrigemDonut } from '@/components/relatorios/OrigemDonut'
import { PrintButton } from '@/components/relatorios/PrintButton'
import { PeriodSelector } from '@/components/dashboard/PeriodSelector'
import {
  format, startOfMonth, subMonths,
  eachDayOfInterval, differenceInDays,
} from 'date-fns'

type PeriodKey = 'este_mes' | 'trimestre' | 'semestre' | 'personalizado'

function getPeriodRange(period: PeriodKey, today: Date, from?: string, to?: string): { from: Date; to: Date } {
  switch (period) {
    case 'trimestre':
      return { from: subMonths(startOfMonth(today), 3), to: today }
    case 'semestre':
      return { from: subMonths(startOfMonth(today), 6), to: today }
    case 'personalizado':
      return {
        from: from ? new Date(from + 'T00:00:00') : new Date(today.getFullYear(), today.getMonth(), 1),
        to:   to   ? new Date(to   + 'T23:59:59') : today,
      }
    default:
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today }
  }
}

function getPrevPeriodRange(current: { from: Date; to: Date }): { from: Date; to: Date } {
  const durationDays = differenceInDays(current.to, current.from) + 1
  const to = new Date(current.from.getTime() - 86400000)
  const from = new Date(to.getTime() - (durationDays - 1) * 86400000)
  return { from, to }
}

function calcDelta(curr: number, prev: number): { delta: string; up: boolean } {
  if (prev === 0) return { delta: '—', up: true }
  const diff = curr - prev
  const pct = (diff / prev) * 100
  return { delta: `${diff >= 0 ? '+' : ''}${pct.toFixed(0)}% vs ant.`, up: diff >= 0 }
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const period = (params.period ?? 'este_mes') as PeriodKey

  const supabase = await createClient()
  const today = new Date()

  const current = getPeriodRange(period, today, params.from, params.to)
  const prev = getPrevPeriodRange(current)

  const [{ data: rawLeads }, { data: rawPrev }, { data: vgvData }, { data: prevVgvData }] = await Promise.all([
    supabase
      .from('leads')
      .select('stage, campaign_source, loss_reason, created_at, updated_at')
      .gte('created_at', current.from.toISOString())
      .lte('created_at', current.to.toISOString()),
    supabase
      .from('leads')
      .select('stage, campaign_source')
      .gte('created_at', prev.from.toISOString())
      .lte('created_at', prev.to.toISOString()),
    supabase
      .from('leads')
      .select('vgv')
      .eq('stage', 'concluido')
      .gte('updated_at', current.from.toISOString())
      .lte('updated_at', current.to.toISOString()),
    supabase
      .from('leads')
      .select('vgv')
      .eq('stage', 'concluido')
      .gte('updated_at', prev.from.toISOString())
      .lte('updated_at', prev.to.toISOString()),
  ])

  const leads = rawLeads ?? []
  const prevLeads = rawPrev ?? []

  // ── KPIs ─────────────────────────────────────────────────────────────
  const total = leads.length
  const prevTotal = prevLeads.length

  const atendimento = leads.filter(l => !['concluido', 'desistencia', 'reprovado'].includes(l.stage)).length
  const prevAtendimento = prevLeads.filter(l => !['concluido', 'desistencia', 'reprovado'].includes(l.stage)).length

  const fechamentos = leads.filter(l => l.stage === 'concluido').length
  const prevFechamentos = prevLeads.filter(l => l.stage === 'concluido').length

  const taxa = total > 0 ? (fechamentos / total) * 100 : 0
  const prevTaxa = prevTotal > 0 ? (prevFechamentos / prevTotal) * 100 : 0

  const closedLeads = leads.filter(l => l.stage === 'concluido' && l.updated_at && l.created_at)
  const avgDays = closedLeads.length > 0
    ? Math.round(closedLeads.reduce((s, l) => s + differenceInDays(new Date(l.updated_at!), new Date(l.created_at)), 0) / closedLeads.length)
    : 0

  // VGV
  const vgvTotal     = (vgvData     ?? []).reduce((s, r: any) => s + (r.vgv ?? 0), 0)
  const prevVgvTotal = (prevVgvData ?? []).reduce((s, r: any) => s + (r.vgv ?? 0), 0)
  const vgvFormatted = vgvTotal >= 1_000_000
    ? 'R$ ' + (vgvTotal / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'M'
    : vgvTotal >= 1_000
    ? 'R$ ' + (vgvTotal / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'k'
    : 'R$ ' + vgvTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const kpis = [
    { label: 'Leads recebidos',  value: total,          ...calcDelta(total,       prevTotal)       },
    { label: 'Em atendimento',   value: atendimento,    ...calcDelta(atendimento, prevAtendimento) },
    { label: 'Concluídos',       value: fechamentos,    ...calcDelta(fechamentos, prevFechamentos) },
    { label: 'Fechamento',       value: vgvFormatted,   ...calcDelta(vgvTotal,    prevVgvTotal), highlight: true },
    { label: 'Taxa de conversão',value: `${taxa.toFixed(1)}%`, ...calcDelta(taxa, prevTaxa) },
    { label: 'Tempo médio',      value: avgDays > 0 ? `${avgDays}d` : '—', delta: '—', up: true },
  ]

  // ── Line chart ───────────────────────────────────────────────────────
  const days = eachDayOfInterval({ start: current.from, end: current.to })
  const dailyCounts = leads.reduce<Record<string, number>>((acc, l) => {
    const d = format(new Date(l.created_at), 'dd/MM')
    acc[d] = (acc[d] ?? 0) + 1
    return acc
  }, {})
  const lineData = days.map(day => ({ date: format(day, 'dd/MM'), count: dailyCounts[format(day, 'dd/MM')] ?? 0 }))

  // ── Funnel ───────────────────────────────────────────────────────────
  const analise = leads.filter(l => !['pendente', 'desistencia'].includes(l.stage)).length
  const aprovados = leads.filter(l => ['aprovado', 'condicionado', 'contrato', 'formularios', 'repasse', 'concluido'].includes(l.stage)).length
  const contrato = leads.filter(l => ['contrato', 'formularios', 'repasse', 'concluido'].includes(l.stage)).length
  const funnelStages = [
    { label: 'Leads', count: total, pct: 100 },
    { label: 'Análise', count: analise, pct: total > 0 ? (analise / total) * 100 : 0 },
    { label: 'Aprovados', count: aprovados, pct: total > 0 ? (aprovados / total) * 100 : 0 },
    { label: 'Contrato', count: contrato, pct: total > 0 ? (contrato / total) * 100 : 0 },
    { label: 'Concluído', count: fechamentos, pct: total > 0 ? (fechamentos / total) * 100 : 0 },
  ]

  // ── Origin donut ─────────────────────────────────────────────────────
  const originMap = leads.reduce<Record<string, number>>((acc, l) => {
    const src = l.campaign_source || 'Orgânico'
    acc[src] = (acc[src] ?? 0) + 1
    return acc
  }, {})
  const originData = Object.entries(originMap)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // ── Campaign performance ─────────────────────────────────────────────
  const prevCampaignCounts = prevLeads.reduce<Record<string, number>>((acc, l) => {
    const src = l.campaign_source || 'Orgânico'
    acc[src] = (acc[src] ?? 0) + 1
    return acc
  }, {})
  const campaignMap = leads.reduce<Record<string, { leads: number; fechamentos: number }>>((acc, l) => {
    const src = l.campaign_source || 'Orgânico'
    if (!acc[src]) acc[src] = { leads: 0, fechamentos: 0 }
    acc[src].leads++
    if (l.stage === 'concluido') acc[src].fechamentos++
    return acc
  }, {})
  const campaignRows = Object.entries(campaignMap)
    .map(([src, data]) => {
      const conv = data.leads > 0 ? ((data.fechamentos / data.leads) * 100).toFixed(1) : '0.0'
      const prevCount = prevCampaignCounts[src] ?? 0
      const trend = prevCount === 0 ? null : ((data.leads - prevCount) / prevCount) * 100
      return { src, ...data, conv, trend }
    })
    .sort((a, b) => b.leads - a.leads)

  // ── Desistência by loss_reason ────────────────────────────────────────
  const desistLeads = leads.filter(l => l.stage === 'desistencia')
  const desistMap = desistLeads.reduce<Record<string, number>>((acc, l) => {
    const r = (l.loss_reason as string | null) || 'Não informado'
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {})
  const desistRows = Object.entries(desistMap).sort((a, b) => b[1] - a[1])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'auto' }}>
      <div style={{
        height: 60, background: '#111', borderBottom: '1px solid #222',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>Relatórios</h1>
        <PeriodSelector basePath="/relatorios" />
        <div style={{ flex: 1 }} />
        <PrintButton />
      </div>

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <RelatorioKpis kpis={kpis} />

        <div style={{ display: 'flex', gap: 14 }}>
          <LeadsLineChart data={lineData} />
          <ConversionFunnel stages={funnelStages} />
          <OrigemDonut data={originData} />
        </div>

        {/* Performance por campanha */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: '#f0f0f0' }}>
            Performance por campanha
          </div>
          {campaignRows.length === 0 ? (
            <p style={{ color: '#555', fontSize: 12 }}>Nenhum dado no período.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Campanha', 'Leads', 'Fechamentos', 'Conversão', 'Tendência'].map(h => (
                    <th key={h} style={{
                      fontSize: 11, color: '#555', padding: '0 12px 10px 0',
                      textAlign: 'left', borderBottom: '1px solid #222',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaignRows.map((row, i) => {
                  const convNum = parseFloat(row.conv)
                  const convColor = convNum >= 20 ? '#10b981' : convNum >= 10 ? '#ffab40' : '#ef5350'
                  const convBg = convNum >= 20 ? '#10b98122' : convNum >= 10 ? '#ffab4022' : '#ef535022'
                  return (
                    <tr key={i}>
                      <td style={{ padding: '9px 12px 9px 0', borderBottom: '1px solid #1c1c1c', fontSize: 12, color: '#f0f0f0' }}>
                        {row.src}
                      </td>
                      <td style={{ padding: '9px 12px 9px 0', borderBottom: '1px solid #1c1c1c', fontSize: 12, color: '#999' }}>
                        {row.leads}
                      </td>
                      <td style={{ padding: '9px 12px 9px 0', borderBottom: '1px solid #1c1c1c', fontSize: 12, color: '#999' }}>
                        {row.fechamentos}
                      </td>
                      <td style={{ padding: '9px 12px 9px 0', borderBottom: '1px solid #1c1c1c' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: convBg, color: convColor,
                        }}>
                          {row.conv}%
                        </span>
                      </td>
                      <td style={{ padding: '9px 0', borderBottom: '1px solid #1c1c1c', fontSize: 11 }}>
                        {row.trend === null ? (
                          <span style={{ color: '#555' }}>—</span>
                        ) : (
                          <span style={{ color: row.trend >= 0 ? '#10b981' : '#ef5350' }}>
                            {row.trend >= 0 ? '▲' : '▼'} {Math.abs(row.trend).toFixed(0)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Motivos de desistência */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: '#f0f0f0' }}>
            Motivos de desistência
          </div>
          {desistRows.length === 0 ? (
            <p style={{ color: '#555', fontSize: 12 }}>Nenhuma desistência no período.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Motivo', 'Qtd.', '% do total'].map(h => (
                    <th key={h} style={{
                      fontSize: 11, color: '#555', padding: '0 12px 10px 0',
                      textAlign: 'left', borderBottom: '1px solid #222',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {desistRows.map(([reason, count], i) => (
                  <tr key={i}>
                    <td style={{ padding: '9px 12px 9px 0', borderBottom: '1px solid #1c1c1c', fontSize: 12, color: '#f0f0f0' }}>
                      {reason}
                    </td>
                    <td style={{ padding: '9px 12px 9px 0', borderBottom: '1px solid #1c1c1c', fontSize: 12, color: '#999' }}>
                      {count}
                    </td>
                    <td style={{ padding: '9px 0', borderBottom: '1px solid #1c1c1c', fontSize: 12, color: '#666' }}>
                      {desistLeads.length > 0 ? `${((count / desistLeads.length) * 100).toFixed(0)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
