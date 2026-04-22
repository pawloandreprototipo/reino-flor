'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Product {
  id: string
  name: string
  slug: string
  price: number
  comparePrice?: number
  status: string
  featured: boolean
  category?: { id: string; name: string }
  inventory?: { quantity: number }
  images: { url: string; alt?: string }[]
  _count?: { reviews: number }
  createdAt: string
}

interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
}

interface ProductFilters {
  page?: number
  limit?: number
  status?: string
  search?: string
  categoryId?: string
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery<ProductsResponse>({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, String(v)))
      const { data } = await api.get(`/api/products?${params}`)
      return data.data
    },
  })
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/products/${id}`)
      return data.data
    },
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Product>) => {
      const { data } = await api.post('/api/products', payload)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Partial<Product>) => {
      const { data } = await api.put(`/api/products/${id}`, payload)
      return data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['product', id] })
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/products/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
