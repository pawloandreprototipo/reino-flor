'use client'

import { useState, useRef } from 'react'
import { Search, Plus, Upload, Trash2 } from 'lucide-react'
import { useSubscribers, useCreateSubscriber, useDeleteSubscriber, useImportSubscribers } from '@/hooks/useSubscribers'
import { Topbar } from '@/components/layout/Topbar'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { formatDateShort } from '@/lib/utils'

export default function SubscribersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: { row: number; reason: string }[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useSubscribers({ page, limit: 20, search })
  const createSubscriber = useCreateSubscriber()
  const deleteSubscriber = useDeleteSubscriber()
  const importSubscribers = useImportSubscribers()

  const handleAdd = async () => {
    if (!newEmail) return
    try {
      await createSubscriber.mutateAsync({ email: newEmail, name: newName || undefined })
      setNewEmail('')
      setNewName('')
      setShowAdd(false)
    } catch (e: unknown) {
      alert((e as {response?: {data?: {error?: string}}}).response?.data?.error ?? 'Erro ao criar assinante')
    }
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Remover "${email}"?`)) return
    await deleteSubscriber.mutateAsync(id)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importSubscribers.mutateAsync(file)
      setImportResult(result)
    } catch {
      alert('Erro ao importar CSV')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex flex-col">
      <Topbar title="Assinantes" />
      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Buscar assinantes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Importar CSV
            </Button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>

        {showAdd && (
          <div className="flex items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nome</label>
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome (opcional)" />
            </div>
            <Button size="sm" loading={createSubscriber.isPending} onClick={handleAdd}>Salvar</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancelar</Button>
          </div>
        )}

        {importResult && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
            <p className="font-medium text-green-800">Importação concluída</p>
            <p className="text-green-700">Criados: {importResult.created} | Ignorados: {importResult.skipped} | Erros: {importResult.errors.length}</p>
            <button className="mt-1 text-xs text-green-600 underline" onClick={() => setImportResult(null)}>Fechar</button>
          </div>
        )}

        <Table
          keyField="id"
          loading={isLoading}
          data={data?.subscribers ?? []}
          emptyMessage="Nenhum assinante encontrado"
          columns={[
            {
              key: 'email',
              header: 'Email',
              render: (row) => <span className="font-medium text-gray-900">{row.email}</span>,
            },
            {
              key: 'name',
              header: 'Nome',
              render: (row) => row.name ?? '-',
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
            {
              key: 'actions',
              header: '',
              render: (row) => (
                <button
                  onClick={() => handleDelete(row.id, row.email)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ),
            },
          ]}
        />

        {data && data.total > 20 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{data.total} assinantes no total</span>
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
