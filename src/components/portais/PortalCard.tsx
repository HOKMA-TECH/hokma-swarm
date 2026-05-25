interface Props {
  name: string
  url: string
  iconLabel: string
  iconBg: string
  iconColor: string
  desc: string
}

export function PortalCard({ name, url, iconLabel, iconBg, iconColor, desc }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: '#111', border: '1px solid #222', borderRadius: 14,
        padding: '28px 20px 22px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 12, cursor: 'pointer', textDecoration: 'none',
        width: 180,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#10b981';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px #10b98118'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#222';
        (e.currentTarget as HTMLElement).style.transform = 'none';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 14, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 900, color: iconColor, letterSpacing: '-0.5px',
      }}>
        {iconLabel}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', textAlign: 'center' }}>{name}</div>
      <div style={{ fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 1.4 }}>{desc}</div>
      <div style={{ fontSize: 11, color: '#555' }}>↗ Abrir</div>
    </a>
  )
}
