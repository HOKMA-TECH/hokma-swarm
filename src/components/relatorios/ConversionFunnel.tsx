interface Stage { label: string; count: number; pct: number }

export function ConversionFunnel({ stages }: { stages: Stage[] }) {
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20, flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Funil de conversão</div>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 16 }}>Período selecionado</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stages.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#999', width: 72, textAlign: 'right', flexShrink: 0 }}>{s.label}</span>
            <div style={{ flex: 1, height: 22, background: '#161616', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${s.pct}%`, height: '100%',
                background: `rgba(0,200,83,${0.1 + (1 - i * 0.15)})`,
                borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8,
                fontSize: 11, fontWeight: 600, color: '#10b981', minWidth: 30,
              }}>
                {s.count}
              </div>
            </div>
            <span style={{ fontSize: 10, color: '#555', width: 34, textAlign: 'right', flexShrink: 0 }}>{s.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
