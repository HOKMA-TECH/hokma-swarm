'use client'

import { useState } from 'react'

interface Kpi {
  label: string
  value: string | number
  delta: string
  up: boolean
  highlight?: boolean
}

function KpiItem({ k }: { k: Kpi }) {
  const [hovered, setHovered] = useState(false)
  const highlight = !!k.highlight

  return (
    <div
      className="anim-fade-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        animationDelay: '0ms',
        background: highlight
          ? 'linear-gradient(135deg, #10b98122 0%, #0d1f1a 50%, #111 100%)'
          : hovered ? 'linear-gradient(135deg, #10b98108, #111)' : '#111',
        border: `1px solid ${highlight ? '#10b981' : hovered ? '#10b98155' : '#222'}`,
        borderRadius: 12, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 8,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: highlight
          ? '0 0 24px #10b98122'
          : hovered ? '0 8px 24px #10b98118' : 'none',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'default',
      }}
    >
      <span style={{
        fontSize: 11, color: highlight ? '#6ee7b7' : '#555',
        textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500,
      }}>
        {k.label}
      </span>
      <span style={{ fontSize: 26, fontWeight: 700, color: highlight ? '#10b981' : '#f0f0f0', lineHeight: 1 }}>
        {k.value}
      </span>
      <span style={{ fontSize: 11, color: k.up ? '#10b981' : '#ef5350' }}>
        {k.up ? '▲' : '▼'} {k.delta}
      </span>
    </div>
  )
}

export function RelatorioKpis({ kpis }: { kpis: Kpi[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: 14 }}>
      {kpis.map((k, i) => <KpiItem key={i} k={k} />)}
    </div>
  )
}
