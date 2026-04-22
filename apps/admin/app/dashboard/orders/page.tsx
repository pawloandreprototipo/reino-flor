'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { Topbar } from '@/components/layout/Topbar'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'

export default function OrdersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useOrders({ page, limit: 20, search, status })

  return (
    <div className="flex flex-col">
      <Topbar title="Pedidos" />
      <div className="p-6 space-y-4">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Buscar por cliente ou ID..."
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
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <Table
          keyField="id"
          loading={isLoading}
          data={data?.orders ?? []}
          emptyMessage="Nenhum pedido encontrado"
          onRowClick={(row) => router.push(`/dashboard/orders/${row.id}`)}
          columns={[
            {
              key: 'id',
              header: 'Pedido',
              render: (row) => (
                <span className="font-mono text-xs text-gray-500">#{row.id.slice(-8).toUpperCase()}</span>
              ),
            },
            {
              key: 'user',
              header: 'Cliente',
              render: (row) => (
                <div>
                  <p className="font-medium text-gray-900">{row.user.name}</p>
                  <p className="text-xs text-gray-400">{row.user.email}</p>
                </div>
              ),
            },
            {
              key: 'total',
              header: 'Total',
              render: (row) => <span className="font-semibold">{formatCurrency(Number(row.total))}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <Badge
                  label={ORDER_STATUS_LABELS[row.status] ?? row.status}
                  className={ORDER_STATUS_COLORS[row.status]}
                />
              ),
            },
            {
              key: 'payment',
              header: 'Pagamento',
              render: (row) => (
                <Badge
                  label={row.payment?.status === 'PAID' ? 'Pago' : row.payment?.status === 'PENDING' ? 'Pendente' : row.payment?.status ?? '-'}
                  className={row.payment?.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                />
              ),
            },
            {
              key: 'createdAt',
              header: 'Data',
              render: (row) => <span className="text-xs text-gray-500">{formatDate(row.createdAt)}</span>,
            },
          ]}
        />

        {data && data.total > 20 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{data.total} pedidos no total</span>
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
