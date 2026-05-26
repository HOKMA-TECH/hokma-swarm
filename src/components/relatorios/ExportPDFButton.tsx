'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ReportData {
  periodLabel: string
  kpis: { label: string; value: string | number; delta: string; up: boolean; highlight?: boolean }[]
  stageChartData: { stage: string; count: number }[]
  regiaoData: { regiao: string; count: number }[]
  funnelStages: { label: string; count: number; pct: number }[]
  originData: { source: string; count: number }[]
  campaignRows: { src: string; leads: number; fechamentos: number; conv: string; trend: number | null }[]
  desistRows: [string, number][]
  closingData: { date: string; count: number; vgv: number }[]
  closingGranularity: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STAGE_CONF: Record<string, { label: string; color: string }> = {
  pendente:     { label: 'Pendente',     color: '#9ca3af' },
  em_analise:   { label: 'Em Análise',   color: '#42a5f5' },
  aprovado:     { label: 'Aprovado',     color: '#10b981' },
  reprovado:    { label: 'Reprovado',    color: '#ef5350' },
  condicionado: { label: 'Condicionado', color: '#f59e0b' },
  desistencia:  { label: 'Desistência',  color: '#dc2626' },
  contrato:     { label: 'Contrato',     color: '#16a34a' },
  formularios:  { label: 'Formulários',  color: '#a855f7' },
  repasse:      { label: 'Repasse',      color: '#f97316' },
  concluido:    { label: 'Concluído',    color: '#059669' },
}

