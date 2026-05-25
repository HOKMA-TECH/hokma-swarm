'use client'

import type { CreditAnalysis } from '@/types/database'

interface Props {
  leadId: string
  creditAnalysis: CreditAnalysis | null
}

export function CreditAnalysisDropdown({ leadId: _leadId, creditAnalysis: _creditAnalysis }: Props) {
  return (
    <button style={{
      background: '#161616', border: '1px solid #222', borderRadius: 8,
      padding: '7px 14px', fontSize: 13, color: '#999', cursor: 'pointer',
    }}>
      Análise de Crédito ▾
    </button>
  )
}
