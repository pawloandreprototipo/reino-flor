'use client'

import { ShoppingCart, DollarSign, Users, Clock } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Topbar } from '@/components/layout/Topbar'
import { formatCurrency } from '@/lib/utils'
import { TopProductsChart } from '@/components/charts/TopProductsChart'

export default function DashboardPage() {
  const { data, isLoading } = useAnalytics()

  const overview = data?.overview
  const topProducts = data?.topProducts ?? []

  return (
    <div className="flex flex-col">
      <Topbar title="Dashboard" />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Receita Total"
            value={isLoading ? '...' : formatCurrency(overview?.revenue ?? 0)}
            growth={overview?.revenueGrowth}
            icon={<DollarSign className="h-5 w-5" />}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            title="Pedidos este mês"
            value={isLoading ? '...' : overview?.monthOrders ?? 0}
            growth={overview?.ordersGrowth}
            icon={<ShoppingCart className="h-5 w-5" />}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="Total de Clientes"
            value={isLoading ? '...' : overview?.totalCustomers ?? 0}
            icon={<Users className="h-5 w-5" />}
            color="bg-violet-50 text-violet-600"
          />
          <StatCard
            title="Pedidos Pendentes"
            value={isLoading ? '...' : overview?.pendingOrders ?? 0}
            icon={<Clock className="h-5 w-5" />}
            color="bg-yellow-50 text-yellow-600"
          />
        </div>

        {/* Top Produtos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Top Produtos por Receita</h2>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="py-8 text-center text-sm text-gray-400">Carregando...</p>
              ) : (
                <TopProductsChart data={topProducts} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Resumo do Mês</h2>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                {[
                  { label: 'Total de pedidos', value: overview?.totalOrders ?? 0 },
                  { label: 'Pedidos este mês', value: overview?.monthOrders ?? 0 },
                  { label: 'Pedidos pendentes', value: overview?.pendingOrders ?? 0 },
                  { label: 'Clientes cadastrados', value: overview?.totalCustomers ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <dt className="text-sm text-gray-500">{label}</dt>
                    <dd className="text-sm font-semibold text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
