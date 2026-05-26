import { createClient } from '@/lib/supabase/server'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { LeadsBarChart } from '@/components/dashboard/LeadsBarChart'
import { StageDonut } from '@/components/dashboard/StageDonut'
import { RegiaoDonut } from '@/components/dashboard/RegiaoDonut'
import { RecentLeads } from '@/components/dashboard/RecentLeads'
import { AgendaWeekDropdown } from '@/components/dashboard/AgendaWeekDropdown'
import { NotificationBell } from '@/components/dashboard/NotificationBell'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import type { Stage } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const monthStart = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd')
  const thirtyDaysAgo = subDays(today, 30).toISOString()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString()
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }).toISOString()

  const [
    { count: leadsHoje },
    { count: emAtendimento },
    { count: concluidos },
    { data: vgvData },
    { data: stageData },
    { data: dailyRaw },
    { data: recentLeads },
    { data: weekAppointments },
  ] = await Promise.all([
    // Leads criados hoje
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .gte('created_at', `${todayStr}T00:00:00`),
    // Em atendimento: todos exceto concluido e desistencia
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .not('stage', 'in', '("concluido","desistencia")'),
    // Concluídos no mês: pastas que estão em concluido com updated_at neste mês
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('stage', 'concluido').gte('updated_at', `${monthStart}T00:00:00`),
    // VGV total dos concluídos do mês
    supabase.from('leads').select('vgv')
      .eq('stage', 'concluido').gte('updated_at', `${monthStart}T00:00:00`),
    // Dados para gráficos (stage + regiao_interesse dos últimos 30 dias)
    supabase.from('leads').select('stage, regiao_interesse').gte('created_at', thirtyDaysAgo),
    supabase.from('leads').select('created_at').gte('created_at', thirtyDaysAgo),
    supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(6),
    supabase.from('appointments')
      .select('id, title, type, start_at, status, lead:leads(nome)')
      .gte('start_at', weekStart)
      .lte('start_at', weekEnd)
      .order('start_at'),
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

  // Região de interesse donut — usa o campo regiao_interesse
  const regiaoCounts = (stageData ?? []).reduce<Record<string, number>>((acc, row: any) => {
    const r = row.regiao_interesse || 'Não informado'
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {})
  const regiaoData = Object.entries(regiaoCounts)
    .map(([regiao, count]) => ({ regiao, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  // VGV total dos concluídos do mês
  const vgvTotal = (vgvData ?? []).reduce((sum, row: any) => sum + (row.vgv ?? 0), 0)
  const vgvFormatted = vgvTotal >= 1_000_000
    ? 'R$ ' + (vgvTotal / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'M'
    : vgvTotal >= 1_000
    ? 'R$ ' + (vgvTotal / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'k'
    : 'R$ ' + vgvTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 40 }}>
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AgendaWeekDropdown appointments={(weekAppointments ?? []) as any} />
          <NotificationBell />
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard label="Leads" value={leadsHoje ?? 0} sub="hoje" />
        <KpiCard label="Em Atendimento" value={emAtendimento ?? 0} />
        <KpiCard label="Concluídos" value={concluidos ?? 0} sub="este mês" />
        <KpiCard label="Fechamento" value={vgvFormatted} sub={`${concluidos ?? 0} pasta${(concluidos ?? 0) !== 1 ? 's' : ''}`} highlight />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
        <LeadsBarChart data={barData} />
        <StageDonut data={stageChartData} />
        <RegiaoDonut data={regiaoData} />
      </div>

      {/* Recent leads */}
      <RecentLeads leads={recentLeads ?? []} />
    </div>
  )
}
