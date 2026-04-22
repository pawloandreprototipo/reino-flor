'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { useProducts, useDeleteProduct } from '@/hooks/useProducts'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, PRODUCT_STATUS_LABELS, PRODUCT_STATUS_COLORS } from '@/lib/utils'

export default function ProductsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useProducts({ page, limit: 20, search, status })
  const deleteProduct = useDeleteProduct()

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return
    await deleteProduct.mutateAsync(id)
  }

  return (
    <div className="flex flex-col">
      <Topbar title="Produtos" />
      <div className="p-6 space-y-4">

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="DRAFT">Rascunho</option>
              <option value="ARCHIVED">Arquivado</option>
            </select>
          </div>
          <Button onClick={() => router.push('/dashboard/products/new')}>
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        </div>

        {/* Tabela */}
        <Table
          keyField="id"
          loading={isLoading}
          data={data?.products ?? []}
          emptyMessage="Nenhum produto encontrado"
          columns={[
            {
              key: 'name',
              header: 'Produto',
              render: (row) => (
                <div>
                  <p className="font-medium text-gray-900">{row.name}</p>
                  <p className="text-xs text-gray-400">{row.slug}</p>
                </div>
              ),
            },
            {
              key: 'price',
              header: 'Preço',
              render: (row) => (
                <div>
                  <p className="font-medium">{formatCurrency(Number(row.price))}</p>
                  {row.comparePrice && (
                    <p className="text-xs text-gray-400 line-through">{formatCurrency(Number(row.comparePrice))}</p>
                  )}
                </div>
              ),
            },
            {
              key: 'inventory',
              header: 'Estoque',
              render: (row) => (
                <span className={Number(row.inventory?.quantity) <= 5 ? 'text-red-600 font-medium' : ''}>
                  {row.inventory?.quantity ?? 0}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <Badge
                  label={PRODUCT_STATUS_LABELS[row.status] ?? row.status}
                  className={PRODUCT_STATUS_COLORS[row.status]}
                />
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/products/${row.id}`)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-violet-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(row.id, row.name)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
        />

        {/* Paginação */}
        {data && data.total > 20 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{data.total} produtos no total</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Anterior
              </Button>
              <Button variant="secondary" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}>
                Próximo
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
