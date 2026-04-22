'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useProducts, Product } from '@/hooks/useProducts'
import { useCart } from '@/context/CartContext'
import { ProductCard } from '@/components/ui/ProductCard'

export default function ProdutosPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useProducts({ page, limit: 12, search })
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
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
        <p className="mt-1 text-gray-500">Encontre as melhores flores e decorações</p>
      </div>

      {/* Busca */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : data?.products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-400 text-lg">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data?.products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {data && data.total > 12 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {page} de {Math.ceil(data.total / 12)}
          </span>
          <button
            disabled={page * 12 >= data.total}
            onClick={() => setPage(p => p + 1)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
