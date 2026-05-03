'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInventory } from '@/hooks/useInventory'
import type { InventoryItem } from '@/hooks/useInventory'
import { Table } from '@/components/ui/Table'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Topbar } from '@/components/layout/Topbar'

export default function InventoryProductsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useInventory({ page, limit, search: search || undefined })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  const columns = [
    {
      key: 'productName',
      header: 'Produto',
      render: (row: InventoryItem) => (
        <span className="font-medium text-gray-900">{row.productName}</span>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantidade',
      render: (row: InventoryItem) => <span>{row.quantity}</span>,
    },
    {
      key: 'reserved',
      header: 'Reservado',
      render: (row: InventoryItem) => <span>{row.reserved}</span>,
    },
    {
      key: 'availableStock',
      header: 'Disponível',
      render: (row: InventoryItem) => <span className="font-medium">{row.availableStock}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: InventoryItem) => {
        const isLow = row.quantity <= row.lowStockAlert
        return isLow ? (
          <Badge label="Estoque Baixo" className="bg-red-50 text-red-700" />
        ) : (
          <Badge label="Normal" className="bg-green-50 text-green-700" />
        )
      },
    },
    {
      key: 'warehouseName',
      header: 'Armazém',
      render: (row: InventoryItem) => <span className="text-gray-500">{row.warehouseName ?? '—'}</span>,
    },
  ]

  return (
    <div className="flex flex-col">
      <Topbar title="Estoque de Produtos" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-72">
            <Input
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={items}
          keyField="productId"
          loading={isLoading}
          emptyMessage="Nenhum produto encontrado"
          onRowClick={(row) => router.push(`/dashboard/inventory/products/${row.productId}`)}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
