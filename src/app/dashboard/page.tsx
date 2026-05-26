import { createClient } from '@/lib/supabase/server'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { LeadsBarChart } from '@/components/dashboard/LeadsBarChart'
import { StageDonut } from '@/components/dashboard/StageDonut'
import { RegiaoDonut } from '@/components/dashboard/RegiaoDonut'
import { RecentLeads } from '@/components/dashboard/RecentLeads'
import { AgendaWeekDropdown } from '@/components/dashboard/AgendaWeekDropdown'
import { NotificationBell } from '@/components/dashboard/NotificationBell'
import { PeriodSelector } from '@/components/dashboard/PeriodSelector'
import {
  format, startOfWeek, endOfWeek,
  subMonths, addDays, addWeeks, addMonths,
} from 'date-fns'
import type { Stage } from '@/types/database'

type Period = 'este_mes' | 'trimestre' | 'semestre' | 'personalizado'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}) {
  const params = await searchParams
  const period = (params.period ?? 'este_mes') as Period

  const supabase = await createClient()
  const today    = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString()
  const weekEnd   = endOfWeek(today, { weekStartsOn: 1 }).toISOString()

  // Calcular range do período selecionado
  let periodStart: Date
  let periodEnd = today

  switch (period) {
    case 'trimestre':
      periodStart = subMonths(today, 3); break
    case 'semestre':
      periodStart = subMonths(today, 6); break
    case 'personalizado':
      periodStart = params.from ? new Date(params.from + 'T00:00:00') : new Date(today.getFullYear(), today.getMonth(), 1)
      periodEnd   = params.to   ? new Date(params.to   + 'T23:59:59') : today
      break
    default:
      periodStart = new Date(today.getFullYear(), today.getMonth(), 1)
  }

  const periodStartISO = periodStart.toISOString()
  const periodEndISO   = periodEnd.toISOString()

  // Label legível do período
  const periodLabels: Record<Period, string> = {
    este_mes:      `${format(periodStart, 'dd/MM')} – ${format(periodEnd, 'dd/MM/yyyy')}`,
    trimestre:     'Últimos 3 meses',
    semestre:      'Últimos 6 meses',
    personalizado: params.from && params.to
      ? `${format(new Date(params.from), 'dd/MM/yy')} → ${format(new Date(params.to), 'dd/MM/yy')}`
      : 'Personalizado',
  }
  const periodLabel = periodLabels[period]

  const [
    { count: emAtendimento },
    { count: concluidos },
    { data: vgvData },
    { data: stageData },
    { data: dailyRaw },
    { data: recentLeads },
    { data: weekAppointments },
  ] = await Promise.all([
    // Em atendimento: estado atual (não muda com período)
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .not('stage', 'in', '("concluido","desistencia","reprovado")'),
    // Concluídos no período
    supabase.from('leads').select('*', { count: 'exact', head: true })
      .eq('stage', 'concluido')
      .gte('updated_at', periodStartISO)
      .lte('updated_at', periodEndISO),
    // VGV dos concluídos no período
    supabase.from('leads').select('vgv')
      .eq('stage', 'concluido')
      .gte('updated_at', periodStartISO)
      .lte('updated_at', periodEndISO),
    // Stage + região para donuts (criados no período)
    supabase.from('leads').select('stage, regiao_interesse')
      .gte('created_at', periodStartISO)
      .lte('created_at', periodEndISO),
    // Criados no período (para o gráfico de barras)
    supabase.from('leads').select('created_at')
      .gte('created_at', periodStartISO)
      .lte('created_at', periodEndISO),
    supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(6),
    supabase.from('appointments')
      .select('id, title, type, start_at, status, lead:leads(nome)')
      .gte('start_at', weekStart).lte('start_at', weekEnd).order('start_at'),
  ])

  // Stage donut
  const stageCounts = (stageData ?? []).reduce<Record<string, number>>((acc, { stage }) => {
    acc[stage] = (acc[stage] ?? 0) + 1; return acc
  }, {})
  const stageChartData = Object.entries(stageCounts).map(([stage, count]) => ({ stage: stage as Stage, count }))

  // Região donut
  const regiaoCounts = (stageData ?? []).reduce<Record<string, number>>((acc, row: any) => {
    const r = row.regiao_interesse || 'Não informado'; acc[r] = (acc[r] ?? 0) + 1; return acc
  }, {})
  const regiaoData = Object.entries(regiaoCounts)
    .map(([regiao, count]) => ({ regiao, count }))
    .sort((a, b) => b.count - a.count).slice(0, 6)

  // Bar chart — granularidade baseada no tamanho do período
  const diffDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) || 1
  let barData: { date: string; count: number }[]
  let granularity: string

  if (diffDays <= 45) {
    // Diário
    granularity = 'por dia'
    const counts = (dailyRaw ?? []).reduce<Record<string, number>>((acc, { created_at }) => {
      const d = format(new Date(created_at), 'dd/MM'); acc[d] = (acc[d] ?? 0) + 1; return acc
    }, {})
    barData = Array.from({ length: diffDays }, (_, i) => {
      const d = format(addDays(periodStart, i), 'dd/MM')
      return { date: d, count: counts[d] ?? 0 }
    })
  } else if (diffDays <= 120) {
    // Semanal
    granularity = 'por semana'
    const counts = (dailyRaw ?? []).reduce<Record<string, number>>((acc, { created_at }) => {
      const k = format(startOfWeek(new Date(created_at), { weekStartsOn: 1 }), 'dd/MM')
      acc[k] = (acc[k] ?? 0) + 1; return acc
    }, {})
    barData = []
    let cursor = startOfWeek(periodStart, { weekStartsOn: 1 })
    while (cursor <= periodEnd) {
      const k = format(cursor, 'dd/MM')
      barData.push({ date: k, count: counts[k] ?? 0 })
      cursor = addWeeks(cursor, 1)
    }
  } else {
    // Mensal
    granularity = 'por mês'
    const counts = (dailyRaw ?? []).reduce<Record<string, number>>((acc, { created_at }) => {
      const k = format(new Date(created_at), 'MM/yy'); acc[k] = (acc[k] ?? 0) + 1; return acc
    }, {})
    barData = []
    let cursor = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1)
    while (cursor <= periodEnd) {
      const k = format(cursor, 'MM/yy')
      barData.push({ date: k, count: counts[k] ?? 0 })
      cursor = addMonths(cursor, 1)
    }
  }

  // VGV formatado
  const vgvTotal = (vgvData ?? []).reduce((sum, row: any) => sum + (row.vgv ?? 0), 0)
  const vgvFormatted = vgvTotal >= 1_000_000
    ? 'R$ ' + (vgvTotal / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'M'
    : vgvTotal >= 1_000
    ? 'R$ ' + (vgvTotal / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'k'
    : 'R$ ' + vgvTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, flexShrink: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <PeriodSelector />
          <AgendaWeekDropdown appointments={(weekAppointments ?? []) as any} />
          <NotificationBell />
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard label="Leads" value={(dailyRaw ?? []).length} sub={periodLabel} />
        <KpiCard label="Em Atendimento" value={emAtendimento ?? 0} />
        <KpiCard label="Concluídos" value={concluidos ?? 0} sub={periodLabel} />
        <KpiCard label="Fechamento" value={vgvFormatted} sub={`${concluidos ?? 0} pasta${(concluidos ?? 0) !== 1 ? 's' : ''} • ${periodLabel}`} highlight />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
        <LeadsBarChart data={barData} periodLabel={periodLabel} granularity={granularity} />
        <StageDonut data={stageChartData} />
        <RegiaoDonut data={regiaoData} />
      </div>

      {/* Recent leads */}
      <RecentLeads leads={recentLeads ?? []} />
    </div>
  )
}
