export default function ApuracaoRendaPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        height: 60, background: '#111', borderBottom: '1px solid #222',
        display: 'flex', alignItems: 'center', padding: '0 24px',
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>Apuração de Renda</h1>
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: '#00c85311',
          border: '1px solid #00c85333', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 28,
        }}>
          ◎
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#f0f0f0' }}>Em desenvolvimento</div>
        <div style={{ fontSize: 13, color: '#555', textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
          A funcionalidade de Apuração de Renda estará disponível em breve.
          Ela permitirá calcular e comprovar renda para financiamentos.
        </div>
      </div>
    </div>
  )
}
