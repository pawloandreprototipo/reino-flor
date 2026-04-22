import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getStripe } from '../../../lib/payments/stripe'
import { serverError } from '../../../lib/response'

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

        await prisma.payment.updateMany({
          where: { providerRef: intent.id },
          data: { status: 'PAID', paidAt: new Date() },
        })

        await prisma.order.updateMany({
          where: { id: orderId },
          data: { status: 'CONFIRMED' },
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
