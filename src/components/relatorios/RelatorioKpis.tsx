interface Kpi {
  label: string
  value: string | number
  delta: string
  up: boolean
}

export function RelatorioKpis({ kpis }: { kpis: Kpi[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{
          background: i === 2 ? 'linear-gradient(135deg, #10b98111, #111)' : '#111',
          border: `1px solid ${i === 2 ? '#10b981' : '#222'}`,
          borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <span style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {k.label}
          </span>
          <span style={{ fontSize: 26, fontWeight: 700, color: i === 2 ? '#10b981' : '#f0f0f0' }}>
            {k.value}
          </span>
          <span style={{ fontSize: 11, color: k.up ? '#10b981' : '#ef5350' }}>
            {k.up ? '▲' : '▼'} {k.delta}
          </span>
        </div>
      ))}
    </div>
  )
}
