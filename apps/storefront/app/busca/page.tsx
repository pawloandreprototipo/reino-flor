'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { parseSearchParams, buildSearchUrl, type SearchParams, type SortOption } from '@/lib/search'
import { SearchFilters } from '@/components/ui/SearchFilters'
import { ProductCard } from '@/components/ui/ProductCard'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = parseSearchParams(searchParams)
  const { data: categories } = useCategories()

  const { data, isLoading } = useProducts({
    search: params.q || undefined,
    categoryId: params.categoryId,
    page: params.page,
    limit: 12,
  })

  const products = data?.products ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 12)

  const updateFilter = (updates: Partial<SearchParams>) => {
    const newParams = { ...params, ...updates, page: 1 }
    router.push(buildSearchUrl(newParams))
  }

  const goToPage = (page: number) => {
    router.push(buildSearchUrl({ ...params, page }))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      {params.q && (
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Resultados para &lsquo;{params.q}&rsquo;
          {!isLoading && (
            <span className="ml-2 text-base font-normal text-gray-500">
              ({total} {total === 1 ? 'produto' : 'produtos'})
            </span>
          )}
        </h1>
      )}

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-60">
          <SearchFilters
            categories={categories ?? []}
            selectedCategoryId={params.categoryId}
            sortBy={params.sort}
            onCategoryChange={(id) => updateFilter({ categoryId: id })}
            onSortChange={(sort: SortOption) => updateFilter({ sort })}
          />
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="mb-4 h-16 w-16 text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-700">Nenhum produto encontrado</h2>
              <p className="mt-1 text-sm text-gray-500">
                Tente buscar com outros termos ou limpe os filtros.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    disabled={params.page <= 1}
                    onClick={() => goToPage(params.page - 1)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {params.page} de {totalPages}
                  </span>
                  <button
                    disabled={params.page >= totalPages}
                    onClick={() => goToPage(params.page + 1)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8">Carregando...</div>}>
      <SearchContent />
    </Suspense>
  )
}
