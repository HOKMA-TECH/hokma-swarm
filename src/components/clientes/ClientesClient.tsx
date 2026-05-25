'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type Lead, STAGE_CONFIG } from '@/types/database'
import { formatPhone, timeAgo } from '@/lib/utils'
import { NovoClienteDialog } from './NovoClienteDialog'

interface Props {
  initialLeads: Lead[]
}

function LeadRow({ lead }: { lead: Lead }) {
  const [hovered, setHovered] = useState(false)
  const stage = STAGE_CONFIG[lead.stage]

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? '#10b98106' : 'transparent', transition: 'background 0.12s' }}
    >
      <td style={{ padding: '11px 16px', borderBottom: '1px solid #1c1c1c' }}>
        <Link
          href={`/clientes/${lead.id}`}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: `${stage.color}22`, border: `1px solid ${stage.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: stage.color,
          }}>
            {lead.nome.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 13, color: '#f0f0f0', fontWeight: 500 }}>{lead.nome}</span>
        </Link>
      </td>
      <td style={{ padding: '11px 16px', borderBottom: '1px solid #1c1c1c' }}>
        <a
          href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{ fontSize: 12, color: '#10b981', textDecoration: 'none' }}
        >
          {formatPhone(lead.telefone)}
        </a>
      </td>
      <td style={{ padding: '11px 16px', borderBottom: '1px solid #1c1c1c', fontSize: 12, color: '#555' }}>
        {lead.email ?? '—'}
      </td>
      <td style={{ padding: '11px 16px', borderBottom: '1px solid #1c1c1c' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
          background: `${stage.color}22`, color: stage.color,
          border: `1px solid ${stage.color}33`,
        }}>
          {stage.label}
        </span>
      </td>
      <td style={{ padding: '11px 16px', borderBottom: '1px solid #1c1c1c', fontSize: 12, color: '#555' }}>
        {lead.campaign_source ?? '—'}
      </td>
      <td style={{ padding: '11px 16px', borderBottom: '1px solid #1c1c1c', fontSize: 11, color: '#444' }}>
        {timeAgo(lead.created_at)}
      </td>
    </tr>
  )
}

export function ClientesClient({ initialLeads }: Props) {
  const [showDialog, setShowDialog] = useState(false)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')

  const filtered = initialLeads.filter(l => {
    const matchSearch = !search ||
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      l.telefone.replace(/\D/g, '').includes(search.replace(/\D/g, '')) ||
      (l.email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStage = !stageFilter || l.stage === stageFilter
    return matchSearch && matchStage
  })

  return (
    <>
      {/* Header bar */}
      <div style={{
        height: 60, background: '#111', borderBottom: '1px solid #222',
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>Clientes</h1>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <svg
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555' }}
            width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: '#161616', border: '1px solid #222', borderRadius: 8,
              padding: '7px 10px 7px 32px', fontSize: 12, color: '#f0f0f0', outline: 'none',
            }}
          />
        </div>

        {/* Stage filter */}
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          style={{
            background: '#161616', border: '1px solid #222', borderRadius: 8,
            padding: '7px 12px', fontSize: 12, color: stageFilter ? '#f0f0f0' : '#555',
            outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">Todos os stages</option>
          {Object.entries(STAGE_CONFIG).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <span style={{ fontSize: 11, color: '#444', minWidth: 60 }}>
          {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
        </span>

        <div style={{ flex: 1 }} />

        {/* New client button */}
        <button
          onClick={() => setShowDialog(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#10b981', border: 'none', borderRadius: 8,
            padding: '8px 18px', fontSize: 13, fontWeight: 700,
            color: '#000', cursor: 'pointer',
            boxShadow: '0 0 16px #10b98133',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px #10b98166'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px #10b98133'; e.currentTarget.style.transform = 'none' }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Cliente
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d0d0d' }}>
                {['Nome', 'Telefone', 'E-mail', 'Stage', 'Campanha', 'Cadastrado'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontSize: 10, color: '#444', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    borderBottom: '1px solid #222',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: '#444' }}>
                    {search || stageFilter
                      ? 'Nenhum cliente encontrado para este filtro.'
                      : 'Nenhum cliente ainda. Clique em "+ Novo Cliente" para começar.'}
                  </td>
                </tr>
              ) : (
                filtered.map(lead => <LeadRow key={lead.id} lead={lead} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDialog && <NovoClienteDialog onClose={() => setShowDialog(false)} />}
    </>
  )
}
