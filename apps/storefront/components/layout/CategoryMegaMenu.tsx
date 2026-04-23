'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCategories, CategoryNode } from '@/hooks/useCategories'

interface CategoryMegaMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function CategoryMegaMenu({ isOpen, onClose }: CategoryMegaMenuProps) {
  const { data: categories } = useCategories()
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  // Close on route change
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!isOpen || !categories || categories.length === 0) return null

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full w-full border-t border-gray-200 bg-white shadow-lg z-50"
    >
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((cat) => (
            <div key={cat.id}>
              <Link
                href={`/categorias/${cat.slug}`}
                className="text-sm font-semibold text-gray-900 hover:text-violet-600 transition-colors"
                onClick={onClose}
              >
                {cat.name}
              </Link>
              {cat.children.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categorias/${child.slug}`}
                        className="text-sm text-gray-500 hover:text-violet-600 transition-colors"
                        onClick={onClose}
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-gray-100 pt-3">
          <Link
            href="/categorias"
            className="text-sm font-medium text-violet-600 hover:text-violet-700"
            onClick={onClose}
          >
            Ver todas as categorias →
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Accordion version for mobile menus */
export function CategoryAccordion({ onNavigate }: { onNavigate: () => void }) {
  const { data: categories } = useCategories()

  if (!categories || categories.length === 0) return null

  return (
    <div className="space-y-1">
      {categories.map((cat) => (
        <MobileCategory key={cat.id} category={cat} onNavigate={onNavigate} />
      ))}
      <Link
        href="/categorias"
        className="block rounded-lg px-3 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50"
        onClick={onNavigate}
      >
        Ver todas as categorias
      </Link>
    </div>
  )
}

function MobileCategory({ category, onNavigate }: { category: CategoryNode; onNavigate: () => void }) {
  const hasChildren = category.children.length > 0

  if (!hasChildren) {
    return (
      <Link
        href={`/categorias/${category.slug}`}
        className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        onClick={onNavigate}
      >
        {category.name}
      </Link>
    )
  }

  return (
    <details className="group">
      <summary className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
        <Link
          href={`/categorias/${category.slug}`}
          className="hover:text-violet-600"
          onClick={() => {
            onNavigate()
          }}
        >
          {category.name}
        </Link>
        <span className="text-gray-400 group-open:rotate-90 transition-transform">›</span>
      </summary>
      <ul className="ml-4 space-y-1 pb-1">
        {category.children.map((child) => (
          <li key={child.id}>
            <Link
              href={`/categorias/${child.slug}`}
              className="block rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-violet-600"
              onClick={onNavigate}
            >
              {child.name}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  )
}
