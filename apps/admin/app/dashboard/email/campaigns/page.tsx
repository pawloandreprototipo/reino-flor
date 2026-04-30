'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useCampaigns } from '@/hooks/useCampaigns'
import { Topbar } from '@/components/layout/Topbar'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDateShort } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendada',
  SENDING: 'Enviando',
  SENT: 'Enviada',
  CANCELLED: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  SENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function CampaignsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useCampaigns({ page, limit: 20, status: status || undefined })

  return (
    <div className="flex flex-col">
      <Topbar title="Campanhas" />
      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          >
            <option value="">Todos os status</option>
            <option value="DRAFT">Rascunho</option>
            <option value="SCHEDULED">Agendada</option>
            <option value="SENDING">Enviando</option>
            <option value="SENT">Enviada</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
          <Button onClick={() => router.push('/dashboard/email/campaigns/new')}>
            <Plus className="h-4 w-4" /> Nova Campanha
          </Button>
        </div>

        <Table
          keyField="id"
          loading={isLoading}
          data={data?.campaigns ?? []}
          emptyMessage="Nenhuma campanha encontrada"
          onRowClick={(row) => router.push(`/dashboard/email/campaigns/${row.id}`)}
          columns={[
            {
              key: 'name',
              header: 'Campanha',
              render: (row) => (
                <div>
                  <p className="font-medium text-gray-900">{row.name}</p>
                  <p className="text-xs text-gray-400">{row.subject}</p>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <Badge
                  label={STATUS_LABELS[row.status] ?? row.status}
                  className={STATUS_COLORS[row.status]}
                />
              ),
            },
            {
              key: 'sentAt',
              header: 'Enviada em',
              render: (row) => row.sentAt ? <span className="text-xs text-gray-500">{formatDateShort(row.sentAt)}</span> : <span className="text-xs text-gray-400">-</span>,
            },
            {
              key: 'sentCount',
              header: 'Enviados',
              render: (row) => <span className="font-medium">{row.sentCount}</span>,
            },
          ]}
        />

        {data && data.total > 20 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{data.total} campanhas no total</span>
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
