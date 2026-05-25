'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print-btn"
      style={{
        background: '#161616', border: '1px solid #222', borderRadius: 8,
        padding: '7px 14px', fontSize: 13, color: '#999', cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        const t = e.currentTarget
        t.style.borderColor = '#10b98166'
        t.style.color = '#10b981'
        t.style.background = '#10b98111'
      }}
      onMouseLeave={e => {
        const t = e.currentTarget
        t.style.borderColor = '#222'
        t.style.color = '#999'
        t.style.background = '#161616'
      }}
    >
      ↓ Exportar PDF
    </button>
  )
}
