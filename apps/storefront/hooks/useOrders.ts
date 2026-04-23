'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export interface OrderSummary {
  id: string
  status: OrderStatus
  total: number
  itemCount: number
  createdAt: string
  items: {
    name: string
    quantity: number
    price: number
    imageUrl?: string
  }[]
}

async function fetchOrders(): Promise<OrderSummary[]> {
  const { data } = await api.get('/api/orders')
  return data.data as OrderSummary[]
}

export function useOrders() {
  return useQuery({
    queryKey: ['sf-orders'],
    queryFn: fetchOrders,
  })
}
