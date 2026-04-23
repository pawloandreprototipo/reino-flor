'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Address {
  id: string
  label: string
  street: string
  number: string
  complement?: string
  district: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

export type AddressInput = Omit<Address, 'id'>

const QUERY_KEY = ['sf-addresses']

async function fetchAddresses(): Promise<Address[]> {
  const { data } = await api.get('/api/addresses')
  return data.data as Address[]
}

export function useAddresses() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAddresses,
  })
}

export function useCreateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddressInput) => {
      const { data } = await api.post('/api/addresses', input)
      return data.data as Address
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<AddressInput> & { id: string }) => {
      const { data } = await api.put(`/api/addresses/${id}`, input)
      return data.data as Address
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/addresses/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
