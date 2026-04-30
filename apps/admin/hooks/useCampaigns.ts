'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Campaign {
  id: string
  name: string
  subject: string
  body: string
  status: string
  scheduledAt: string | null
  sentAt: string | null
  sentCount: number
  createdAt: string
}

interface CampaignsResponse {
  campaigns: Campaign[]
  total: number
  page: number
  limit: number
}

interface CampaignDetail extends Campaign {
  _stats: { total: number; sent: number; opened: number; clicked: number }
}

interface CampaignFilters {
  page?: number
  limit?: number
  status?: string
}

interface CreateCampaignPayload {
  name: string
  subject: string
  body: string
  scheduledAt?: string
}

interface UpdateCampaignPayload {
  name?: string
  subject?: string
  body?: string
}

export function useCampaigns(filters: CampaignFilters = {}) {
  return useQuery<CampaignsResponse>({
    queryKey: ['campaigns', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, String(v)))
      const { data } = await api.get(`/api/campaigns?${params}`)
      return data.data
    },
  })
}

export function useCampaign(id: string) {
  return useQuery<CampaignDetail>({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/campaigns/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateCampaignPayload) => {
      const { data } = await api.post('/api/campaigns', payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })
}

export function useUpdateCampaign(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateCampaignPayload) => {
      const { data } = await api.put(`/api/campaigns/${id}`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      qc.invalidateQueries({ queryKey: ['campaign', id] })
    },
  })
}

export function useSendCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/campaigns/${id}/send`)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })
}

export function useCancelCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/campaigns/${id}/cancel`)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })
}
