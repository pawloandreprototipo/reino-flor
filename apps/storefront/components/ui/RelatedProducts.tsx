'use client'

import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/ui/ProductCard'

interface RelatedProductsProps {
  categoryId: string
  currentProductId: string
}

export function RelatedProducts({ categoryId, currentProductId }: RelatedProductsProps) {
  const { data, isLoading } = useProducts({ categoryId, limit: 5 })

  const related = (data?.products ?? [])
    .filter((p) => p.id !== currentProductId)
    .slice(0, 4)

  if (isLoading) {
    return (
      <div className="mt-16">
        <h2 className="mb-6 text-xl font-bold text-gray-900">Produtos relacionados</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 w-64 flex-shrink-0 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  if (related.length === 0) return null

  return (
    <div className="mt-16">
      <h2 className="mb-6 text-xl font-bold text-gray-900">Produtos relacionados</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {related.map((product) => (
          <div key={product.id} className="w-64 flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
