'use client'

import { useCart } from '@/context/CartContext'
import { useProducts, Product } from '@/hooks/useProducts'
import { ProductCard } from '@/components/ui/ProductCard'
import Link from 'next/link'

interface ProductGridProps {
  title: string
  columns?: number
  limit?: number
}

export function ProductGridSection({ title, limit = 6 }: ProductGridProps) {
  const { data, isLoading } = useProducts({ limit, page: 1 })
  const { addItem } = useCart()

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      slug: product.slug,
      imageUrl: product.images[0]?.url,
    })
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <Link href="/produtos" className="text-sm font-medium text-violet-600 hover:underline">
          Ver todos →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data?.products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}
    </section>
  )
}
