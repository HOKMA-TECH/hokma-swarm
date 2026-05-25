'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface LeadsBarChartProps {
  data: { date: string; count: number }[]
}

export function LeadsBarChart({ data }: LeadsBarChartProps) {
  return (
    <div
      className="card-hover anim-fade-up"
      style={{
        background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20,
        animationDelay: '80ms',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#f0f0f0' }}>Leads por dia</div>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 16 }}>Últimos 30 dias</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: '#161616', border: '1px solid #10b98144',
              borderRadius: 8, fontSize: 12, color: '#f0f0f0',
              boxShadow: '0 8px 24px #00000066',
            }}
            cursor={{ fill: '#10b98111' }}
          />
          <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill="#10b981"
                fillOpacity={entry.count > 0 ? 0.8 : 0.15}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
