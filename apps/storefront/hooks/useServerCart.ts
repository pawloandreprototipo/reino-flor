'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CartItem } from '@/context/CartContext'

export interface ServerCartItem {
  id: string
  productId: string
  variantId?: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: { url: string }[]
  }
  variant?: {
    id: string
    name: string
    price: number
  }
}

export interface ServerCart {
  items: ServerCartItem[]
  total: number
  itemCount: number
}

const QUERY_KEY = ['sf-server-cart']

async function fetchServerCart(): Promise<ServerCart> {
  const { data } = await api.get('/api/cart')
  return data.data as ServerCart
}

export function useServerCart(enabled = false) {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchServerCart,
    enabled,
  })
}

export function useAddToServerCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { productId: string; variantId?: string; quantity: number }) => {
      const { data } = await api.post('/api/cart', input)
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateServerCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { data } = await api.put(`/api/cart/${id}`, { quantity })
      return data.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useRemoveServerCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/cart/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

/**
 * Merge local cart items with the server cart.
 * Sends local-only items to the server, then returns the merged server cart.
 */
export async function mergeCartWithServer(localItems: CartItem[]): Promise<ServerCart> {
  // Fetch current server cart
  const { data: cartRes } = await api.get('/api/cart')
  const serverCart = cartRes.data as ServerCart

  // Determine which local items are not already on the server
  const serverKeys = new Set(
    serverCart.items.map((i) => i.productId + (i.variantId ?? ''))
  )

  const newItems = localItems.filter(
    (item) => !serverKeys.has(item.productId + (item.variantId ?? ''))
  )

  // Add new local items to server
  for (const item of newItems) {
    try {
      await api.post('/api/cart', {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })
    } catch {
      // Skip items that fail (product may be inactive)
    }
  }

  // Re-fetch if we added items, otherwise return existing
  if (newItems.length > 0) {
    const { data: merged } = await api.get('/api/cart')
    return merged.data as ServerCart
  }

  return serverCart
}
