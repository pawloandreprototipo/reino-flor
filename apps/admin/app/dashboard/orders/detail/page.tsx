'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useOrder, useUpdateOrder } from '@/hooks/useOrders'
import { Topbar } from '@/components/layout/Topbar'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'

interface Props { params: { id: string } }

export default function OrderDetailPage({ params }: Props) {
  const router = useRouter()
  const { data: order, isLoading } = useOrder(params.id)
  const updateOrder = useUpdateOrder(params.id)

  const handleStatusChange = async (status: string) => {
    await updateOrder.mutateAsync({ status })
  }

  if (isLoading) return <div className="p-6 text-gray-400">Carregando...</div>
  if (!order) return <div className="p-6 text-gray-400">Pedido não encontrado</div>

  return (
    <div className="flex flex-col">
      <Topbar title={`Pedido #${order.id.slice(-8).toUpperCase()}`} />
      <div className="p-6 max-w-3xl space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="flex items-center justify-between">
          <Badge label={ORDER_STATUS_LABELS[order.status]} className={ORDER_STATUS_COLORS[order.status]} />
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader><h2 className="text-sm font-semibold">Cliente</h2></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium text-gray-900">{order.user.name}</p>
              <p className="text-gray-500">{order.user.email}</p>
              <p className="text-gray-500">{formatDate(order.createdAt)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-sm font-semibold">Pagamento</h2></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Método: <span className="font-medium">{order.payment?.method ?? '-'}</span></p>
              <p>Status: <span className="font-medium">{order.payment?.status ?? '-'}</span></p>
              <p>Total: <span className="font-bold text-violet-700">{formatCurrency(Number(order.total))}</span></p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><h2 className="text-sm font-semibold">Itens do pedido</h2></CardHeader>
          <CardContent className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">Qtd: {item.quantity} × {formatCurrency(Number(item.price))}</p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(Number(item.total))}</p>
              </div>
            ))}
            <div className="flex justify-between pt-3 text-sm font-bold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
