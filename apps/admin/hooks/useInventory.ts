'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface InventoryItem {
  productId: string
  productName: string
  productPrice: number
  productImage: string | null
  quantity: number
  reserved: number
  availableStock: number
  lowStockAlert: number
  warehouseId: string | null
  warehouseName: string | null
}

interface InventoryResponse {
  items: InventoryItem[]
  total: number
  page: number
  limit: number
}

interface InventoryFilters {
  page?: number
  limit?: number
  search?: string
  warehouseId?: string
  lowStock?: boolean
}

export interface StockMovement {
  id: string
  inventoryId: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'
  quantity: number
  reason: string | null
  orderId: string | null
  createdAt: string
}

interface MovementsResponse {
  movements: StockMovement[]
  total: number
  page: number
  limit: number
}

interface MovementFilters {
  page?: number
  limit?: number
  type?: string
}

export interface AlertItem {
  productId: string
  productName: string
  quantity: number
  reserved: number
  availableStock: number
  lowStockAlert: number
}

interface AlertsResponse {
  alerts: AlertItem[]
}

export function useInventory(filters: InventoryFilters = {}) {
  return useQuery<InventoryResponse>({
    queryKey: ['inventory', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v))
      })
      const { data } = await api.get(`/api/inventory?${params}`)
      return data.data
    },
  })
}

export function useProductInventory(productId: string) {
  return useQuery<InventoryItem | null>({
    queryKey: ['inventory', productId],
    queryFn: async () => {
      const { data } = await api.get(`/api/inventory?search=&limit=1000`)
      const items: InventoryItem[] = data.data.items
      return items.find(i => i.productId === productId) ?? null
    },
    enabled: !!productId,
  })
}

export function useUpdateInventory(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { lowStockAlert?: number; warehouseId?: string | null }) => {
      const { data } = await api.put(`/api/inventory/${productId}`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useAdjustStock(productId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; reason?: string }) => {
      const { data } = await api.post(`/api/inventory/${productId}/adjust`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['movements', productId] })
    },
  })
}

export function useStockMovements(productId: string, filters: MovementFilters = {}) {
  return useQuery<MovementsResponse>({
    queryKey: ['movements', productId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v))
      })
      const { data } = await api.get(`/api/inventory/${productId}/movements?${params}`)
      return data.data
    },
    enabled: !!productId,
  })
}

export function useInventoryAlerts() {
  return useQuery<AlertsResponse>({
    queryKey: ['inventory-alerts'],
    queryFn: async () => {
      const { data } = await api.get('/api/inventory/alerts')
      return data.data
    },
  })
}
