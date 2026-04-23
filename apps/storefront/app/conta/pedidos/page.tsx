'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'
import { useOrders, type OrderStatus } from '@/hooks/useOrders'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmado', className: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'Processando', className: 'bg-indigo-100 text-indigo-700' },
  SHIPPED: { label: 'Enviado', className: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Entregue', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Reembolsado', className: 'bg-gray-100 text-gray-700' },
}

export default function OrdersPage() {
  const { data: orders, isLoading } = useOrders()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center">
        <Package className="mb-4 h-16 w-16 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-700">Nenhum pedido encontrado</h2>
        <p className="mt-1 text-sm text-gray-500">Você ainda não fez nenhum pedido.</p>
        <Link
          href="/produtos"
          className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
        >
          Ver produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Meus pedidos</h2>

      {orders.map((order) => {
        const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
        return (
          <Link
            key={order.id}
            href={`/pedido/${order.id}`}
            className="block rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Pedido #{order.id.slice(0, 8)}
                </p>
                <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-sm text-gray-500">
                {order.itemCount} {order.itemCount === 1 ? 'item' : 'itens'}
              </p>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(order.total))}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
