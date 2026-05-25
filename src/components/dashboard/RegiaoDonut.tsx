'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#10b981', '#42a5f5', '#ab47bc', '#ffab40', '#ef5350', '#6ee7b7', '#80cbc4']

interface RegiaoDonutProps {
  data: { tipo: string; count: number }[]
}

export function RegiaoDonut({ data }: RegiaoDonutProps) {
  const chartData = data.map((d, i) => ({
    name: d.tipo,
    value: d.count,
    color: COLORS[i % COLORS.length],
  }))

  return (
    <div
      className="card-hover anim-fade-up"
      style={{
        background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20,
        animationDelay: '160ms',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#f0f0f0' }}>
        Região de interesse
      </div>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>Por tipo de imóvel</div>
      {chartData.length === 0 ? (
        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: '#333' }}>Sem dados</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%" cy="50%"
              innerRadius={45} outerRadius={65}
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#161616', border: '1px solid #10b98144',
                borderRadius: 8, fontSize: 12, color: '#f0f0f0',
                boxShadow: '0 8px 24px #00000066',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 10, color: '#999' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
