'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface CategoryNode {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  sortOrder: number
  _count: { products: number }
  children: CategoryNode[]
}

async function fetchCategories(): Promise<CategoryNode[]> {
  const { data } = await axios.get(`${API_URL}/api/storefront/categories`)
  return data.data as CategoryNode[]
}

export function useCategories() {
  return useQuery({
    queryKey: ['sf-categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  })
}
