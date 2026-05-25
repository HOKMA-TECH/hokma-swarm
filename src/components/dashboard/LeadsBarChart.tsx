'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface LeadsBarChartProps {
  data: { date: string; count: number }[]
}

export function LeadsBarChart({ data }: LeadsBarChartProps) {
  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Leads por dia</div>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 16 }}>Últimos 30 dias</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#161616', border: '1px solid #222', borderRadius: 8, fontSize: 12 }}
            cursor={{ fill: '#00c85311' }}
          />
          <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="#00c853" fillOpacity={0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
