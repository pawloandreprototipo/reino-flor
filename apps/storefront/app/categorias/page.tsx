'use client'

import Link from 'next/link'
import { Layers } from 'lucide-react'
import { useCategories, CategoryNode } from '@/hooks/useCategories'

export default function CategoriasPage() {
  const { data: categories, isLoading } = useCategories()

  const topLevel = (categories ?? [])
    .filter((c) => c.children !== undefined)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Categorias</h1>
        <p className="mt-1 text-gray-500">Explore nossos produtos por categoria</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg text-gray-400">Nenhuma categoria encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topLevel.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryCard({ category }: { category: CategoryNode }) {
  const imageUrl =
    category.imageUrl ??
    `https://via.placeholder.com/600x400?text=${encodeURIComponent(category.name)}`

  const productCount = category._count.products

  return (
    <Link
      href={`/categorias/${category.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-gray-50">
        <img
          src={imageUrl}
          alt={category.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
          {category.name}
        </h2>
        {category.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{category.description}</p>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-3 text-sm text-gray-400">
          <Layers className="h-4 w-4" />
          <span>
            {productCount} {productCount === 1 ? 'produto' : 'produtos'}
          </span>
        </div>
      </div>
    </Link>
  )
}
