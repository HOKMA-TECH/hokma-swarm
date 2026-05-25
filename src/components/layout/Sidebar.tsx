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
  { href: '/apuracao-de-renda', label: 'Apuração de Renda', icon: 'sun' },
  { href: '/portais',           label: 'Portais',           icon: 'globe' },
]

function NavIcon({ type }: { type: string }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 } as const
  if (type === 'grid') return <svg {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  if (type === 'bar') return <svg {...props}><rect x="2" y="7" width="5" height="10"/><rect x="10" y="4" width="5" height="13"/><rect x="18" y="9" width="5" height="8"/></svg>
  if (type === 'cal') return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  if (type === 'chart') return <svg {...props}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  if (type === 'sun') return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
  if (type === 'globe') return <svg {...props}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  return null
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{
      width: 220, background: '#111', borderRight: '1px solid #222',
      display: 'flex', flexDirection: 'column', padding: '20px 0',
      flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
          <rect width="100" height="100" rx="16" fill="#00c853" fillOpacity="0.15"/>
          <path d="M20 20 L50 50 L20 80 L35 80 L50 65 L65 80 L80 80 L50 50 L80 20 L65 20 L50 35 L35 20 Z" fill="#00c853"/>
        </svg>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#00c853', letterSpacing: '0.05em' }}>HOKMA SWARM</div>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>IMOBILIÁRIA</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 0' }}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 20px', fontSize: 13, textDecoration: 'none',
                color: isActive ? '#00c853' : '#999',
                background: isActive ? '#00c85322' : 'transparent',
                borderRight: isActive ? '2px solid #00c853' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.7 }}>
                <NavIcon type={item.icon} />
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #222' }}>
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', padding: 0 }}
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
