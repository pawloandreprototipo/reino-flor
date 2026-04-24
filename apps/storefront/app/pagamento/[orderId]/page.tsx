'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { api } from '@/lib/api'
import { StripePaymentForm } from '@/components/ui/StripePaymentForm'

export default function PagamentoPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [amount, setAmount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    api.post('/api/payments/create', { orderId, method: 'CREDIT_CARD' })
      .then(({ data }) => {
        setClientSecret(data.data.clientSecret)
        setAmount(data.data.amount)
      })
      .catch((e: unknown) => {
        const err = e as { response?: { data?: { error?: string } } }
        setError(err.response?.data?.error ?? 'Erro ao iniciar pagamento')
      })
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-full bg-gray-200" />
        <p className="text-gray-400">Preparando pagamento...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold text-gray-900">Erro no pagamento</p>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <Link href="/carrinho" className="mt-4 inline-block text-violet-600 hover:underline">
          Voltar ao carrinho
        </Link>
      </div>
    )
  }

  if (!clientSecret) return null

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link href="/carrinho" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-violet-600">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
          <CreditCard className="h-8 w-8 text-violet-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamento com cartão</h1>
        <p className="mt-1 text-sm text-gray-500">Insira os dados do seu cartão para finalizar</p>
      </div>

      <StripePaymentForm clientSecret={clientSecret} orderId={orderId} amount={amount} />
    </div>
  )
}
