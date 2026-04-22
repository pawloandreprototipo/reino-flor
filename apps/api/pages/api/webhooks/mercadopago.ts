import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { serverError } from '../../../lib/response'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { type, data } = req.body

    if (type === 'payment') {
      const paymentId = data?.id
      if (!paymentId) return res.status(400).json({ error: 'Missing payment id' })

      // Buscar status real no MP (em produção usaria o SDK)
      // Em mock, simulamos aprovação
      const isMock = !process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN === 'TEST-MOCK'

      if (isMock) {
        // Simula aprovação para testes
        const payment = await prisma.payment.findFirst({
          where: { providerRef: { contains: 'mp_mock' } },
          orderBy: { createdAt: 'desc' },
        })
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'PAID', paidAt: new Date() },
          })
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'CONFIRMED' },
          })
        }
        return res.status(200).json({ received: true })
      }

      // Produção: buscar pagamento no MP e atualizar
      const { Payment } = await import('mercadopago')
      const { MercadoPagoConfig } = await import('mercadopago')
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })
      const mpPayment = new Payment(client)
      const result = await mpPayment.get({ id: paymentId })

      const orderId = result.external_reference
      if (!orderId) return res.status(200).json({ received: true })

      const statusMap: Record<string, string> = {
        approved: 'PAID',
        rejected: 'FAILED',
        cancelled: 'CANCELLED',
        refunded: 'REFUNDED',
        pending: 'PENDING',
        in_process: 'PROCESSING',
      }

      const newStatus = statusMap[result.status ?? 'pending'] ?? 'PENDING'

      await prisma.payment.updateMany({
        where: { orderId },
        data: {
          status: newStatus as any,
          paidAt: newStatus === 'PAID' ? new Date() : undefined,
        },
      })

      if (newStatus === 'PAID') {
        await prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } })
      }
    }

    return res.status(200).json({ received: true })
  } catch (e) {
    return serverError(res, e)
  }
}
