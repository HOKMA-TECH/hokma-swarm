'use client'

import { useRouter } from 'next/navigation'

const PERIODS = [
  { value: 'mes_atual', label: 'Mês atual' },
  { value: 'mes_anterior', label: 'Mês anterior' },
  { value: 'trimestre', label: 'Último trimestre' },
  { value: 'semestre', label: 'Último semestre' },
]

export function RelatoriosPeriodFilter({ current }: { current: string }) {
  const router = useRouter()

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => router.push(`/relatorios?periodo=${p.value}`)}
          style={{
            background: current === p.value ? '#10b98122' : 'transparent',
            border: `1px solid ${current === p.value ? '#10b981' : '#333'}`,
            borderRadius: 8, padding: '5px 12px', fontSize: 12,
            color: current === p.value ? '#10b981' : '#666',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
