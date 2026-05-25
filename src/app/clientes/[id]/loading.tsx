export default function ClienteLoading() {
  return (
    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, height: 200 }} />
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, height: 300 }} />
      </div>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, height: 500 }} />
    </div>
  )
}
