'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ── Som de chime via Web Audio API ─────────────────────────── */
function playChime() {
  try {
    const ctx = new (window.AudioContext ?? (window as any).webkitAudioContext)()
    const t = ctx.currentTime

    function note(freq: number, start: number, duration: number, vol: number) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t + start)
      gain.gain.setValueAtTime(0, t + start)
      gain.gain.linearRampToValueAtTime(vol, t + start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + duration)
      osc.start(t + start)
      osc.stop(t + start + duration)
    }

    note(880,  0,    0.45, 0.14)   // A5
    note(1108, 0.14, 0.45, 0.10)   // C#6

    setTimeout(() => ctx.close(), 700)
  } catch {}
}

/* ── Notificação nativa do Tauri (se disponível) ────────────── */
async function sendTauriNotification(title: string, body: string) {
  try {
    const tauri = (window as any).__TAURI__
    if (!tauri) return
    // Tauri v1
    if (tauri.notification?.sendNotification) {
      await tauri.notification.sendNotification({ title, body })
      return
    }
    // Tauri v2 (plugin-notification via invoke)
    if (tauri.core?.invoke) {
      await tauri.core.invoke('plugin:notification|notify', { title, body })
    }
  } catch {}
}

interface Notification {
  id: string
  type: string
  lead_id: string
  lead_nome: string | null
  payload: Record<string, unknown> | null
  created_at: string
  read: boolean
}

const TYPE_CONFIG: Record<string, { icon: string; title: string }> = {
  lead_criado:        { icon: '👤', title: 'Nova pasta criada' },
  agendamento_criado: { icon: '📅', title: 'Novo agendamento' },
}

const LS_KEY = 'swarm_notif_read_v1'

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...ids].slice(-300)))
  } catch {}
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  return `${days}d atrás`
}

export function NotificationBell() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(true)

  useEffect(() => {
    const stored = getReadIds()
    setReadIds(stored)

    async function fetchInitial() {
      const { data } = await supabase
        .from('timeline_events')
        .select('id, type, lead_id, payload, created_at, leads(nome)')
        .in('type', ['lead_criado', 'agendamento_criado'])
        .order('created_at', { ascending: false })
        .limit(30)

      if (data) {
        setNotifications(
          data.map((e: any) => ({
            id: e.id,
            type: e.type,
            lead_id: e.lead_id,
            lead_nome: e.leads?.nome ?? null,
            payload: e.payload,
            created_at: e.created_at,
            read: stored.has(e.id),
          }))
        )
      }
      isInitialLoad.current = false
    }

    fetchInitial()

    const channel = supabase
      .channel('swarm-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'timeline_events' },
        async (payload) => {
          const event = payload.new as any
          if (!['lead_criado', 'agendamento_criado'].includes(event.type)) return

          const { data: lead } = await supabase
            .from('leads')
            .select('nome')
            .eq('id', event.lead_id)
            .single()

          const cfg = TYPE_CONFIG[event.type] ?? { icon: '•', title: event.type }
          const leadNome = lead?.nome ?? null

          const notif: Notification = {
            id: event.id,
            type: event.type,
            lead_id: event.lead_id,
            lead_nome: leadNome,
            payload: event.payload,
            created_at: event.created_at,
            read: false,
          }

          if (!isInitialLoad.current) {
            playChime()
            sendTauriNotification(
              cfg.title,
              leadNome ?? 'HOKMA SWARM'
            )
          }

          setNotifications(prev => [notif, ...prev].slice(0, 30))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (open) return
    function handleOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOut)
    return () => document.removeEventListener('mousedown', handleOut)
  }, [open])

  function handleToggle() {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
      const newIds = new Set(readIds)
      notifications.forEach(n => newIds.add(n.id))
      setReadIds(newIds)
      saveReadIds(newIds)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        title="Notificações"
        style={{
          position: 'relative',
          background: open ? '#10b98118' : '#161616',
          border: `1px solid ${open ? '#10b981' : '#222'}`,
          borderRadius: 8,
          width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#ef5350', color: '#fff',
            borderRadius: '50%',
            minWidth: 17, height: 17,
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid #111',
            padding: '0 3px',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          zIndex: 500,
          background: '#111',
          border: '1px solid #222',
          borderRadius: 12,
          width: 320,
          boxShadow: '0 12px 40px #00000099',
          overflow: 'hidden',
          animation: 'fadeUp 0.2s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #1c1c1c',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0' }}>Notificações</span>
            {notifications.length > 0 && (
              <span style={{ fontSize: 10, color: '#444' }}>
                {notifications.length} eventos recentes
              </span>
            )}
          </div>

          <div className="no-scrollbar" style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '32px 16px', textAlign: 'center',
                color: '#444', fontSize: 12, lineHeight: 1.6,
              }}>
                Nenhuma notificação ainda.<br />
                <span style={{ color: '#333' }}>Novos leads e agendamentos aparecerão aqui.</span>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] ?? { icon: '•', title: n.type }
                const payload = n.payload as any
                const detail = n.type === 'agendamento_criado'
                  ? (payload?.titulo ?? payload?.title ?? payload?.tipo ?? '')
                  : ''

                return (
                  <div
                    key={n.id}
                    style={{
                      padding: '11px 16px',
                      borderBottom: '1px solid #181818',
                      background: n.read ? 'transparent' : '#10b98106',
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: '#1a1a1a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, flexShrink: 0,
                    }}>
                      {cfg.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0' }}>
                        {cfg.title}
                      </div>
                      {n.lead_nome && (
                        <div style={{
                          fontSize: 11, color: '#888', marginTop: 2,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {n.lead_nome}
                        </div>
                      )}
                      {detail && (
                        <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>
                          {detail}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: '#3a3a3a', marginTop: 4 }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>

                    {!n.read && (
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#10b981', flexShrink: 0, marginTop: 6,
                      }} />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
