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
  const router = useRouter()
  const supabase = createClient()

  const leadsPerStage = (stage: Stage) =>
    leads.filter(l => l.stage === stage)

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
          onCancel={() => {
            setDesistencia(null)
          }}
        />
      )}
    </>
  )
}
