export default function ClientePage({ params }: { params: { id: string } }) {
  return <div style={{ padding: 24, color: '#f0f0f0' }}>Cliente {params.id} — em breve</div>
}
