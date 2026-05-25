'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#ab47bc', '#42a5f5', '#ffab40', '#00c853', '#ef5350']

interface Props {
  data: { source: string; count: number }[]
}

export function OrigemDonut({ data }: Props) {
  const chartData = data.map(d => ({ name: d.source || 'Desconhecido', value: d.count }))

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20, flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Origem dos leads</div>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>Por campanha</div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#161616', border: '1px solid #222', borderRadius: 8, fontSize: 12 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#999' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
