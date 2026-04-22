'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface LoginData { email: string; password: string; tenantSlug: string }

export function useAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (data: LoginData) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/api/auth/login', data)
      const { accessToken, refreshToken, user } = res.data.data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
      document.cookie = `accessToken=${accessToken}; path=/; max-age=604800`
      router.push('/dashboard')
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }, [router])

  const logout = useCallback(() => {
    localStorage.clear()
    document.cookie = 'accessToken=; path=/; max-age=0'
    router.push('/login')
  }, [router])

  const getUser = useCallback(() => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  }, [])

  return { login, logout, getUser, loading, error }
}
