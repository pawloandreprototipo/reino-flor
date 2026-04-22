'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Clock, XCircle, Copy, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface PaymentStatusProps {
  orderId: string
}

const STATUS_CONFIG = {
  PENDING: { label: 'Aguardando pagamento', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  PROCESSING: { label: 'Processando', icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
  PAID: { label: 'Pago!', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  FAILED: { label: 'Falhou', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  CANCELLED: { label: 'Cancelado', icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50' },
  REFUNDED: { label: 'Reembolsado', icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-50' },
}

export function PaymentStatus({ orderId }: PaymentStatusProps) {
  const [copied, setCopied] = useState(false)

  const { data: payment, refetch } = useQuery({
    queryKey: ['payment-status', orderId],
    queryFn: async () => {
      const { data } = await api.get(`/api/payments/status?orderId=${orderId}`)
      return data.data
    },
    refetchInterval: (data) => data?.status === 'PENDING' ? 5000 : false,
  })

  const config = STATUS_CONFIG[payment?.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING
  const Icon = config.icon

  const copyPixCode = () => {
    if (!payment?.pixCode) return
    navigator.clipboard.writeText(payment.pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!payment) return null

  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div className={`flex items-center gap-3 rounded-2xl p-4 ${config.bg}`}>
        <Icon className={`h-6 w-6 ${config.color} ${payment.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
        <div>
          <p className={`font-bold ${config.color}`}>{config.label}</p>
          <p className="text-sm text-gray-500">{formatCurrency(Number(payment.amount))}</p>
        </div>
        {payment.status === 'PENDING' && (
          <button
            onClick={() => refetch()}
            className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600"
            title="Verificar status"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* PIX Code */}
      {payment.method === 'PIX' && payment.status === 'PENDING' && payment.pixCode && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 space-y-3">
          <p className="text-sm font-bold text-violet-900">Pague via PIX</p>
          <p className="text-xs text-violet-700">
            Copie o código abaixo e cole no seu banco para pagar
          </p>

          <div className="rounded-xl bg-white p-3 font-mono text-xs text-gray-700 break-all border border-violet-200">
            {payment.pixCode}
          </div>

          <button
            onClick={copyPixCode}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${
              copied ? 'bg-green-500 text-white' : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copiado!' : 'Copiar código PIX'}
          </button>

          {payment.pixExpiration && (
            <p className="text-center text-xs text-violet-600">
              Expira em: {new Date(payment.pixExpiration).toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
      )}

      {/* Pago */}
      {payment.status === 'PAID' && (
        <div className="rounded-2xl bg-green-50 p-4 text-center">
          <p className="text-sm font-medium text-green-700">
            Pagamento confirmado em {payment.paidAt
              ? new Date(payment.paidAt).toLocaleString('pt-BR')
              : 'agora'}
          </p>
        </div>
      )}
    </div>
  )
}
