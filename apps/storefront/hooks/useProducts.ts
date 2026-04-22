'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  comparePrice?: number
  status: string
  featured: boolean
  sku?: string
  category?: { id: string; name: string }
  inventory?: { quantity: number }
  images: { url: string; alt?: string }[]
  variants: { id: string; name: string; price: number; stock: number; options: Record<string, string> }[]
  reviews: { id: string; rating: number; title?: string; body?: string; user: { name: string } }[]
  _count?: { reviews: number }
}

// Busca pública de produtos (sem auth) via API interna do storefront
async function fetchProducts(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  const { data } = await axios.get(`${API_URL}/api/storefront/products?${qs}`)
  return data.data as { products: Product[]; total: number }
}

async function fetchProduct(slug: string) {
  const { data } = await axios.get(`${API_URL}/api/storefront/products/${slug}`)
  return data.data as Product
}

export function useProducts(filters: { page?: number; limit?: number; search?: string; categoryId?: string } = {}) {
  const params: Record<string, string> = {}
  if (filters.page) params.page = String(filters.page)
  if (filters.limit) params.limit = String(filters.limit)
  if (filters.search) params.search = filters.search
  if (filters.categoryId) params.categoryId = filters.categoryId

  return useQuery({
    queryKey: ['sf-products', filters],
    queryFn: () => fetchProducts(params),
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['sf-product', slug],
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
  })
}
