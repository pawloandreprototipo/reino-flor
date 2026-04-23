'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import type { CategoryNode } from '@/hooks/useCategories'
import type { SortOption } from '@/lib/search'

interface SearchFiltersProps {
  categories: CategoryNode[]
  selectedCategoryId?: string
  sortBy: SortOption
  onCategoryChange: (categoryId: string | undefined) => void
  onSortChange: (sort: SortOption) => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Mais recentes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'name_asc', label: 'Nome A-Z' },
]

export function SearchFilters({
  categories,
  selectedCategoryId,
  sortBy,
  onCategoryChange,
  onSortChange,
}: SearchFiltersProps) {
  const [catOpen, setCatOpen] = useState(true)

  const hasActiveFilters = !!selectedCategoryId || sortBy !== 'newest'

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <label htmlFor="sort-select" className="block text-sm font-semibold text-gray-700 mb-2">
          Ordenar por
        </label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div>
        <button
          onClick={() => setCatOpen(!catOpen)}
          className="flex w-full items-center justify-between text-sm font-semibold text-gray-700"
        >
          Categorias
          {catOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {catOpen && (
          <ul className="mt-2 space-y-1">
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() =>
                    onCategoryChange(selectedCategoryId === cat.id ? undefined : cat.id)
                  }
                  className={`w-full text-left rounded-md px-2 py-1.5 text-sm transition-colors ${
                    selectedCategoryId === cat.id
                      ? 'bg-violet-100 text-violet-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat.name}
                  <span className="ml-1 text-xs text-gray-400">({cat._count.products})</span>
                </button>

                {/* Children */}
                {cat.children.length > 0 && (
                  <ul className="ml-3 mt-1 space-y-1">
                    {cat.children.map((child) => (
                      <li key={child.id}>
                        <button
                          onClick={() =>
                            onCategoryChange(
                              selectedCategoryId === child.id ? undefined : child.id
                            )
                          }
                          className={`w-full text-left rounded-md px-2 py-1 text-sm transition-colors ${
                            selectedCategoryId === child.id
                              ? 'bg-violet-100 text-violet-700 font-medium'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {child.name}
                          <span className="ml-1 text-xs text-gray-400">
                            ({child._count.products})
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => {
            onCategoryChange(undefined)
            onSortChange('newest')
          }}
          className="flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Limpar filtros
        </button>
      )}
    </div>
  )
}
