import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getStripe } from '../../../lib/payments/stripe'
import { serverError } from '../../../lib/response'
import { fulfillStock } from '../../../lib/inventory'

export const config = { api: { bodyParser: false } }

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_MOCK'

  let event: any

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (e: any) {
    console.error('Stripe webhook error:', e.message)
    return res.status(400).json({ error: `Webhook Error: ${e.message}` })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object
        const orderId = intent.metadata?.orderId
        if (!orderId) break

        // Check if already fulfilled to avoid double fulfillment
        const existingOrder = await prisma.order.findUnique({ where: { id: orderId } })
        if (existingOrder?.status === 'CONFIRMED') break

        // Fetch order items for stock fulfillment
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId },
          select: { productId: true, quantity: true },
        })

        await prisma.$transaction(async (tx) => {
          await tx.payment.updateMany({
            where: { providerRef: intent.id },
            data: { status: 'PAID', paidAt: new Date() },
          })

          await tx.order.updateMany({
            where: { id: orderId },
            data: { status: 'CONFIRMED' },
          })

          if (orderItems.length > 0) {
            await fulfillStock(orderId, orderItems, tx)
          }
        })
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object
        await prisma.payment.updateMany({
          where: { providerRef: intent.id },
          data: { status: 'FAILED' },
        })
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object
        const intent = charge.payment_intent
        if (intent) {
          await prisma.payment.updateMany({
            where: { providerRef: String(intent) },
            data: { status: 'REFUNDED' },
          })
        }
        break
      }
    }

    return res.status(200).json({ received: true })
  } catch (e) {
    return serverError(res, e)
  }
}
