'use client'

import Link from 'next/link'
import { Package, AlertTriangle, DollarSign, ArrowRightLeft } from 'lucide-react'
import { useInventory, useInventoryAlerts } from '@/hooks/useInventory'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Topbar } from '@/components/layout/Topbar'
import { formatCurrency } from '@/lib/utils'

export default function InventoryPage() {
  const { data: inventoryData, isLoading } = useInventory({ limit: 1000 })
  const { data: alertsData } = useInventoryAlerts()

  const items = inventoryData?.items ?? []
  const alerts = alertsData?.alerts ?? []

  const totalProducts = items.length
  const lowStockCount = alerts.length
  const totalStockValue = items.reduce(
    (sum, item) => sum + item.quantity * item.productPrice,
    0
  )

  return (
    <div className="flex flex-col">
      <Topbar title="Inventário" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Total de Produtos"
            value={isLoading ? '...' : totalProducts}
            icon={<Package className="h-5 w-5" />}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="Estoque Baixo"
            value={isLoading ? '...' : lowStockCount}
            icon={<AlertTriangle className="h-5 w-5" />}
            color="bg-red-50 text-red-600"
          />
          <StatCard
            title="Valor Total em Estoque"
            value={isLoading ? '...' : formatCurrency(totalStockValue)}
            icon={<DollarSign className="h-5 w-5" />}
            color="bg-green-50 text-green-600"
          />
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/dashboard/inventory/products">
            <Card className="hover:border-violet-300 transition-colors cursor-pointer">
              <CardContent>
                <div className="flex items-center gap-3 py-2">
                  <Package className="h-5 w-5 text-violet-600" />
                  <div>
                    <p className="font-medium text-gray-900">Produtos</p>
                    <p className="text-sm text-gray-500">Gerenciar estoque por produto</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/inventory/warehouses">
            <Card className="hover:border-violet-300 transition-colors cursor-pointer">
              <CardContent>
                <div className="flex items-center gap-3 py-2">
                  <ArrowRightLeft className="h-5 w-5 text-violet-600" />
                  <div>
                    <p className="font-medium text-gray-900">Armazéns</p>
                    <p className="text-sm text-gray-500">Gerenciar locais de estoque</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/inventory/alerts">
            <Card className="hover:border-violet-300 transition-colors cursor-pointer">
              <CardContent>
                <div className="flex items-center gap-3 py-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">Alertas</p>
                    <p className="text-sm text-gray-500">Produtos com estoque baixo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Low Stock Alerts */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Alertas de Estoque Baixo</h2>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">Nenhum alerta de estoque baixo</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.productId} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{alert.productName}</p>
                      <p className="text-xs text-gray-500">
                        Limite: {alert.lowStockAlert} | Disponível: {alert.availableStock}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      {alert.quantity} un.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
