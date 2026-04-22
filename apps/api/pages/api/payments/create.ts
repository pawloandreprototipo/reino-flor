import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '../../../lib/prisma'
import { withAuth, AuthenticatedRequest } from '../../../middleware/auth'
import { ok, badRequest, notFound, serverError } from '../../../lib/response'
import { createStripePaymentIntent } from '../../../lib/payments/stripe'
import { createPixPayment, createMPPreference } from '../../../lib/payments/mercadopago'

const schema = z.object({
  orderId: z.string(),
  method: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO', 'WALLET']),
  provider: z.enum(['STRIPE', 'MERCADO_PAGO', 'PIX']).optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { user } = req as AuthenticatedRequest

  try {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

    const { orderId, method } = parsed.data

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.sub },
      include: {
        payment: true,
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    })

    if (!order) return notFound(res, 'Pedido não encontrado')
    if (order.payment?.status === 'PAID') return badRequest(res, 'Pedido já pago')

    const amount = Number(order.total)

    // PIX via Mercado Pago
    if (method === 'PIX') {
      const pix = await createPixPayment({
        amount,
        orderId: order.id,
        payerEmail: order.user.email,
        payerName: order.user.name,
        description: `Pedido Reino Flor #${order.id.slice(-8).toUpperCase()}`,
      })

      const payment = await prisma.payment.upsert({
        where: { orderId: order.id },
        update: {
          provider: 'PIX',
          method: 'PIX',
          providerRef: pix.id,
          pixCode: pix.pixCode,
          pixExpiration: pix.expiresAt,
          status: 'PENDING',
        },
        create: {
          orderId: order.id,
          provider: 'PIX',
          method: 'PIX',
          providerRef: pix.id,
          amount,
          pixCode: pix.pixCode,
          pixExpiration: pix.expiresAt,
          status: 'PENDING',
        },
      })

      return ok(res, {
        paymentId: payment.id,
        method: 'PIX',
        pixCode: pix.pixCode,
        pixQrCode: pix.pixQrCode,
        expiresAt: pix.expiresAt,
        amount,
      })
    }

    // Cartão via Stripe
    if (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
      const intent = await createStripePaymentIntent({
        amount,
        orderId: order.id,
        customerEmail: order.user.email,
      })

      const payment = await prisma.payment.upsert({
        where: { orderId: order.id },
        update: {
          provider: 'STRIPE',
          method,
          providerRef: intent.paymentIntentId,
          status: 'PENDING',
        },
        create: {
          orderId: order.id,
          provider: 'STRIPE',
          method,
          providerRef: intent.paymentIntentId,
          amount,
          status: 'PENDING',
        },
      })

      return ok(res, {
        paymentId: payment.id,
        method,
        clientSecret: intent.clientSecret,
        amount,
      })
    }

    // Boleto / outros via Mercado Pago
    const preference = await createMPPreference({
      orderId: order.id,
      items: order.items.map(i => ({
        title: i.product.name,
        quantity: i.quantity,
        unit_price: Number(i.price),
      })),
      payerEmail: order.user.email,
      backUrls: {
        success: `${process.env.STOREFRONT_URL ?? 'http://localhost:3000'}/pedido/${order.id}`,
        failure: `${process.env.STOREFRONT_URL ?? 'http://localhost:3000'}/checkout`,
        pending: `${process.env.STOREFRONT_URL ?? 'http://localhost:3000'}/pedido/${order.id}`,
      },
    })

    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { provider: 'MERCADO_PAGO', method, providerRef: preference.id, status: 'PENDING' },
      create: { orderId: order.id, provider: 'MERCADO_PAGO', method, providerRef: preference.id, amount, status: 'PENDING' },
    })

    return ok(res, {
      paymentId: payment.id,
      method,
      redirectUrl: preference.initPoint,
      amount,
    })
  } catch (e) {
    return serverError(res, e)
  }
}

export default withAuth(handler)
