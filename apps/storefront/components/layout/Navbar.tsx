'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, User, Store, Menu, X, ChevronDown } from 'lucide-react'
import { useState, FormEvent } from 'react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { CategoryMegaMenu, CategoryAccordion } from './CategoryMegaMenu'

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME ?? 'Loja'

export function Navbar() {
  const { itemCount } = useCart()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    router.push(`/busca?q=${encodeURIComponent(q)}`)
    setSearchQuery('')
    setMenuOpen(false)
    setMobileSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">{STORE_NAME}</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/produtos" className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors">
            Produtos
          </Link>
          <div className="relative">
            <button
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors"
              onClick={() => setMegaMenuOpen((v) => !v)}
              onMouseEnter={() => setMegaMenuOpen(true)}
            >
              Categorias
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </nav>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-56 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pl-9 text-sm text-gray-700 placeholder-gray-400 focus:border-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-300"
            />
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile search toggle */}
          <button
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors md:hidden"
            onClick={() => setMobileSearchOpen((v) => !v)}
          >
            <Search className="h-5 w-5" />
          </button>

          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-1 rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <User className="h-5 w-5" />
              </button>
              <div className="absolute right-0 top-full mt-1 hidden w-40 rounded-xl border border-gray-200 bg-white shadow-lg group-hover:block">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                </div>
                <Link href="/conta" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Minha conta
                </Link>
                <Link href="/conta/pedidos" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Meus pedidos
                </Link>
                <button
                  onClick={logout}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors">
              <User className="h-5 w-5" />
            </Link>
          )}

          <Link href="/carrinho" className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          <button
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mega menu (desktop) */}
      <CategoryMegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 md:hidden">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos..."
                autoFocus
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pl-9 text-sm text-gray-700 placeholder-gray-400 focus:border-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-300"
              />
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </form>
        </div>
      )}

      {/* Mobile hamburger menu */}
      {menuOpen && (
        <nav className="border-t border-gray-100 bg-white px-4 py-3 md:hidden">
          <div className="space-y-2">
            <Link
              href="/produtos"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              Produtos
            </Link>

            {/* Mobile search */}
            <form onSubmit={handleSearch} className="px-3 py-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pl-9 text-sm text-gray-700 placeholder-gray-400 focus:border-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-300"
                />
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </form>

            {/* Category accordion */}
            <div className="border-t border-gray-100 pt-2">
              <p className="px-3 py-1 text-xs font-semibold uppercase text-gray-400">Categorias</p>
              <CategoryAccordion onNavigate={() => setMenuOpen(false)} />
            </div>

            {/* Account links */}
            <div className="border-t border-gray-100 pt-2">
              {user ? (
                <>
                  <Link
                    href="/conta"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Minha conta
                  </Link>
                  <button
                    onClick={() => { logout(); setMenuOpen(false) }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
