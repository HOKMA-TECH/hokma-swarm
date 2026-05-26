'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

type Period = 'este_mes' | 'trimestre' | 'semestre' | 'personalizado'

const OPTIONS: { value: Period; label: string }[] = [
  { value: 'este_mes',      label: 'Este Mês'      },
  { value: 'trimestre',     label: 'Trimestre'     },
  { value: 'semestre',      label: 'Semestre'      },
  { value: 'personalizado', label: 'Personalizado' },
]

const inp: React.CSSProperties = {
  background: '#161616', border: '1px solid #2a2a2a', borderRadius: 6,
  padding: '4px 8px', color: '#f0f0f0', fontSize: 12, outline: 'none',
  colorScheme: 'dark',
}

export function PeriodSelector({ basePath = '/dashboard' }: { basePath?: string }) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const period       = (searchParams.get('period') ?? 'este_mes') as Period

  const [showPicker, setShowPicker] = useState(period === 'personalizado')
  const [from, setFrom] = useState(searchParams.get('from') ?? '')
  const [to,   setTo]   = useState(searchParams.get('to')   ?? '')

  function navigate(p: Period, f?: string, t?: string) {
    const qs = new URLSearchParams({ period: p })
    if (p === 'personalizado' && f && t) { qs.set('from', f); qs.set('to', t) }
    router.push(`${basePath}?${qs.toString()}`)
  }

  function handleClick(p: Period) {
    if (p === 'personalizado') { setShowPicker(true); return }
    setShowPicker(false)
    navigate(p)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {OPTIONS.map(opt => {
        const active = period === opt.value || (opt.value === 'personalizado' && showPicker && period !== 'este_mes' && period !== 'trimestre' && period !== 'semestre')
        const isActive = opt.value === period
        return (
          <button
            key={opt.value}
            onClick={() => handleClick(opt.value)}
            style={{
              background:   isActive ? '#10b98122' : 'transparent',
              border:       `1px solid ${isActive ? '#10b98166' : '#2a2a2a'}`,
              borderRadius: 6, padding: '5px 12px', fontSize: 12,
              color:   isActive ? '#10b981' : '#666',
              cursor:  'pointer', whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        )
      })}

      {(showPicker || period === 'personalizado') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inp} />
          <span style={{ color: '#444', fontSize: 12 }}>→</span>
          <input type="date" value={to}   onChange={e => setTo(e.target.value)}   style={inp} />
          <button
            onClick={() => { if (from && to) navigate('personalizado', from, to) }}
            disabled={!from || !to}
            style={{
              background: from && to ? '#10b981' : '#222',
              border: 'none', borderRadius: 6, padding: '5px 12px',
              color: from && to ? '#000' : '#555', fontSize: 12,
              fontWeight: 700, cursor: from && to ? 'pointer' : 'not-allowed',
            }}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
