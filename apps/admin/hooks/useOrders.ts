'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Order {
  id: string
  status: string
  subtotal: number
  discount: number
  shippingCost: number
  total: number
  trackingCode?: string
  createdAt: string
  user: { id: string; name: string; email: string }
  items: { id: string; name: string; quantity: number; price: number; total: number }[]
  payment?: { status: string; method: string }
}

interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  limit: number
}

export function useOrders(filters: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  return useQuery<OrdersResponse>({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, String(v)))
      const { data } = await api.get(`/api/orders?${params}`)
      return data.data
    },
  })
}

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useUpdateOrder(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { status?: string; trackingCode?: string }) => {
      const { data } = await api.put(`/api/orders/${id}`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['order', id] })
    },
  })
}
