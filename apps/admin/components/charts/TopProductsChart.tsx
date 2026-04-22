'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface TopProductsChartProps {
  data: { name: string; revenue: number; quantity: number }[]
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">Nenhum dado disponível</p>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '…' : v}
        />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
