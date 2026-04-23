'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { api } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface Review {
  id: string
  rating: number
  title?: string
  body?: string
  createdAt: string
  user: { name: string }
}

export interface ReviewFormData {
  rating: number
  title?: string
  body?: string
}

interface ReviewsResponse {
  reviews: Review[]
  total: number
}

async function fetchReviews(slug: string, page = 1, limit = 5): Promise<ReviewsResponse> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
  const { data } = await axios.get(`${API_URL}/api/storefront/products/${slug}/reviews?${qs}`)
  return data.data as ReviewsResponse
}

export function useReviews(slug: string, page = 1, limit = 5) {
  return useQuery({
    queryKey: ['sf-reviews', slug, page, limit],
    queryFn: () => fetchReviews(slug, page, limit),
    enabled: !!slug,
  })
}

export function useSubmitReview(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ReviewFormData & { productId: string }) => {
      const { data } = await api.post('/api/storefront/reviews', input)
      return data.data as Review
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sf-reviews', slug] })
    },
  })
}
