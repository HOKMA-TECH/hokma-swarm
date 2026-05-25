export default function DashboardLoading() {
  const skel = (w: string, h: number) => (
    <div style={{ background: '#1c1c1c', borderRadius: 8, width: w, height: h }} />
  )
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 16, height: 90 }}>
            {skel('60%', 12)}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, height: 200 }} />
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, height: 200 }} />
      </div>
    </div>
  )
}
