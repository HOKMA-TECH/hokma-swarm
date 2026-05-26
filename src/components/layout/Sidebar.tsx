'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard',         label: 'Dashboard',         icon: 'grid' },
  { href: '/pipeline',          label: 'Pipeline',          icon: 'bar' },
  { href: '/agenda',            label: 'Agenda',            icon: 'cal' },
  { href: '/relatorios',        label: 'Relatórios',        icon: 'chart' },
  { href: '/conversor',         label: 'Conversor',         icon: 'conv' },
  { href: '/apuracao-de-renda', label: 'Apuração de Renda', icon: 'sun' },
  { href: '/portais',           label: 'Portais',           icon: 'globe' },
]

function NavIcon({ type }: { type: string }) {
  const props = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'grid')  return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
  if (type === 'bar')   return <svg {...props}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  if (type === 'cal')   return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  if (type === 'chart') return <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  if (type === 'sun')   return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
  if (type === 'globe') return <svg {...props}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  if (type === 'users') return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  if (type === 'conv')  return <svg {...props}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
  if (type === 'gear')  return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  return null
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <aside style={{
      width: 220, background: '#0d0d0d',
      borderRight: '1px solid #1a1a1a',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '22px 20px 20px',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <svg width="36" height="36" viewBox="0 0 72 72" fill="none">
          <polygon points="36,5 64,21 64,53 36,69 8,53 8,21" fill="none" stroke="#10b981" strokeWidth="2.5"/>
          <circle cx="36" cy="37" r="6.5" fill="#10b981"/>
          <circle cx="22" cy="25" r="4.2" fill="#052e16" stroke="#6ee7b7" strokeWidth="1.4"/>
          <circle cx="50" cy="25" r="4.2" fill="#052e16" stroke="#6ee7b7" strokeWidth="1.4"/>
          <circle cx="22" cy="49" r="4.2" fill="#052e16" stroke="#6ee7b7" strokeWidth="1.4"/>
          <circle cx="50" cy="49" r="4.2" fill="#052e16" stroke="#6ee7b7" strokeWidth="1.4"/>
          <circle cx="36" cy="16" r="3" fill="#052e16" stroke="#6ee7b7" strokeWidth="1.2"/>
          <circle cx="36" cy="58" r="3" fill="#052e16" stroke="#6ee7b7" strokeWidth="1.2"/>
          <line x1="36" y1="37" x2="22" y2="25" stroke="#6ee7b7" strokeWidth="1.4" opacity="0.85"/>
          <line x1="36" y1="37" x2="50" y2="25" stroke="#6ee7b7" strokeWidth="1.4" opacity="0.85"/>
          <line x1="36" y1="37" x2="22" y2="49" stroke="#6ee7b7" strokeWidth="1.4" opacity="0.85"/>
          <line x1="36" y1="37" x2="50" y2="49" stroke="#6ee7b7" strokeWidth="1.4" opacity="0.85"/>
          <line x1="36" y1="37" x2="36" y2="19" stroke="#6ee7b7" strokeWidth="1.1" opacity="0.55"/>
          <line x1="36" y1="37" x2="36" y2="55" stroke="#6ee7b7" strokeWidth="1.1" opacity="0.55"/>
        </svg>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f0f0', letterSpacing: '0.1em' }}>HOKMA</div>
          <div style={{ fontSize: 9, color: '#10b981', letterSpacing: '0.2em', fontWeight: 400, marginTop: 1 }}>SWARM CRM</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${isActive ? ' active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', fontSize: 13, textDecoration: 'none',
                color: isActive ? '#10b981' : '#666',
                background: isActive ? '#10b98122' : 'transparent',
                borderRight: `2px solid ${isActive ? '#10b981' : 'transparent'}`,
                position: 'relative',
              }}
            >
              <span style={{
                transition: 'color 0.15s',
                color: isActive ? '#10b981' : 'inherit',
              }}>
                <NavIcon type={item.icon} />
              </span>
              <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
              {isActive && (
                <span style={{
                  position: 'absolute', right: 14,
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1a1a1a' }}>
        {(() => {
          const isActive = pathname === '/configuracoes' || pathname.startsWith('/configuracoes/')
          return (
            <Link
              href="/configuracoes"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', fontSize: 13, textDecoration: 'none',
                color: isActive ? '#10b981' : '#666',
                background: isActive ? '#10b98122' : 'transparent',
                borderRight: `2px solid ${isActive ? '#10b981' : 'transparent'}`,
                position: 'relative',
              }}
            >
              <span style={{ color: isActive ? '#10b981' : 'inherit' }}>
                <NavIcon type="gear" />
              </span>
              <span style={{ fontWeight: isActive ? 600 : 400 }}>Configurações</span>
              {isActive && (
                <span style={{
                  position: 'absolute', right: 14,
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#10b981', boxShadow: '0 0 6px #10b981',
                }} />
              )}
            </Link>
          )
        })()}
        <div style={{ padding: '10px 20px' }}>
          <button
            onClick={handleLogout}
            className="btn-ghost"
            style={{
              background: 'none', border: '1px solid transparent', borderRadius: 6,
              color: '#444', fontSize: 12, cursor: 'pointer', padding: '5px 8px',
              width: '100%', textAlign: 'left' as const,
            }}
          >
            ← Sair
          </button>
        </div>
      </div>
    </aside>
  )
}
