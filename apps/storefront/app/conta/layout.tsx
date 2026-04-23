'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { User, Package, MapPin } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const NAV_ITEMS = [
  { href: '/conta', label: 'Perfil', icon: User },
  { href: '/conta/pedidos', label: 'Pedidos', icon: Package },
  { href: '/conta/enderecos', label: 'Endereços', icon: MapPin },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [isLoggedIn, router, pathname])

  if (!isLoggedIn) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Minha conta</h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-4 border-b border-gray-100 pb-4">
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-violet-100 text-violet-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile tabs */}
        <nav className="flex gap-1 overflow-x-auto lg:hidden border-b border-gray-200 pb-2 mb-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-violet-100 text-violet-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
