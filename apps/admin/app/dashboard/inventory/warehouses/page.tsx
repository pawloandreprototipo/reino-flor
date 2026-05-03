'use client'

import { useState } from 'react'
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '@/hooks/useWarehouses'
import type { Warehouse } from '@/hooks/useWarehouses'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Topbar } from '@/components/layout/Topbar'

export default function WarehousesPage() {
  const { data, isLoading } = useWarehouses()
  const createWarehouse = useCreateWarehouse()
  const deleteWarehouse = useDeleteWarehouse()

  const warehouses = data?.warehouses ?? []

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')

  const resetForm = () => {
    setName('')
    setAddress('')
    setCity('')
    setState('')
    setZipCode('')
    setShowForm(false)
    setEditingId(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createWarehouse.mutateAsync({ name, address, city, state, zipCode })
    resetForm()
  }

  const handleDelete = async (id: string) => {
    setDeleteError(null)
    try {
      await deleteWarehouse.mutateAsync(id)
    } catch (err) {
      setDeleteError((err as {response?: {data?: {error?: string}}})?.response?.data?.error ?? 'Erro ao excluir armazém')
    }
  }

  const startEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id)
    setName(warehouse.name)
    setAddress(warehouse.address)
    setCity(warehouse.city)
    setState(warehouse.state)
    setZipCode(warehouse.zipCode)
    setShowForm(true)
  }

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'address', header: 'Endereço' },
    { key: 'city', header: 'Cidade' },
    { key: 'state', header: 'Estado' },
    { key: 'zipCode', header: 'CEP' },
    {
      key: 'active',
      header: 'Status',
      render: (row: Warehouse) => (
        <Badge
          label={row.active ? 'Ativo' : 'Inativo'}
          className={row.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row: Warehouse) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); startEdit(row) }}
            className="text-sm text-violet-600 hover:underline"
          >
            Editar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }}
            className="text-sm text-red-600 hover:underline"
          >
            Excluir
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col">
      <Topbar title="Armazéns" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Gerenciar Armazéns</h2>
          <Button onClick={() => { resetForm(); setShowForm(true) }}>
            Novo Armazém
          </Button>
        </div>

        {deleteError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{deleteError}</p>
          </div>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">
                {editingId ? 'Editar Armazém' : 'Novo Armazém'}
              </h3>
            </CardHeader>
            <CardContent>
              <WarehouseForm
                editingId={editingId}
                name={name}
                address={address}
                city={city}
                state={state}
                zipCode={zipCode}
                setName={setName}
                setAddress={setAddress}
                setCity={setCity}
                setState={setState}
                setZipCode={setZipCode}
                onSubmitCreate={handleCreate}
                onCancel={resetForm}
                isCreating={createWarehouse.isPending}
              />
            </CardContent>
          </Card>
        )}

        <Table
          columns={columns}
          data={warehouses}
          keyField="id"
          loading={isLoading}
          emptyMessage="Nenhum armazém cadastrado"
        />
      </div>
    </div>
  )
}

function WarehouseForm({
  editingId,
  name, address, city, state, zipCode,
  setName, setAddress, setCity, setState, setZipCode,
  onSubmitCreate, onCancel, isCreating,
}: {
  editingId: string | null
  name: string; address: string; city: string; state: string; zipCode: string
  setName: (v: string) => void; setAddress: (v: string) => void
  setCity: (v: string) => void; setState: (v: string) => void; setZipCode: (v: string) => void
  onSubmitCreate: (e: React.FormEvent) => void
  onCancel: () => void
  isCreating: boolean
}) {
  // For editing, we use a separate component with its own mutation
  if (editingId) {
    return <WarehouseEditForm
      id={editingId}
      name={name} address={address} city={city} state={state} zipCode={zipCode}
      setName={setName} setAddress={setAddress} setCity={setCity} setState={setState} setZipCode={setZipCode}
      onCancel={onCancel}
    />
  }

  return (
    <form onSubmit={onSubmitCreate} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Endereço" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} required />
        <Input label="Estado" value={state} onChange={(e) => setState(e.target.value)} required />
        <Input label="CEP" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={isCreating}>Criar</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

function WarehouseEditForm({
  id, name, address, city, state, zipCode,
  setName, setAddress, setCity, setState, setZipCode,
  onCancel,
}: {
  id: string
  name: string; address: string; city: string; state: string; zipCode: string
  setName: (v: string) => void; setAddress: (v: string) => void
  setCity: (v: string) => void; setState: (v: string) => void; setZipCode: (v: string) => void
  onCancel: () => void
}) {
  const updateWarehouse = useUpdateWarehouse(id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateWarehouse.mutateAsync({ name, address, city, state, zipCode })
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Endereço" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} required />
        <Input label="Estado" value={state} onChange={(e) => setState(e.target.value)} required />
        <Input label="CEP" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required />
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={updateWarehouse.isPending}>Salvar</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}
