import Link from 'next/link'

export default function ClienteNotFound() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, height: '100vh' }}>
      <div style={{ fontSize: 32, color: '#555' }}>404</div>
      <div style={{ fontSize: 14, color: '#999' }}>Cliente não encontrado.</div>
      <Link href="/pipeline" style={{ color: '#00c853', fontSize: 13 }}>← Voltar ao Pipeline</Link>
    </div>
  )
}
