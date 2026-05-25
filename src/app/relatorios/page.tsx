import { createClient } from '@/lib/supabase/server'
import { RelatorioKpis } from '@/components/relatorios/RelatorioKpis'
import { LeadsLineChart } from '@/components/relatorios/LeadsLineChart'
import { ConversionFunnel } from '@/components/relatorios/ConversionFunnel'
import { OrigemDonut } from '@/components/relatorios/OrigemDonut'
import { PrintButton } from '@/components/relatorios/PrintButton'
import { format, subDays, startOfMonth } from 'date-fns'

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const today = new Date()
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
  const thirtyAgo = subDays(today, 30).toISOString()

  const [{ data: allLeads }, { data: dailyRaw }] = await Promise.all([
    supabase.from('leads').select('stage, campaign_source, created_at').gte('created_at', `${monthStart}T00:00:00`),
    supabase.from('leads').select('created_at').gte('created_at', thirtyAgo),
  ])

  const leads = allLeads ?? []
  const total = leads.length
  const atendimento = leads.filter(l => !['concluido', 'desistencia', 'reprovado'].includes(l.stage)).length
  const fechamentos = leads.filter(l => l.stage === 'concluido').length
  const taxa = total > 0 ? `${(fechamentos / total * 100).toFixed(1)}%` : '0%'

  const dailyCounts = (dailyRaw ?? []).reduce<Record<string, number>>((acc, { created_at }) => {
    const d = format(new Date(created_at), 'dd/MM')
    acc[d] = (acc[d] ?? 0) + 1
    return acc
  }, {})
  const lineData = Array.from({ length: 30 }, (_, i) => {
    const d = format(subDays(today, 29 - i), 'dd/MM')
    return { date: d, count: dailyCounts[d] ?? 0 }
  })

  const analise = leads.filter(l => !['pendente', 'desistencia'].includes(l.stage)).length
  const aprovados = leads.filter(l => ['aprovado', 'condicionado', 'contrato', 'formularios', 'repasse', 'concluido'].includes(l.stage)).length
  const contrato = leads.filter(l => ['contrato', 'formularios', 'repasse', 'concluido'].includes(l.stage)).length
  const funnelStages = [
    { label: 'Leads', count: total, pct: 100 },
    { label: 'Análise', count: analise, pct: total > 0 ? analise / total * 100 : 0 },
    { label: 'Aprovados', count: aprovados, pct: total > 0 ? aprovados / total * 100 : 0 },
    { label: 'Contrato', count: contrato, pct: total > 0 ? contrato / total * 100 : 0 },
    { label: 'Concluído', count: fechamentos, pct: total > 0 ? fechamentos / total * 100 : 0 },
  ]

  const originMap = leads.reduce<Record<string, number>>((acc, l) => {
    const src = l.campaign_source || 'Orgânico'
    acc[src] = (acc[src] ?? 0) + 1
    return acc
  }, {})
  const originData = Object.entries(originMap).map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count).slice(0, 5)

  const kpis = [
    { label: 'Leads recebidos', value: total, delta: '—', up: true },
    { label: 'Em atendimento', value: atendimento, delta: '—', up: true },
    { label: 'Fechamentos', value: fechamentos, delta: '—', up: true },
    { label: 'Taxa de conversão', value: taxa, delta: '—', up: true },
    { label: 'Desistências', value: leads.filter(l => l.stage === 'desistencia').length, delta: '—', up: false },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'auto' }}>
      <div style={{
        height: 60, background: '#111', borderBottom: '1px solid #222',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>Relatórios</h1>
        <PrintButton />
      </div>

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <RelatorioKpis kpis={kpis} />

        <div style={{ display: 'flex', gap: 14 }}>
          <LeadsLineChart data={lineData} />
          <ConversionFunnel stages={funnelStages} />
          <OrigemDonut data={originData} />
        </div>

        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Motivos de desistência</div>
          {(() => {
            const desist = leads.filter(l => l.stage === 'desistencia')
            if (desist.length === 0) return <p style={{ color: '#555', fontSize: 12 }}>Nenhuma desistência no período.</p>
            return (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Campanha', 'Leads', 'Stage'].map(h => (
                      <th key={h} style={{ fontSize: 11, color: '#555', padding: '0 0 10px', textAlign: 'left', borderBottom: '1px solid #222', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {desist.slice(0, 10).map((l, i) => (
                    <tr key={i}>
                      <td style={{ padding: '9px 0', borderBottom: '1px solid #1c1c1c', fontSize: 12, color: '#f0f0f0' }}>{l.campaign_source || '—'}</td>
                      <td style={{ padding: '9px 0', borderBottom: '1px solid #1c1c1c', fontSize: 12, color: '#999' }}>1</td>
                      <td style={{ padding: '9px 0', borderBottom: '1px solid #1c1c1c', fontSize: 12, color: '#ef5350' }}>Desistência</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
