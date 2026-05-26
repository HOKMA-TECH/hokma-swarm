'use client'

import { useState } from 'react'

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  delta?: string
  deltaUp?: boolean
  highlight?: boolean
}

export function KpiCard({ label, value, sub, delta, deltaUp, highlight }: KpiCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="anim-fade-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: highlight
          ? 'linear-gradient(135deg, #10b98122 0%, #0d1f1a 50%, #111 100%)'
          : hovered ? 'linear-gradient(135deg, #10b98108, #111)' : '#111',
        border: `1px solid ${highlight ? '#10b981' : hovered ? '#10b98155' : '#222'}`,
        borderRadius: 12, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 8,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: highlight
          ? hovered ? '0 12px 32px #10b98130, 0 0 0 1px #10b98133' : '0 0 20px #10b98122'
          : hovered ? '0 8px 24px #10b98118' : 'none',
        transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'default',
      }}
    >
      <span style={{
        fontSize: 11, color: highlight ? '#6ee7b7' : '#555',
        textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 28, fontWeight: 700,
        color: highlight ? '#10b981' : '#f0f0f0',
        lineHeight: 1,
      }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 11, color: highlight ? '#6ee7b7aa' : '#555', fontWeight: 500 }}>
          {sub}
        </span>
      )}
      {delta && (
        <span style={{ fontSize: 11, color: deltaUp ? '#10b981' : '#ef5350', display: 'flex', alignItems: 'center', gap: 4 }}>
          {deltaUp ? '▲' : '▼'} {delta}
        </span>
      )}
    </div>
  )
}
