import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key || key === 'sk_test_MOCK') {
      // Retorna mock em desenvolvimento
      return createStripeMock()
    }
    _stripe = new Stripe(key, { apiVersion: '2024-06-20' })
  }
  return _stripe
}

function createStripeMock(): any {
  return {
    paymentIntents: {
      create: async (params: any) => ({
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_secret_${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
        status: 'requires_payment_method',
        metadata: params.metadata ?? {},
      }),
      retrieve: async (id: string) => ({
        id,
        status: 'succeeded',
        amount: 10000,
        metadata: {},
      }),
    },
    webhooks: {
      constructEvent: (payload: any, sig: string, secret: string) => {
        return JSON.parse(payload.toString())
      },
    },
  }
}

export interface CreatePaymentIntentParams {
  amount: number // em centavos
  currency?: string
  orderId: string
  customerEmail?: string
}

export async function createStripePaymentIntent(params: CreatePaymentIntentParams) {
  const stripe = getStripe()
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(params.amount * 100),
    currency: params.currency ?? 'brl',
    metadata: { orderId: params.orderId },
    receipt_email: params.customerEmail,
  })
  return {
    paymentIntentId: intent.id,
    clientSecret: (intent as any).client_secret,
  }
}
