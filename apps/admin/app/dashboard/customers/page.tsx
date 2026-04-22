'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { api } from '@/lib/api'
import { Topbar } from '@/components/layout/Topbar'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { formatDateShort } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
  active: boolean
  _count: { orders: number }
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { page, search }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      const { data } = await api.get(`/api/customers?${params}`)
      return data.data as { customers: Customer[]; total: number }
    },
  })

  return (
    <div className="flex flex-col">
      <Topbar title="Clientes" />
      <div className="p-6 space-y-4">

        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <Table
          keyField="id"
          loading={isLoading}
          data={data?.customers ?? []}
          emptyMessage="Nenhum cliente encontrado"
          columns={[
            {
              key: 'name',
              header: 'Cliente',
              render: (row) => (
                <div>
                  <p className="font-medium text-gray-900">{row.name}</p>
                  <p className="text-xs text-gray-400">{row.email}</p>
                </div>
              ),
            },
            { key: 'phone', header: 'Telefone', render: (row) => row.phone ?? '-' },
            {
              key: 'orders',
              header: 'Pedidos',
              render: (row) => <span className="font-medium">{row._count.orders}</span>,
            },
            {
              key: 'active',
              header: 'Status',
              render: (row) => (
                <span className={`text-xs font-medium ${row.active ? 'text-green-600' : 'text-red-500'}`}>
                  {row.active ? 'Ativo' : 'Inativo'}
                </span>
              ),
            },
            {
              key: 'createdAt',
              header: 'Cadastro',
              render: (row) => <span className="text-xs text-gray-500">{formatDateShort(row.createdAt)}</span>,
            },
          ]}
        />

        {data && data.total > 20 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{data.total} clientes no total</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <Button variant="secondary" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}>Próximo</Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
