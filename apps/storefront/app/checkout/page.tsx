'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { formatCurrency, STORE_SLUG } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  zipCode: z.string().min(8, 'CEP inválido'),
  street: z.string().min(3, 'Endereço obrigatório'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  district: z.string().min(2, 'Bairro obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().length(2, 'UF inválida'),
  paymentMethod: z.enum(['PIX', 'CREDIT_CARD', 'BOLETO']),
  couponCode: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const { user, isLoggedIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const SHIPPING = 15.9

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      paymentMethod: 'PIX',
    },
  })

  if (items.length === 0) {
    router.push('/carrinho')
    return null
  }

  const onSubmit = async (data: FormData) => {
    if (!isLoggedIn) {
      router.push('/login?redirect=/checkout')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/api/orders/checkout', {
        storeSlug: STORE_SLUG,
        items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        paymentMethod: data.paymentMethod,
        shippingCost: SHIPPING,
        couponCode: data.couponCode || undefined,
      })
      clearCart()
      router.push(`/pedido/${res.data.data.id}`)
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Erro ao finalizar pedido')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (err?: string) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${err ? 'border-red-400 bg-red-50' : 'border-gray-300'}`

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Formulário */}
        <div className="lg:col-span-2 space-y-6">

          {/* Dados pessoais */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Dados pessoais</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome completo</label>
                <input className={inputClass(errors.name?.message)} {...register('name')} />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
                <input type="email" className={inputClass(errors.email?.message)} {...register('email')} />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Telefone</label>
                <input className={inputClass(errors.phone?.message)} placeholder="(11) 99999-9999" {...register('phone')} />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Endereço de entrega</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">CEP</label>
                <input className={inputClass(errors.zipCode?.message)} placeholder="00000-000" {...register('zipCode')} />
                {errors.zipCode && <p className="mt-1 text-xs text-red-600">{errors.zipCode.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Rua</label>
                <input className={inputClass(errors.street?.message)} {...register('street')} />
                {errors.street && <p className="mt-1 text-xs text-red-600">{errors.street.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Número</label>
                <input className={inputClass(errors.number?.message)} {...register('number')} />
                {errors.number && <p className="mt-1 text-xs text-red-600">{errors.number.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Complemento</label>
                <input className={inputClass()} placeholder="Apto, bloco..." {...register('complement')} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Bairro</label>
                <input className={inputClass(errors.district?.message)} {...register('district')} />
                {errors.district && <p className="mt-1 text-xs text-red-600">{errors.district.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Cidade</label>
                <input className={inputClass(errors.city?.message)} {...register('city')} />
                {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Estado (UF)</label>
                <input className={inputClass(errors.state?.message)} placeholder="SP" maxLength={2} {...register('state')} />
                {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>}
              </div>
            </div>
          </div>

          {/* Pagamento */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Pagamento</h2>
            <div className="grid grid-cols-3 gap-3">
              {(['PIX', 'CREDIT_CARD', 'BOLETO'] as const).map((method) => (
                <label key={method} className="cursor-pointer">
                  <input type="radio" value={method} className="sr-only" {...register('paymentMethod')} />
                  <div className={`rounded-xl border-2 p-3 text-center text-sm font-medium transition-colors ${
                    errors.paymentMethod ? 'border-red-300' : 'border-gray-200 hover:border-violet-400'
                  }`}>
                    {method === 'PIX' ? '🔑 PIX' : method === 'CREDIT_CARD' ? '💳 Cartão' : '📄 Boleto'}
                  </div>
                </label>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cupom de desconto</label>
              <input className={inputClass()} placeholder="BEMVINDO10" {...register('couponCode')} />
            </div>
          </div>

        </div>

        {/* Resumo */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 h-fit space-y-4">
          <h2 className="font-bold text-gray-900">Resumo do pedido</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate mr-2">{item.name} ×{item.quantity}</span>
                <span className="font-medium whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Frete</span><span>{formatCurrency(SHIPPING)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
              <span>Total</span><span>{formatCurrency(subtotal + SHIPPING)}</span>
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-violet-600 py-4 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Processando...' : `Confirmar pedido • ${formatCurrency(subtotal + SHIPPING)}`}
          </button>
        </div>
      </form>
    </div>
  )
}
