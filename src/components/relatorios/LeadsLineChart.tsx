'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { date: string; count: number }[]
}

export function LeadsLineChart({ data }: Props) {
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20, flex: 2 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Leads por dia</div>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 16 }}>Período selecionado</div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#161616', border: '1px solid #222', borderRadius: 8, fontSize: 12 }} />
          <Area type="monotone" dataKey="count" name="Leads" stroke="#10b981" strokeWidth={2.5} fill="url(#greenGrad)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
