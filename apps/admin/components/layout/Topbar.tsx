'use client'

import { Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  const { getUser } = useAuth()
  const user = getUser()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name ?? 'Admin'}</p>
            <p className="text-xs text-gray-500">{user?.role ?? ''}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
