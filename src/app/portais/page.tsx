'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PortalCard } from '@/components/portais/PortalCard'
import type { PortalLink } from '@/types/database'

const ICON_STYLES: Record<string, { bg: string; color: string }> = {
  ZAP: { bg: '#ffab4018', color: '#ffab40' },
  VR:  { bg: '#42a5f518', color: '#42a5f5' },
  OLX: { bg: '#10b98118', color: '#10b981' },
  CN:  { bg: '#ef535018', color: '#ef5350' },
  CX:  { bg: '#ab47bc18', color: '#ab47bc' },
  CR:  { bg: '#29b6f618', color: '#29b6f6' },
}

export default function PortaisPage() {
  const [portais, setPortais] = useState<PortalLink[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('portal_links').select('*').order('created_at').then(({ data }) => data && setPortais(data))
  }, [])

  async function handleAdd() {
    if (!newName || !newUrl) return
    const { data } = await supabase.from('portal_links').insert({
      name: newName,
      url: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`,
      icon_label: newIcon.slice(0, 3).toUpperCase() || newName.slice(0, 2).toUpperCase(),
    }).select().single()
    if (data) { setPortais(p => [...p, data]); setShowAdd(false); setNewName(''); setNewUrl(''); setNewIcon('') }
  }

  const input: React.CSSProperties = {
    background: '#161616', border: '1px solid #222', borderRadius: 8,
    padding: '9px 12px', color: '#f0f0f0', fontSize: 13, outline: 'none', width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{
        height: 60, background: '#111', borderBottom: '1px solid #222',
        display: 'flex', alignItems: 'center', padding: '0 24px', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: 16, fontWeight: 600 }}>Portais Imobiliários</h1>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {portais.map(p => {
            const style = ICON_STYLES[p.icon_label ?? ''] ?? { bg: '#33333322', color: '#777' }
            return (
              <PortalCard
                key={p.id}
                name={p.name}
                url={p.url}
                iconLabel={p.icon_label ?? p.name.slice(0, 2)}
                iconBg={style.bg}
                iconColor={style.color}
                desc="Portal imobiliário"
              />
            )
          })}

          <div
            onClick={() => setShowAdd(true)}
            style={{
              background: '#111', border: '1px dashed #2a2a2a', borderRadius: 14,
              padding: '28px 20px 22px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 12, cursor: 'pointer', width: 180,
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 14, border: '1px dashed #2a2a2a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, color: '#555',
            }}>＋</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>Adicionar</div>
            <div style={{ fontSize: 11, color: '#333', textAlign: 'center' }}>Novo portal ou link</div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div style={{
          position: 'fixed', inset: 0, background: '#00000088',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: 14, padding: 28, width: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Novo portal</div>
            <div><label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 5 }}>Nome *</label><input style={input} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Imovelweb" /></div>
            <div><label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 5 }}>URL *</label><input style={input} value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." /></div>
            <div><label style={{ fontSize: 11, color: '#555', display: 'block', marginBottom: 5 }}>Sigla do ícone (2–3 letras)</label><input style={input} value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="IW" maxLength={3} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: '#161616', border: '1px solid #222', borderRadius: 8, padding: 10, color: '#999', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleAdd} disabled={!newName || !newUrl} style={{ flex: 1, background: newName && newUrl ? '#10b981' : '#222', border: 'none', borderRadius: 8, padding: 10, color: newName && newUrl ? '#000' : '#555', fontWeight: 700, fontSize: 13, cursor: newName && newUrl ? 'pointer' : 'not-allowed' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
