'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'

interface ClosingEvolutionChartProps {
  data: { date: string; count: number; vgv: number }[]
  periodLabel?: string
  granularity?: string
}

function fmtVgv(v: number) {
  if (v >= 1_000_000) return 'R$' + (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000)     return 'R$' + (v / 1_000).toFixed(0) + 'k'
  return v > 0 ? 'R$' + v.toFixed(0) : ''
}

export function ClosingEvolutionChart({ data, periodLabel, granularity }: ClosingEvolutionChartProps) {
  return (
    <div
      className="card-hover anim-fade-up"
      style={{
        background: '#111', border: '1px solid #222', borderRadius: 12, padding: 20,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#f0f0f0' }}>
        Evolução de Fechamentos
      </div>
      <div style={{ fontSize: 11, color: '#555', marginBottom: 16 }}>
        {periodLabel ?? ''}{granularity ? ` • ${granularity}` : ''}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="#1a1a1a" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#555' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: '#555' }}
            axisLine={false} tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: '#555' }}
            axisLine={false} tickLine={false}
            tickFormatter={fmtVgv}
            width={54}
          />
          <Tooltip
            contentStyle={{
              background: '#161616', border: '1px solid #10b98144',
              borderRadius: 8, fontSize: 12, color: '#f0f0f0',
              boxShadow: '0 8px 24px #00000066',
            }}
            formatter={(value, name) => {
              const v = Number(value)
              if (name === 'VGV') return [fmtVgv(v) || 'R$0', 'VGV']
              return [v, 'Pastas']
            }}
          />
          <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: '#999' }} />
          <Bar
            yAxisId="left"
            dataKey="count"
            name="Pastas"
            fill="#10b981"
            fillOpacity={0.75}
            radius={[3, 3, 0, 0]}
          />
          <Line
            yAxisId="right"
            dataKey="vgv"
            name="VGV"
            stroke="#42a5f5"
            strokeWidth={2}
            dot={{ r: 3, fill: '#42a5f5', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
