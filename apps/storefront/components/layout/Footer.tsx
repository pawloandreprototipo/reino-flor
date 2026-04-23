'use client'

import Link from 'next/link'
import { Store } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME ?? 'Loja'

export function Footer() {
  const { data: categories } = useCategories()

  return (
    <footer className="border-t border-gray-200 bg-white mt-16">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600">
                <Store className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">{STORE_NAME}</span>
            </div>
            <p className="text-sm text-gray-500">Sua loja online de confiança.</p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Categorias</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              {categories && categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat.id}>
                    <Link href={`/categorias/${cat.slug}`} className="hover:text-violet-600 transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link href="/categorias" className="hover:text-violet-600 transition-colors">
                    Ver categorias
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Minha conta</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/conta" className="hover:text-violet-600 transition-colors">Minha conta</Link></li>
              <li><Link href="/conta/pedidos" className="hover:text-violet-600 transition-colors">Meus pedidos</Link></li>
              <li><Link href="/conta/enderecos" className="hover:text-violet-600 transition-colors">Endereços</Link></li>
              <li><Link href="/carrinho" className="hover:text-violet-600 transition-colors">Carrinho</Link></li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Navegação</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/produtos" className="hover:text-violet-600 transition-colors">Produtos</Link></li>
              <li><Link href="/busca" className="hover:text-violet-600 transition-colors">Buscar</Link></li>
              <li><Link href="/categorias" className="hover:text-violet-600 transition-colors">Categorias</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {STORE_NAME}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
