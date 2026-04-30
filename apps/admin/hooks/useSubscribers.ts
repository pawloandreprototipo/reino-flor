'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Subscriber {
  id: string
  email: string
  name: string | null
  active: boolean
  createdAt: string
}

interface SubscribersResponse {
  subscribers: Subscriber[]
  total: number
  page: number
  limit: number
}

interface SubscriberFilters {
  page?: number
  limit?: number
  search?: string
}

interface ImportResult {
  created: number
  skipped: number
  errors: { row: number; reason: string }[]
}

export function useSubscribers(filters: SubscriberFilters = {}) {
  return useQuery<SubscribersResponse>({
    queryKey: ['subscribers', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, String(v)))
      const { data } = await api.get(`/api/subscribers?${params}`)
      return data.data
    },
  })
}

export function useCreateSubscriber() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { email: string; name?: string }) => {
      const { data } = await api.post('/api/subscribers', payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscribers'] }),
  })
}

export function useUpdateSubscriber(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name?: string; active?: boolean }) => {
      const { data } = await api.put(`/api/subscribers/${id}`, payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscribers'] }),
  })
}

export function useDeleteSubscriber() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/subscribers/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscribers'] }),
  })
}

export function useImportSubscribers() {
  const qc = useQueryClient()
  return useMutation<ImportResult, Error, File>({
    mutationFn: async (file: File) => {
      const text = await file.text()
      const { data } = await api.post('/api/subscribers/import', { csv: text })
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscribers'] }),
  })
}
