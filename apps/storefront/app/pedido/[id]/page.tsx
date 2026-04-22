'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Package, Clock } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PaymentStatus } from '@/components/ui/PaymentStatus'

export default function PedidoPage() {
  const { id } = useParams<{ id: string }>()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/${id}`)
      return data.data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="h-16 w-16 mx-auto animate-pulse rounded-full bg-gray-200" />
        <p className="mt-4 text-gray-400">Carregando pedido...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-gray-400">Pedido não encontrado</p>
        <Link href="/" className="mt-4 inline-block text-violet-600 hover:underline">Voltar ao início</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Pedido confirmado!</h1>
        <p className="mt-2 text-gray-500">
          Obrigado pela sua compra. Você receberá um e-mail de confirmação em breve.
        </p>
        <p className="mt-1 font-mono text-sm text-gray-400">
          #{order.id.slice(-8).toUpperCase()}
        </p>
      </div>

      {/* Status */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <Clock className="h-5 w-5 text-yellow-500" />
        <div>
          <p className="text-sm font-semibold text-gray-900">Status: {order.status === 'PENDING' ? 'Aguardando pagamento' : order.status}</p>
          <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Itens */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-6">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-4 w-4" /> Itens do pedido
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400">Qtd: {item.quantity} × {formatCurrency(Number(item.price))}</p>
              </div>
              <p className="text-sm font-bold">{formatCurrency(Number(item.total))}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span>{formatCurrency(Number(order.subtotal))}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto</span><span>-{formatCurrency(Number(order.discount))}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Frete</span><span>{formatCurrency(Number(order.shippingCost))}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
            <span>Total</span><span>{formatCurrency(Number(order.total))}</span>
          </div>
        </div>
      </div>

      {/* Pagamento PIX */}
      {order.payment?.method === 'PIX' && (
        <PaymentStatus orderId={order.id} />
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/produtos" className="flex-1 rounded-2xl border border-gray-300 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
          Continuar comprando
        </Link>
        <Link href="/" className="flex-1 rounded-2xl bg-violet-600 py-3 text-center text-sm font-bold text-white hover:bg-violet-700">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
