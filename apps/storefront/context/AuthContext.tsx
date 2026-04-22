'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { api } from '@/lib/api'
import { TENANT_SLUG } from '@/lib/utils'

interface User { id: string; name: string; email: string; role: string }

interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem('sf_user')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/api/auth/login', { email, password, tenantSlug: TENANT_SLUG })
      localStorage.setItem('sf_accessToken', data.data.accessToken)
      localStorage.setItem('sf_refreshToken', data.data.refreshToken)
      localStorage.setItem('sf_user', JSON.stringify(data.data.user))
      setUser(data.data.user)
      return true
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Erro ao fazer login')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sf_accessToken')
    localStorage.removeItem('sf_refreshToken')
    localStorage.removeItem('sf_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
