'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { STAGE_CONFIG, type Stage } from '@/types/database'

interface StageDonutProps {
  data: { stage: Stage; count: number }[]
}

export function StageDonut({ data }: StageDonutProps) {
  const chartData = data.map(d => ({
    name: STAGE_CONFIG[d.stage]?.label ?? d.stage,
    value: d.count,
    color: STAGE_CONFIG[d.stage]?.color ?? '#555',
  }))

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Pipeline por stage</div>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>Distribuição atual</div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#161616', border: '1px solid #222', borderRadius: 8, fontSize: 12 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#999' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
