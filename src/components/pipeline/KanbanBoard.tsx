'use client'

import { useState, useCallback } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { KanbanColumn } from './KanbanColumn'
import { DesistenciaDialog } from './DesistenciaDialog'
import { type Lead, type Stage, STAGES, STAGE_CONFIG } from '@/types/database'

interface KanbanBoardProps {
  initialLeads: (Lead & { doc_count: number })[]
}

export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [desistencia, setDesistencia] = useState<{ lead: Lead; targetStage: Stage } | null>(null)
  const [search, setSearch] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const campaigns = Array.from(new Set(leads.map(l => l.campaign_source).filter(Boolean))) as string[]

  const filteredLeads = leads.filter(l => {
    const matchSearch = search === '' ||
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      l.telefone.replace(/\D/g, '').includes(search.replace(/\D/g, ''))
    const matchCampaign = campaignFilter === '' || l.campaign_source === campaignFilter
    return matchSearch && matchCampaign
  })

  const leadsPerStage = (stage: Stage) => filteredLeads.filter(l => l.stage === stage)

  async function moveLeadToStage(leadId: string, newStage: Stage, lossReason?: string) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l))
    await supabase.from('leads').update({
      stage: newStage,
      ...(lossReason ? { loss_reason: lossReason } : {}),
      updated_at: new Date().toISOString(),
    }).eq('id', leadId)
  }

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination || destination.droppableId === source.droppableId) return

    const newStage = destination.droppableId as Stage
    const lead = leads.find(l => l.id === draggableId)!

    if (newStage === 'desistencia') {
      setDesistencia({ lead, targetStage: newStage })
      return
    }

    moveLeadToStage(draggableId, newStage)
  }, [leads])

  return (
    <>
      <div style={{
        display: 'flex', gap: 10, marginBottom: 16,
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
          <svg
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555' }}
            width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: '#111', border: '1px solid #222', borderRadius: 8,
              padding: '7px 10px 7px 32px', fontSize: 12, color: '#f0f0f0', outline: 'none',
            }}
          />
        </div>
        <select
          value={campaignFilter}
          onChange={e => setCampaignFilter(e.target.value)}
          style={{
            background: '#111', border: '1px solid #222', borderRadius: 8,
            padding: '7px 12px', fontSize: 12,
            color: campaignFilter ? '#f0f0f0' : '#555',
            outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">Todas as campanhas</option>
          {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || campaignFilter) && (
          <button
            onClick={() => { setSearch(''); setCampaignFilter('') }}
            style={{
              background: 'none', border: '1px solid #333', borderRadius: 8,
              padding: '7px 12px', fontSize: 12, color: '#555', cursor: 'pointer',
            }}
          >
            Limpar
          </button>
        )}
        <span style={{ fontSize: 11, color: '#555', marginLeft: 'auto' }}>
          {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
        </span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
          {STAGES.map(stage => (
            <KanbanColumn
              key={stage}
              stageId={stage}
              label={STAGE_CONFIG[stage].label}
              color={STAGE_CONFIG[stage].color}
              leads={leadsPerStage(stage)}
              onCardClick={lead => router.push(`/clientes/${lead.id}`)}
            />
          ))}
        </div>
      </DragDropContext>

      {desistencia && (
        <DesistenciaDialog
          leadName={desistencia.lead.nome}
          onConfirm={async (motivo) => {
            await moveLeadToStage(desistencia.lead.id, 'desistencia', motivo)
            setDesistencia(null)
          }}
          onCancel={() => setDesistencia(null)}
        />
      )}
    </>
  )
}
