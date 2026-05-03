'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Warehouse {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  active: boolean
  _count?: { inventory: number }
}

interface WarehousesResponse {
  warehouses: Warehouse[]
}

export function useWarehouses() {
  return useQuery<WarehousesResponse>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await api.get('/api/warehouses')
      return data.data
    },
  })
}

export function useCreateWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; address: string; city: string; state: string; zipCode: string }) => {
      const { data } = await api.post('/api/warehouses', payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  })
}

export function useUpdateWarehouse(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Warehouse>) => {
      const { data } = await api.put(`/api/warehouses/${id}`, payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  })
}

export function useDeleteWarehouse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/warehouses/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  })
}
