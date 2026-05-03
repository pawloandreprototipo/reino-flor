import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { serverError } from '../../../lib/response'
import { fulfillStock } from '../../../lib/inventory'

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
          // Check if already fulfilled
          const existingOrder = await prisma.order.findUnique({ where: { id: payment.orderId } })
          if (existingOrder && existingOrder.status !== 'CONFIRMED') {
            const orderItems = await prisma.orderItem.findMany({
              where: { orderId: payment.orderId },
              select: { productId: true, quantity: true },
            })

            await prisma.$transaction(async (tx) => {
              await tx.payment.update({
                where: { id: payment.id },
                data: { status: 'PAID', paidAt: new Date() },
              })
              await tx.order.update({
                where: { id: payment.orderId },
                data: { status: 'CONFIRMED' },
              })
              if (orderItems.length > 0) {
                await fulfillStock(payment.orderId, orderItems, tx)
              }
            })
          }
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

      await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: { orderId },
          data: {
            status: newStatus as any,
            paidAt: newStatus === 'PAID' ? new Date() : undefined,
          },
        })

        if (newStatus === 'PAID') {
          // Check if already fulfilled
          const existingOrder = await tx.order.findUnique({ where: { id: orderId } })
          if (existingOrder && existingOrder.status !== 'CONFIRMED') {
            await tx.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } })

            const orderItems = await tx.orderItem.findMany({
              where: { orderId },
              select: { productId: true, quantity: true },
            })
            if (orderItems.length > 0) {
              await fulfillStock(orderId, orderItems, tx)
            }
          }
        }
      })
    }

    return res.status(200).json({ received: true })
  } catch (e) {
    return serverError(res, e)
  }
}
