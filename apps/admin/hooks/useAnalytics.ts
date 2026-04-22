'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface AnalyticsOverview {
  overview: {
    totalOrders: number
    monthOrders: number
    ordersGrowth: number
    revenue: number
    revenueGrowth: number
    totalCustomers: number
    pendingOrders: number
  }
  topProducts: {
    productId: string
    name: string
    revenue: number
    quantity: number
  }[]
}

export function useAnalytics() {
  return useQuery<AnalyticsOverview>({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const { data } = await api.get('/api/analytics/overview')
      return data.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
