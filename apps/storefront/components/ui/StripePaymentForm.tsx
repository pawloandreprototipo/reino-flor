'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Lock } from 'lucide-react'
import { getStripePromise } from '@/lib/stripe'
import { formatCurrency } from '@/lib/utils'

interface StripePaymentFormProps {
  clientSecret: string
  orderId: string
  amount: number
}

function CardForm({ clientSecret, orderId, amount }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const card = elements.getElement(CardElement)
    if (!card) return

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    })

    if (result.error) {
      setError(result.error.message ?? 'Erro ao processar pagamento')
      setLoading(false)
    } else if (result.paymentIntent?.status === 'succeeded') {
      router.push(`/pedido/${orderId}`)
    } else {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-violet-600" />
          <h2 className="font-bold text-gray-900">Dados do cartão</h2>
        </div>

        <div className="rounded-xl border border-gray-300 p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  '::placeholder': { color: '#9ca3af' },
                },
                invalid: { color: '#ef4444' },
              },
              hidePostalCode: true,
            }}
          />
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6">
        <div>
          <p className="text-sm text-gray-500">Total a pagar</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</p>
        </div>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex items-center gap-2 rounded-2xl bg-violet-600 px-8 py-4 text-sm font-bold text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          <Lock className="h-4 w-4" />
          {loading ? 'Processando...' : 'Pagar agora'}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" /> Pagamento seguro via Stripe
      </p>
    </form>
  )
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements stripe={getStripePromise()} options={{ clientSecret: props.clientSecret }}>
      <CardForm {...props} />
    </Elements>
  )
}