const CHART_COLORS = ['#a855f7', '#42a5f5', '#f59e0b', '#10b981', '#ef5350', '#06b6d4']
const REGIAO_COLORS = ['#10b981', '#42a5f5', '#a855f7', '#f59e0b', '#ef5350', '#06b6d4']

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fmtVgvFull(v: number): string {
  if (v >= 1_000_000)
    return 'R$ ' + (v / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'M'
  if (v >= 1_000)
    return 'R$ ' + (v / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + 'k'
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function hBar(label: string, count: number, total: number, color: string, labelW = '110px'): string {
  const w = total > 0 ? Math.max((count / total) * 100, count > 0 ? 3 : 0) : 0
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0'
  return `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:9px;">
      <span style="width:${labelW};font-size:12px;color:#374151;text-align:right;flex-shrink:0;
                   overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(label)}">${esc(label)}</span>
      <div style="flex:1;height:22px;background:#f3f4f6;border-radius:4px;overflow:hidden;">
        <div style="width:${w.toFixed(1)}%;height:100%;background:${color};
                    display:flex;align-items:center;padding-left:8px;transition:width 0.3s;">
          ${count > 0 ? `<span style="font-size:11px;font-weight:700;color:white;white-space:nowrap;">${count}</span>` : ''}
        </div>
      </div>
      <span style="width:38px;text-align:right;font-size:11px;color:#9ca3af;flex-shrink:0;">${pct}%</span>
    </div>`
}

function sectionTitle(num: string, title: string, sub = ''): string {
  return `
    <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;
                color:#10b981;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #d1fae5;
                display:flex;align-items:baseline;gap:10px;">
      <span style="color:#d1fae5;font-size:13px;">${esc(num)}</span>
      <span>${esc(title)}</span>
      ${sub ? `<span style="font-weight:400;color:#9ca3af;text-transform:none;letter-spacing:0;font-size:11px;">${esc(sub)}</span>` : ''}
    </div>`
}

// ── Insights generator ────────────────────────────────────────────────────────
function generateInsights(d: ReportData): string {
  const total      = Number(d.kpis.find(k => k.label === 'Leads recebidos')?.value)  || 0
  const fechamentos = Number(d.kpis.find(k => k.label === 'Concluídos')?.value)      || 0
  const vgv        = String(d.kpis.find(k => k.label === 'Fechamento')?.value        || 'R$ 0')
  const taxa       = String(d.kpis.find(k => k.label === 'Taxa de conversão')?.value || '0%')
  const tempMedio  = String(d.kpis.find(k => k.label === 'Tempo médio')?.value       || '—')
  const fechDelta  = d.kpis.find(k => k.label === 'Concluídos')

  const topOrigin  = d.originData[0]
  const topRegiao  = d.regiaoData[0]
  const desistTotal = d.desistRows.reduce((s, [, n]) => s + n, 0)
  const topDesist  = d.desistRows[0]?.[0]

  const atendimento = Number(d.kpis.find(k => k.label === 'Em atendimento')?.value) || 0

  const parts: string[] = []

  parts.push(
    `No período de <strong>${esc(d.periodLabel)}</strong>, a operação recebeu ` +
    `<strong>${total} lead${total !== 1 ? 's' : ''}</strong>${total === 0 ? ', sem novos registros.' : '.'}`
  )

  if (fechamentos > 0) {
    let f = `Foram concluídos <strong>${fechamentos} negócio${fechamentos !== 1 ? 's' : ''}</strong>, ` +
            `totalizando <strong>${esc(vgv)}</strong> em VGV`
    if (fechDelta && fechDelta.delta !== '—')
      f += ` (${esc(fechDelta.delta)} vs. período anterior)`
    parts.push(f + '.')
  } else {
    parts.push('Não foram registrados fechamentos neste período.')
  }

  if (total > 0) {
    let taxaLine = `A taxa de conversão foi de <strong>${esc(taxa)}</strong>`
    if (tempMedio !== '—') taxaLine += `, com tempo médio de fechamento de <strong>${esc(tempMedio)}</strong>`
    parts.push(taxaLine + '.')
  }

  if (atendimento > 0)
    parts.push(`Há <strong>${atendimento} lead${atendimento !== 1 ? 's' : ''}</strong> em atendimento ativo no pipeline.`)

  if (topOrigin && total > 0) {
    const p = ((topOrigin.count / total) * 100).toFixed(0)
    parts.push(`Principal origem: <strong>${esc(topOrigin.source)}</strong> — ${p}% do volume total.`)
  }

  if (topRegiao)
    parts.push(`Região de maior interesse: <strong>${esc(topRegiao.regiao)}</strong> (${topRegiao.count} lead${topRegiao.count !== 1 ? 's' : ''}).`)

  if (desistTotal > 0) {
    let desc = `Registradas <strong>${desistTotal} desistência${desistTotal !== 1 ? 's' : ''}</strong>`
    if (topDesist) desc += ` — motivo mais frequente: <em>"${esc(topDesist)}"</em>`
    parts.push(desc + '.')
  }

  return parts.map(p => `<p style="margin-bottom:8px;line-height:1.75;">${p}</p>`).join('')
}

// ── HTML generator ────────────────────────────────────────────────────────────
function generateReportHTML(data: ReportData): string {
  const now = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  /* ── KPI cards ── */
  const kpiCards = data.kpis.map(k => {
    const hi = !!k.highlight
    const valLen = String(k.value).length
    return `
      <div style="border:${hi ? '2px solid #10b981' : '1px solid #e5e7eb'};border-radius:10px;
                  padding:18px 16px;background:${hi ? 'linear-gradient(135deg,#ecfdf5,#f0fdf4)' : '#fafafa'};
                  ${hi ? 'box-shadow:0 0 18px rgba(16,185,129,0.12);' : ''}">
        <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.14em;
                    color:${hi ? '#047857' : '#9ca3af'};margin-bottom:10px;">${esc(k.label)}</div>
        <div style="font-size:${valLen > 9 ? '18px' : valLen > 6 ? '22px' : '28px'};font-weight:800;
                    color:${hi ? '#10b981' : '#111827'};line-height:1;margin-bottom:8px;">${esc(k.value)}</div>
        <div style="font-size:10px;color:${k.up ? '#10b981' : '#ef5350'};">
          ${k.up ? '▲' : '▼'} ${esc(k.delta)}
        </div>
      </div>`
  }).join('')

  /* ── Stage bars ── */
  const stageTotal = data.stageChartData.reduce((s, d) => s + d.count, 0)
  const stageBars = data.stageChartData.length === 0
    ? '<p style="font-size:12px;color:#9ca3af;padding:8px 0;">Sem dados no período.</p>'
    : data.stageChartData
        .sort((a, b) => b.count - a.count)
        .map(d => {
          const conf = STAGE_CONF[d.stage] ?? { label: d.stage, color: '#9ca3af' }
          return hBar(conf.label, d.count, stageTotal, conf.color)
        }).join('')

  /* ── Funnel bars ── */
  const funnelBars = data.funnelStages.map((s, i) => {
    const opacity = Math.max(0.25, 1 - i * 0.14)
    const color = `rgba(16,185,129,${opacity.toFixed(2)})`
    return hBar(s.label, s.count, data.funnelStages[0]?.count || 1, color, '80px')
  }).join('')

  /* ── Origin bars ── */
  const originTotal = data.originData.reduce((s, d) => s + d.count, 0)
  const originBars = data.originData.length === 0
    ? '<p style="font-size:12px;color:#9ca3af;padding:8px 0;">Sem dados no período.</p>'
    : data.originData.map((d, i) =>
        hBar(d.source || 'Orgânico', d.count, originTotal, CHART_COLORS[i % CHART_COLORS.length])
      ).join('')

  /* ── Região bars ── */
  const regiaoTotal = data.regiaoData.reduce((s, d) => s + d.count, 0)
  const regiaoBars = data.regiaoData.length === 0
    ? '<p style="font-size:12px;color:#9ca3af;padding:8px 0;">Sem dados no período.</p>'
    : data.regiaoData.map((d, i) =>
        hBar(d.regiao, d.count, regiaoTotal, REGIAO_COLORS[i % REGIAO_COLORS.length])
      ).join('')

  /* ── Closing evolution table ── */
  const closingActive = data.closingData.filter(r => r.count > 0 || r.vgv > 0)
  const closingVgvTotal = closingActive.reduce((s, r) => s + r.vgv, 0)
  const closingCountTotal = closingActive.reduce((s, r) => s + r.count, 0)

  const closingTable = closingActive.length === 0
    ? '<p style="font-size:13px;color:#9ca3af;padding:8px 0;">Nenhum fechamento registrado no período.</p>'
    : `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;border-bottom:2px solid #e5e7eb;">Período (${esc(data.closingGranularity)})</th>
            <th style="padding:10px 14px;text-align:center;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;border-bottom:2px solid #e5e7eb;">Pastas</th>
            <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;border-bottom:2px solid #e5e7eb;">VGV</th>
          </tr>
        </thead>
        <tbody>
          ${closingActive.map((r, i) => `
            <tr style="background:${i % 2 === 0 ? 'white' : '#f9fafb'};">
              <td style="padding:9px 14px;color:#374151;border-bottom:1px solid #f3f4f6;">${esc(r.date)}</td>
              <td style="padding:9px 14px;text-align:center;border-bottom:1px solid #f3f4f6;">
                <span style="display:inline-block;background:#d1fae5;color:#065f46;font-weight:800;
                             border-radius:20px;padding:2px 12px;font-size:12px;">${r.count}</span>
              </td>
              <td style="padding:9px 14px;text-align:right;font-weight:600;
                         color:${r.vgv > 0 ? '#065f46' : '#9ca3af'};border-bottom:1px solid #f3f4f6;">
                ${r.vgv > 0 ? esc(fmtVgvFull(r.vgv)) : '—'}
              </td>
            </tr>`).join('')}
        </tbody>
        ${closingCountTotal > 0 ? `
        <tfoot>
          <tr style="background:#f0fdf4;font-weight:700;">
            <td style="padding:10px 14px;font-size:12px;color:#065f46;border-top:2px solid #a7f3d0;">TOTAL</td>
            <td style="padding:10px 14px;text-align:center;font-size:12px;color:#065f46;border-top:2px solid #a7f3d0;">${closingCountTotal}</td>
            <td style="padding:10px 14px;text-align:right;font-size:12px;color:#065f46;border-top:2px solid #a7f3d0;">${closingVgvTotal > 0 ? esc(fmtVgvFull(closingVgvTotal)) : '—'}</td>
          </tr>
        </tfoot>` : ''}
      </table>`

  /* ── Campaign table ── */
  const campaignTable = data.campaignRows.length === 0
    ? '<p style="font-size:13px;color:#9ca3af;padding:8px 0;">Nenhuma campanha no período.</p>'
    : `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;">
            ${['Campanha', 'Leads', 'Fechamentos', 'Conversão', 'Tendência'].map((h, i) =>
              `<th style="padding:10px 14px;text-align:${i === 0 ? 'left' : i === 4 ? 'right' : 'center'};
                          font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;
                          letter-spacing:0.07em;border-bottom:2px solid #e5e7eb;">${h}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.campaignRows.map((row, i) => {
            const conv = parseFloat(row.conv)
            const [convBg, convFg] = conv >= 20
              ? ['#d1fae5', '#065f46'] : conv >= 10
              ? ['#fef3c7', '#92400e']
              : ['#fee2e2', '#991b1b']
            const trendColor = row.trend === null ? '#9ca3af' : row.trend >= 0 ? '#10b981' : '#ef5350'
            const trendStr   = row.trend === null ? '—' : `${row.trend >= 0 ? '▲' : '▼'} ${Math.abs(row.trend).toFixed(0)}%`
            return `
              <tr style="background:${i % 2 === 0 ? 'white' : '#f9fafb'};">
                <td style="padding:9px 14px;color:#374151;font-weight:500;border-bottom:1px solid #f3f4f6;">${esc(row.src)}</td>
                <td style="padding:9px 14px;text-align:center;font-weight:700;color:#374151;border-bottom:1px solid #f3f4f6;">${row.leads}</td>
                <td style="padding:9px 14px;text-align:center;color:#374151;border-bottom:1px solid #f3f4f6;">${row.fechamentos}</td>
                <td style="padding:9px 14px;text-align:center;border-bottom:1px solid #f3f4f6;">
                  <span style="display:inline-block;background:${convBg};color:${convFg};font-weight:800;
                               border-radius:20px;padding:2px 12px;font-size:11px;">${esc(row.conv)}%</span>
                </td>
                <td style="padding:9px 14px;text-align:right;font-size:12px;font-weight:600;
                           color:${trendColor};border-bottom:1px solid #f3f4f6;">${trendStr}</td>
              </tr>`
          }).join('')}
        </tbody>
      </table>`

  /* ── Desistência table ── */
  const desistTotal = data.desistRows.reduce((s, [, n]) => s + n, 0)
  const desistSection = desistTotal === 0 ? '' : `
    <div style="padding:28px 40px;border-bottom:1px solid #f3f4f6;">
      ${sectionTitle('06', 'Motivos de Desistência')}
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;">
            ${['Motivo', 'Qtd.', '% do total'].map((h, i) =>
              `<th style="padding:10px 14px;text-align:${i === 0 ? 'left' : 'right'};
                          font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;
                          letter-spacing:0.07em;border-bottom:2px solid #e5e7eb;">${h}</th>`
            ).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.desistRows.map(([reason, count], i) => `
            <tr style="background:${i % 2 === 0 ? 'white' : '#f9fafb'};">
              <td style="padding:9px 14px;color:#374151;border-bottom:1px solid #f3f4f6;">${esc(reason)}</td>
              <td style="padding:9px 14px;text-align:right;font-weight:700;color:#374151;border-bottom:1px solid #f3f4f6;">${count}</td>
              <td style="padding:9px 14px;text-align:right;color:#6b7280;border-bottom:1px solid #f3f4f6;">
                ${desistTotal > 0 ? ((count / desistTotal) * 100).toFixed(0) + '%' : '—'}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`

  /* ── Full HTML ── */
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Relatório Comercial · HOKMA SWARM · ${esc(data.periodLabel)}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
         color:#111827;background:#dde1e7;padding:28px;line-height:1.5;}
    .page{max-width:840px;margin:0 auto;background:white;border-radius:10px;
          overflow:hidden;box-shadow:0 10px 50px rgba(0,0,0,0.20);}
    .fab{position:fixed;bottom:28px;right:28px;z-index:999;}
    .fab button{background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;
                border-radius:50px;padding:15px 30px;font-size:14px;font-weight:700;
                cursor:pointer;box-shadow:0 6px 24px rgba(16,185,129,0.45);
                display:flex;align-items:center;gap:8px;letter-spacing:0.02em;}
    .fab button:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(16,185,129,0.55);}
    @media print{
      body{background:white;padding:0;}
      .page{box-shadow:none;border-radius:0;max-width:100%;}
      .fab{display:none!important;}
      .pb{page-break-before:always;}
      @page{size:A4;margin:13mm 15mm;}
    }
  </style>
</head>
<body>

<div class="page">

  <!-- ═══ HEADER ═══════════════════════════════════════════════════════════ -->
  <div style="background:linear-gradient(135deg,#052e16 0%,#064e3b 45%,#047857 100%);
              padding:38px 44px 34px;color:white;position:relative;overflow:hidden;">
    <div style="position:absolute;right:-40px;top:-40px;width:220px;height:220px;
                border-radius:50%;background:rgba(255,255,255,0.03);"></div>
    <div style="position:absolute;right:80px;bottom:-50px;width:150px;height:150px;
                border-radius:50%;background:rgba(255,255,255,0.03);"></div>
    <div style="position:absolute;left:0;top:0;bottom:0;width:5px;
                background:linear-gradient(180deg,#6ee7b7,#10b981,#059669);"></div>

    <div style="display:flex;justify-content:space-between;align-items:flex-start;position:relative;padding-left:12px;">
      <div>
        <div style="font-size:10px;font-weight:700;letter-spacing:0.22em;color:#6ee7b7;
                    text-transform:uppercase;margin-bottom:10px;">HOKMA SWARM</div>
        <div style="font-size:30px;font-weight:900;letter-spacing:-0.03em;margin-bottom:6px;">
          Relatório Comercial
        </div>
        <div style="font-size:14px;color:#a7f3d0;font-weight:400;">
          Análise completa de desempenho do período
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;padding-top:4px;">
        <div style="font-size:9px;color:#6ee7b7;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">Período analisado</div>
        <div style="font-size:17px;font-weight:800;background:rgba(255,255,255,0.1);
                    padding:8px 16px;border-radius:8px;border:1px solid rgba(110,231,183,0.3);">
          ${esc(data.periodLabel)}
        </div>
        <div style="font-size:10px;color:#a7f3d0;margin-top:10px;">Gerado em ${esc(now)}</div>
      </div>
    </div>
  </div>

  <!-- ═══ 01 · RESUMO EXECUTIVO ═════════════════════════════════════════════ -->
  <div style="padding:32px 44px;border-bottom:1px solid #f3f4f6;">
    ${sectionTitle('01', 'Resumo Executivo')}

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:26px;">
      ${kpiCards}
    </div>

    <div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);
                border-left:4px solid #10b981;border-radius:0 10px 10px 0;padding:18px 22px;">
      <div style="font-size:10px;font-weight:800;color:#065f46;text-transform:uppercase;
                  letter-spacing:0.12em;margin-bottom:12px;">📊 Análise do Período</div>
      <div style="font-size:13px;color:#374151;">${generateInsights(data)}</div>
    </div>
  </div>

  <!-- ═══ 02 · PIPELINE & FUNIL ══════════════════════════════════════════════ -->
  <div style="padding:32px 44px;border-bottom:1px solid #f3f4f6;">
    ${sectionTitle('02', 'Pipeline & Funil de Conversão')}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:36px;">
      <div>
        <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:14px;
                    display:flex;align-items:center;gap:8px;">
          <span style="width:10px;height:10px;border-radius:2px;background:#10b981;display:inline-block;"></span>
          Pipeline por Stage
          <span style="font-size:11px;font-weight:400;color:#9ca3af;">(leads criados no período)</span>
        </div>
        ${stageBars}
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:14px;
                    display:flex;align-items:center;gap:8px;">
          <span style="width:10px;height:10px;border-radius:2px;background:#10b981;display:inline-block;"></span>
          Funil de Conversão
        </div>
        ${funnelBars}
        <p style="margin-top:12px;font-size:11px;color:#9ca3af;line-height:1.6;">
          O funil mostra como os leads criados no período avançaram nas etapas do processo comercial.
        </p>
      </div>
    </div>
  </div>

  <!-- ═══ 03 · ORIGEM & REGIÃO ═══════════════════════════════════════════════ -->
  <div style="padding:32px 44px;border-bottom:1px solid #f3f4f6;">
    ${sectionTitle('03', 'Origem & Região de Interesse')}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:36px;">
      <div>
        <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:14px;
                    display:flex;align-items:center;gap:8px;">
          <span style="width:10px;height:10px;border-radius:2px;background:#a855f7;display:inline-block;"></span>
          Origem dos Leads
        </div>
        ${originBars}
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:14px;
                    display:flex;align-items:center;gap:8px;">
          <span style="width:10px;height:10px;border-radius:2px;background:#10b981;display:inline-block;"></span>
          Região de Interesse
        </div>
        ${regiaoBars}
      </div>
    </div>
  </div>

  <!-- ═══ 04 · EVOLUÇÃO DE FECHAMENTOS ══════════════════════════════════════ -->
  <div style="padding:32px 44px;border-bottom:1px solid #f3f4f6;">
    ${sectionTitle('04', 'Evolução de Fechamentos', data.closingGranularity)}
    <p style="font-size:12px;color:#6b7280;margin-bottom:16px;line-height:1.6;">
      Fechamentos contabilizados pela data de conclusão da pasta (updated_at),
      independentemente de quando o lead foi cadastrado.
    </p>
    ${closingTable}
  </div>

  <!-- ═══ 05 · PERFORMANCE POR CAMPANHA ═════════════════════════════════════ -->
  <div style="padding:32px 44px;border-bottom:1px solid #f3f4f6;">
    ${sectionTitle('05', 'Performance por Campanha')}
    <p style="font-size:12px;color:#6b7280;margin-bottom:16px;line-height:1.6;">
      Comparativo de leads recebidos, fechamentos e taxa de conversão por campanha de captação.
      Tendência calculada vs. o período imediatamente anterior de mesma duração.
    </p>
    ${campaignTable}
  </div>

  <!-- ═══ 06 · MOTIVOS DE DESISTÊNCIA (condicional) ═════════════════════════ -->
  ${desistSection}

  <!-- ═══ FOOTER ═════════════════════════════════════════════════════════════ -->
  <div style="padding:18px 44px;background:#f9fafb;
              display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
    <div style="font-size:11px;color:#9ca3af;">
      <strong style="color:#6b7280;">HOKMA SWARM</strong> — Sistema de Gestão de Leads Imobiliários
    </div>
    <div style="font-size:11px;color:#9ca3af;">
      Gerado automaticamente · ${esc(now)}
    </div>
  </div>

</div><!-- /page -->

<!-- FAB: Salvar como PDF -->
<div class="fab">
  <button onclick="window.print()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
      <path d="M5 20h14"/>
    </svg>
    Salvar como PDF
  </button>
</div>

</body>
</html>`
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ExportPDFButton({ data }: { data: ReportData }) {
  const [loading, setLoading] = useState(false)

  function handleExport() {
    setLoading(true)
    try {
      const html = generateReportHTML(data)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url  = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 30_000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      style={{
        background: loading ? '#161616' : '#161616',
        border: '1px solid #222',
        borderRadius: 8,
        padding: '7px 14px',
        fontSize: 13,
        color: loading ? '#555' : '#999',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
      onMouseEnter={e => {
        if (loading) return
        const t = e.currentTarget
        t.style.borderColor = '#10b98166'
        t.style.color = '#10b981'
        t.style.background = '#10b98111'
      }}
      onMouseLeave={e => {
        const t = e.currentTarget
        t.style.borderColor = '#222'
        t.style.color = loading ? '#555' : '#999'
        t.style.background = '#161616'
      }}
    >
      {loading ? 'Gerando…' : '↓ Exportar PDF'}
    </button>
  )
}
