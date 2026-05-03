'use client'

import Link from 'next/link'
import { useInventoryAlerts } from '@/hooks/useInventory'
import type { AlertItem } from '@/hooks/useInventory'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Topbar } from '@/components/layout/Topbar'

export default function AlertsPage() {
  const { data, isLoading } = useInventoryAlerts()

  const alerts = data?.alerts ?? []

  const columns = [
    {
      key: 'productName',
      header: 'Produto',
      render: (row: AlertItem) => (
        <Link
          href={`/dashboard/inventory/products/${row.productId}`}
          className="font-medium text-violet-600 hover:underline"
        >
          {row.productName}
        </Link>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantidade Atual',
      render: (row: AlertItem) => (
        <span className="font-medium text-red-600">{row.quantity}</span>
      ),
    },
    {
      key: 'lowStockAlert',
      header: 'Limite de Alerta',
    },
    {
      key: 'availableStock',
      header: 'Disponível',
      render: (row: AlertItem) => <span className="font-medium">{row.availableStock}</span>,
    },
    {
      key: 'urgency',
      header: 'Urgência',
      render: (row: AlertItem) => {
        const diff = row.quantity - row.lowStockAlert
        if (diff <= -5) return <Badge label="Crítico" className="bg-red-100 text-red-800" />
        if (diff < 0) return <Badge label="Muito Baixo" className="bg-red-50 text-red-700" />
        return <Badge label="Baixo" className="bg-yellow-50 text-yellow-700" />
      },
    },
  ]

  return (
    <div className="flex flex-col">
      <Topbar title="Alertas de Estoque Baixo" />
      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-500">
          Produtos com quantidade igual ou abaixo do limite de alerta, ordenados por urgência.
        </p>

        <Table
          columns={columns}
          data={alerts}
          keyField="productId"
          loading={isLoading}
          emptyMessage="Nenhum produto com estoque baixo"
        />
      </div>
    </div>
  )
}
