'use client'

import { useState } from 'react'

const MOTIVOS = [
  'Renda insuficiente',
  'Desistiu após análise',
  'Comprou com outro corretor',
  'Sem contato (perdido)',
  'Outro',
]

interface Props {
  leadName: string
  onConfirm: (motivo: string) => void
  onCancel: () => void
}

export function DesistenciaDialog({ leadName, onConfirm, onCancel }: Props) {
  const [motivo, setMotivo] = useState('')

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#00000088',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#111', border: '1px solid #222', borderRadius: 14,
        padding: 28, width: 380, display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Registrar Desistência</div>
        <div style={{ fontSize: 13, color: '#999' }}>
          Mover <strong style={{ color: '#f0f0f0' }}>{leadName}</strong> para Desistência. Qual o motivo?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MOTIVOS.map(m => (
            <button
              key={m}
              onClick={() => setMotivo(m)}
              style={{
                background: motivo === m ? '#10b98122' : '#161616',
                border: `1px solid ${motivo === m ? '#10b981' : '#222'}`,
                borderRadius: 8, padding: '9px 12px', color: motivo === m ? '#10b981' : '#999',
                fontSize: 13, cursor: 'pointer', textAlign: 'left',
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, background: '#161616', border: '1px solid #222',
              borderRadius: 8, padding: 10, color: '#999', fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => motivo && onConfirm(motivo)}
            disabled={!motivo}
            style={{
              flex: 1, background: motivo ? '#10b981' : '#222', border: 'none',
              borderRadius: 8, padding: 10, color: motivo ? '#000' : '#555',
              fontSize: 13, fontWeight: 700, cursor: motivo ? 'pointer' : 'not-allowed',
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
