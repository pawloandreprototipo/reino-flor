'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

export async function getServerSession(): Promise<AuthUser | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('accessToken')?.value
  if (!token) return null

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const { data } = await res.json()
    return data
  } catch {
    return null
  }
}

export async function requireAuth() {
  const user = await getServerSession()
  if (!user) redirect('/login')
  return user
}
