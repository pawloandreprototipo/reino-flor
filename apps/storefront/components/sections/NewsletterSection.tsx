'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { STORE_SLUG } from '@/lib/utils'

interface NewsletterProps {
  title: string
  subtitle: string
}

export function NewsletterSection({ title, subtitle }: NewsletterProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      await api.post('/api/storefront/subscribe', { email, storeSlug: STORE_SLUG })
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="bg-violet-600 py-16">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        <p className="mt-3 text-violet-100">{subtitle}</p>
        {status === 'success' ? (
          <p className="mt-6 rounded-xl bg-white/20 px-6 py-4 text-white font-medium">
            ✅ Cadastrado com sucesso! Verifique seu e-mail.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com.br"
              required
              className="flex-1 rounded-xl border-0 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-violet-700 hover:bg-violet-50 transition-colors disabled:opacity-60"
            >
              {status === 'loading' ? 'Enviando...' : 'Quero desconto!'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="mt-2 text-sm text-rose-200">Erro ao cadastrar. Tente novamente.</p>
        )}
      </div>
    </section>
  )
}
