'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Lead, type Stage, STAGE_CONFIG, STAGES } from '@/types/database'
import { CreditAnalysisDropdown } from './CreditAnalysisDropdown'
import type { CreditAnalysis } from '@/types/database'

interface Props {
  lead: Lead
  creditAnalysis: CreditAnalysis | null
}

export function ClienteHeader({ lead, creditAnalysis }: Props) {
  const [currentStage, setCurrentStage] = useState<Stage>(lead.stage)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const stage = STAGE_CONFIG[currentStage]

  async function handleStageChange(newStage: Stage) {
    setCurrentStage(newStage)
    await supabase.from('leads').update({ stage: newStage, updated_at: new Date().toISOString() }).eq('id', lead.id)
    router.refresh()
  }

  async function handleDeleteClient() {
    const confirmed = window.confirm(`Excluir a pasta de ${lead.nome}? Essa ação remove o cliente e seus registros vinculados.`)
    if (!confirmed) return

    setDeleting(true)

    const { data: docs } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('lead_id', lead.id)

    const paths = (docs ?? [])
      .map(doc => doc.storage_path)
      .filter(Boolean)

    if (paths.length > 0) {
      await supabase.storage.from('documentos').remove(paths)
    }

    const { error } = await supabase.from('leads').delete().eq('id', lead.id)

    setDeleting(false)
    if (!error) router.push('/pipeline')
  }

  const isApproved = creditAnalysis?.status === 'aprovado' || creditAnalysis?.status === 'condicionado'

  return (
    <div style={{
      background: '#111', borderBottom: '1px solid #222',
      padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <button
        onClick={() => router.push('/pipeline')}
        style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20 }}
      >
        ←
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0' }}>{lead.nome}</h1>
          {isApproved && (
            <span style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700,
              background: '#10b98122', color: '#10b981', border: '1px solid #10b98144',
            }}>
              ✓ Crédito {creditAnalysis?.status === 'aprovado' ? 'Aprovado' : 'Condicionado'}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
          {lead.campaign_source && `Campanha: ${lead.campaign_source} · `}
          {lead.telefone}
        </div>
      </div>

      <select
        value={currentStage}
        onChange={e => handleStageChange(e.target.value as Stage)}
        style={{
          background: `${stage.color}22`, border: `1px solid ${stage.color}`,
          borderRadius: 8, padding: '6px 10px', color: stage.color,
          fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none',
        }}
      >
        {STAGES.map(s => (
          <option key={s} value={s} style={{ background: '#111', color: STAGE_CONFIG[s].color }}>
            {STAGE_CONFIG[s].label}
          </option>
        ))}
      </select>

      <CreditAnalysisDropdown leadId={lead.id} lead={lead} creditAnalysis={creditAnalysis} />

      <button
        type="button"
        onClick={handleDeleteClient}
        disabled={deleting}
        style={{
          background: '#ef535011',
          border: '1px solid #ef535044',
          borderRadius: 8,
          padding: '7px 12px',
          fontSize: 12,
          color: '#ef5350',
          cursor: deleting ? 'not-allowed' : 'pointer',
          opacity: deleting ? 0.6 : 1,
        }}
      >
        {deleting ? 'Excluindo...' : 'Excluir cliente'}
      </button>
    </div>
  )
}
