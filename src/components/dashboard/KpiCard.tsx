interface KpiCardProps {
  label: string
  value: string | number
  delta?: string
  deltaUp?: boolean
  highlight?: boolean
}

export function KpiCard({ label, value, delta, deltaUp, highlight }: KpiCardProps) {
  return (
    <div style={{
      background: highlight ? 'linear-gradient(135deg, #00c85311, #111)' : '#111',
      border: `1px solid ${highlight ? '#00c853' : '#222'}`,
      borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <span style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontSize: 26, fontWeight: 700, color: highlight ? '#00c853' : '#f0f0f0' }}>
        {value}
      </span>
      {delta && (
        <span style={{ fontSize: 11, color: deltaUp ? '#00c853' : '#ef5350' }}>
          {deltaUp ? '▲' : '▼'} {delta}
        </span>
      )}
    </div>
  )
}
