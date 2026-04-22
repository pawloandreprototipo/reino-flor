'use client'

import Link from 'next/link'
import { ShoppingCart, Search, User, Flower2, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'

export function Navbar() {
  const { itemCount } = useCart()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
            <Flower2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Reino Flor</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/produtos" className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors">
            Produtos
          </Link>
          <Link href="/produtos?categoria=flores" className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors">
            Flores
          </Link>
          <Link href="/produtos?categoria=vasos" className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors">
            Vasos
          </Link>
        </nav>

        {/* Ações */}
        <div className="flex items-center gap-3">
          <Link href="/produtos" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors">
            <Search className="h-5 w-5" />
          </Link>

          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-1 rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <User className="h-5 w-5" />
              </button>
              <div className="absolute right-0 top-full mt-1 hidden w-40 rounded-xl border border-gray-200 bg-white shadow-lg group-hover:block">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                </div>
                <button
                  onClick={logout}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
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
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <nav className="border-t border-gray-100 bg-white px-4 py-3 md:hidden">
          <ul className="space-y-2">
            {['Produtos', 'Flores', 'Vasos'].map((item) => (
              <li key={item}>
                <Link
                  href={`/produtos${item !== 'Produtos' ? `?categoria=${item.toLowerCase()}` : ''}`}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMenuOpen(false)}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
