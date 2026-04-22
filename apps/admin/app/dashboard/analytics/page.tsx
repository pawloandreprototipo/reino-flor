'use client'

import { ShoppingCart, DollarSign, Users, TrendingUp } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Topbar } from '@/components/layout/Topbar'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { TopProductsChart } from '@/components/charts/TopProductsChart'
import { formatCurrency } from '@/lib/utils'

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics()
  const overview = data?.overview
  const topProducts = data?.topProducts ?? []

  return (
    <div className="flex flex-col">
      <Topbar title="Analytics" />
      <div className="p-6 space-y-6">

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Receita Total" value={isLoading ? '...' : formatCurrency(overview?.revenue ?? 0)} growth={overview?.revenueGrowth} icon={<DollarSign className="h-5 w-5" />} color="bg-green-50 text-green-600" />
          <StatCard title="Pedidos este mês" value={isLoading ? '...' : overview?.monthOrders ?? 0} growth={overview?.ordersGrowth} icon={<ShoppingCart className="h-5 w-5" />} color="bg-blue-50 text-blue-600" />
          <StatCard title="Total de Clientes" value={isLoading ? '...' : overview?.totalCustomers ?? 0} icon={<Users className="h-5 w-5" />} color="bg-violet-50 text-violet-600" />
          <StatCard title="Total de Pedidos" value={isLoading ? '...' : overview?.totalOrders ?? 0} icon={<TrendingUp className="h-5 w-5" />} color="bg-pink-50 text-pink-600" />
        </div>

        <Card>
          <CardHeader><h2 className="text-sm font-semibold">Top 5 Produtos por Receita</h2></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="py-8 text-center text-sm text-gray-400">Carregando...</p>
            ) : (
              <TopProductsChart data={topProducts} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-sm font-semibold">Detalhamento de Produtos</h2></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase text-gray-500">
                  <th className="pb-2">Produto</th>
                  <th className="pb-2 text-right">Qtd vendida</th>
                  <th className="pb-2 text-right">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topProducts.map((p) => (
                  <tr key={p.productId}>
                    <td className="py-2 font-medium text-gray-900">{p.name}</td>
                    <td className="py-2 text-right text-gray-600">{p.quantity}</td>
                    <td className="py-2 text-right font-semibold text-violet-700">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-gray-400">Nenhum dado disponível</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
