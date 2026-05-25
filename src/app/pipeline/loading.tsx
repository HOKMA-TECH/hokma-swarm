export default function PipelineLoading() {
  return (
    <div style={{ padding: 24, display: 'flex', gap: 12, overflowX: 'hidden' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ width: 220, height: 400, background: '#111', border: '1px solid #222', borderRadius: 12, flexShrink: 0 }} />
      ))}
    </div>
  )
}
