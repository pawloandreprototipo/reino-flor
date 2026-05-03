'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useProductInventory, useStockMovements, useAdjustStock, useUpdateInventory } from '@/hooks/useInventory'
import type { InventoryItem, StockMovement } from '@/hooks/useInventory'
import { useWarehouses } from '@/hooks/useWarehouses'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Topbar } from '@/components/layout/Topbar'

export default function InventoryProductDetailPage() {
  const params = useParams()
  const productId = params.id as string

  const { data: inventory, isLoading } = useProductInventory(productId)
  const { data: warehousesData } = useWarehouses()
  const warehouses = warehousesData?.warehouses ?? []

  const [movementPage, setMovementPage] = useState(1)
  const { data: movementsData, isLoading: movementsLoading } = useStockMovements(productId, { page: movementPage, limit: 10 })

  const adjustStock = useAdjustStock(productId)
  const updateInventory = useUpdateInventory(productId)

  // Adjust form state
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN')
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  // Settings form state
  const [lowStockAlert, setLowStockAlert] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [settingsInitialized, setSettingsInitialized] = useState(false)

  // Initialize settings form when data loads
  if (inventory != null && !settingsInitialized) {
    setLowStockAlert(String((inventory as InventoryItem).lowStockAlert))
    setWarehouseId((inventory as InventoryItem).warehouseId ?? '')
    setSettingsInitialized(true)
  }

  const movements = movementsData?.movements ?? []
  const movementsTotal = movementsData?.total ?? 0
  const movementsTotalPages = Math.ceil(movementsTotal / 10)

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustQty) return
    await adjustStock.mutateAsync({
      type: adjustType,
      quantity: Number(adjustQty),
      reason: adjustReason || undefined,
    })
    setAdjustQty('')
    setAdjustReason('')
  }

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateInventory.mutateAsync({
      lowStockAlert: Number(lowStockAlert),
      warehouseId: warehouseId || null,
    })
  }

  const movementColumns = [
    {
      key: 'type',
      header: 'Tipo',
      render: (row: StockMovement) => {
        const colors: Record<string, string> = {
          IN: 'bg-green-50 text-green-700',
          OUT: 'bg-red-50 text-red-700',
          ADJUSTMENT: 'bg-blue-50 text-blue-700',
          RETURN: 'bg-yellow-50 text-yellow-700',
        }
        return <Badge label={row.type} className={colors[row.type] ?? ''} />
      },
    },
    { key: 'quantity', header: 'Quantidade' },
    {
      key: 'reason',
      header: 'Motivo',
      render: (row: StockMovement) => <span className="text-gray-500">{row.reason ?? '—'}</span>,
    },
    {
      key: 'orderId',
      header: 'Pedido',
      render: (row: StockMovement) => <span className="text-gray-500 text-xs">{row.orderId ?? '—'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Data',
      render: (row: StockMovement) => (
        <span className="text-gray-500 text-xs">
          {new Date(row.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Topbar title="Detalhes do Inventário" />
        <div className="p-6">
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!inventory) {
    return (
      <div className="flex flex-col">
        <Topbar title="Detalhes do Inventário" />
        <div className="p-6">
          <p className="text-gray-400">Inventário não encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Topbar title={`Inventário — ${inventory.productName}`} />
      <div className="p-6 space-y-6">
        {/* Summary */}
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 py-2">
              <div>
                <p className="text-sm text-gray-500">Quantidade</p>
                <p className="text-xl font-bold text-gray-900">{inventory.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reservado</p>
                <p className="text-xl font-bold text-gray-900">{inventory.reserved}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Disponível</p>
                <p className="text-xl font-bold text-gray-900">{inventory.availableStock}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Alerta</p>
                <p className="text-xl font-bold text-gray-900">{inventory.lowStockAlert}</p>
              </div>
            </div>
            {inventory.warehouseName && (
              <p className="text-sm text-gray-500 mt-2">
                Armazém: <span className="font-medium text-gray-700">{inventory.warehouseName}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Adjust Stock Form */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Ajustar Estoque</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdjust} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as 'IN' | 'OUT' | 'ADJUSTMENT')}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="IN">Entrada (IN)</option>
                    <option value="OUT">Saída (OUT)</option>
                    <option value="ADJUSTMENT">Ajuste (ADJUSTMENT)</option>
                  </select>
                </div>
                <Input
                  label="Quantidade"
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  required
                />
                <Input
                  label="Motivo (opcional)"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
                <Button type="submit" loading={adjustStock.isPending}>
                  Aplicar Ajuste
                </Button>
                {adjustStock.isError && (
                  <p className="text-xs text-red-600">
                    {(adjustStock.error as {response?: {data?: {error?: string}}})?.response?.data?.error ?? 'Erro ao ajustar estoque'}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Settings Form */}
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-900">Configurações</h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <Input
                  label="Alerta de Estoque Baixo"
                  type="number"
                  min="0"
                  value={lowStockAlert}
                  onChange={(e) => setLowStockAlert(e.target.value)}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Armazém</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Nenhum</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" loading={updateInventory.isPending}>
                  Salvar Configurações
                </Button>
                {updateInventory.isError && (
                  <p className="text-xs text-red-600">
                    {(updateInventory.error as {response?: {data?: {error?: string}}})?.response?.data?.error ?? 'Erro ao salvar'}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Movements Table */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Histórico de Movimentações</h2>
          </CardHeader>
          <CardContent>
            <Table
              columns={movementColumns}
              data={movements}
              keyField="id"
              loading={movementsLoading}
              emptyMessage="Nenhuma movimentação encontrada"
            />
            {movementsTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Página {movementPage} de {movementsTotalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMovementPage(p => Math.max(1, p - 1))}
                    disabled={movementPage === 1}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setMovementPage(p => Math.min(movementsTotalPages, p + 1))}
                    disabled={movementPage === movementsTotalPages}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
