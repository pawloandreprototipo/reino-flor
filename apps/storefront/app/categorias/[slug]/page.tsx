'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useProducts, Product } from '@/hooks/useProducts'
import { useCart } from '@/context/CartContext'
import { buildBreadcrumbs, findCategoryInTree } from '@/lib/categories'
import { ProductCard } from '@/components/ui/ProductCard'

const PAGE_SIZE = 12

export default function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [page, setPage] = useState(1)

  const { data: categories, isLoading: catsLoading } = useCategories()
  const tree = categories ?? []

  const found = findCategoryInTree(tree, slug)
  const category = found?.node
  const breadcrumbs = buildBreadcrumbs(slug, tree)

  const { data: productsData, isLoading: prodsLoading } = useProducts({
    categoryId: category?.id,
    page,
    limit: PAGE_SIZE,
  })

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

  if (catsLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200 mb-6" />
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200 mb-4" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Categoria não encontrada</h1>
        <p className="mt-2 text-gray-500">A categoria que você procura não existe.</p>
        <Link
          href="/categorias"
          className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
        >
          Ver todas as categorias
        </Link>
      </div>
    )
  }

  const totalPages = productsData ? Math.ceil(productsData.total / PAGE_SIZE) : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-gray-500">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            {i < breadcrumbs.length - 1 ? (
              <Link href={crumb.href} className="hover:text-violet-600 transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-900">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Category header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="mt-1 text-gray-500">{category.description}</p>
        )}
      </div>

      {/* Child category chips */}
      {category.children.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {category.children
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((child) => (
              <Link
                key={child.id}
                href={`/categorias/${child.slug}`}
                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-violet-300 hover:text-violet-600 transition-colors"
              >
                {child.name}
                <span className="ml-1 text-gray-400">({child._count.products})</span>
              </Link>
            ))}
        </div>
      )}

      {/* Product grid */}
      {prodsLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : productsData?.products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-gray-400">Nenhum produto nesta categoria</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {productsData?.products.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
