import { createClient } from '@/lib/supabase/server'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { LeadsBarChart } from '@/components/dashboard/LeadsBarChart'
import { StageDonut } from '@/components/dashboard/StageDonut'
import { RegiaoDonut } from '@/components/dashboard/RegiaoDonut'
import { RecentLeads } from '@/components/dashboard/RecentLeads'
import { format, subDays } from 'date-fns'
import type { Stage } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const monthStart = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd')
  const thirtyDaysAgo = subDays(today, 30).toISOString()

  const [
    { count: leadsHoje },
    { count: emAtendimento },
    { count: fechamentos },
    { data: stageData },
    { data: dailyRaw },
    { data: recentLeads },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .gte('created_at', `${todayStr}T00:00:00`),
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .not('stage', 'in', '("concluido","desistencia")'),
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('stage', 'concluido').gte('created_at', `${monthStart}T00:00:00`),
    supabase.from('leads').select('stage, tipo_imovel').gte('created_at', thirtyDaysAgo),
    supabase.from('leads').select('created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(6),
  ])

  // Stage donut
  const stageCounts = (stageData ?? []).reduce<Record<string, number>>((acc, { stage }) => {
    acc[stage] = (acc[stage] ?? 0) + 1
    return acc
  }, {})
  const stageChartData = Object.entries(stageCounts).map(([stage, count]) => ({ stage: stage as Stage, count }))

  // Leads per day bar chart
  const dailyCounts = (dailyRaw ?? []).reduce<Record<string, number>>((acc, { created_at }) => {
    const d = format(new Date(created_at), 'dd/MM')
    acc[d] = (acc[d] ?? 0) + 1
    return acc
  }, {})
  const barData = Array.from({ length: 30 }, (_, i) => {
    const d = format(subDays(today, 29 - i), 'dd/MM')
    return { date: d, count: dailyCounts[d] ?? 0 }
  })

  // Região de interesse (tipo_imovel) donut
  const tipoCounts = (stageData ?? []).reduce<Record<string, number>>((acc, { tipo_imovel }: any) => {
    const t = tipo_imovel || 'Não informado'
    acc[t] = (acc[t] ?? 0) + 1
    return acc
  }, {})
  const regiaoData = Object.entries(tipoCounts)
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const totalLeads = stageData?.length ?? 1
  const taxaConversao = totalLeads > 0 ? ((fechamentos ?? 0) / totalLeads * 100).toFixed(1) : '0.0'

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>Dashboard</h1>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard label="Leads Hoje" value={leadsHoje ?? 0} />
        <KpiCard label="Em Atendimento" value={emAtendimento ?? 0} />
        <KpiCard label="Fechamentos (mês)" value={fechamentos ?? 0} highlight />
        <KpiCard label="Taxa de Conversão" value={`${taxaConversao}%`} />
      </div>

      {/* Charts row — 3 equal columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
        <LeadsBarChart data={barData} />
        <StageDonut data={stageChartData} />
        <RegiaoDonut data={regiaoData} />
      </div>

      {/* Recent leads — smaller */}
      <RecentLeads leads={recentLeads ?? []} />
    </div>
  )
}
