import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

let _client: MercadoPagoConfig | null = null

function getMPClient(): MercadoPagoConfig {
  if (!_client) {
    const token = process.env.MP_ACCESS_TOKEN
    if (!token || token === 'TEST-MOCK') {
      return createMPMock() as any
    }
    _client = new MercadoPagoConfig({ accessToken: token })
  }
  return _client
}

function createMPMock(): any {
  return { _mock: true }
}

export interface CreatePixParams {
  amount: number
  orderId: string
  payerEmail: string
  payerName: string
  description: string
}

export async function createPixPayment(params: CreatePixParams) {
  const client = getMPClient()

  if ((client as any)._mock) {
    // Mock PIX para desenvolvimento
    return {
      id: `mp_mock_${Date.now()}`,
      status: 'pending',
      pixCode: `00020126580014BR.GOV.BCB.PIX0136${params.orderId}5204000053039865802BR5913Reino Flor6009SAO PAULO62070503***6304MOCK`,
      pixQrCode: `data:image/png;base64,MOCK_QR_CODE`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    }
  }

  const payment = new Payment(client)
  const result = await payment.create({
    body: {
      transaction_amount: params.amount,
      description: params.description,
      payment_method_id: 'pix',
      payer: {
        email: params.payerEmail,
        first_name: params.payerName.split(' ')[0],
        last_name: params.payerName.split(' ').slice(1).join(' '),
      },
      external_reference: params.orderId,
    },
  })

  return {
    id: String(result.id),
    status: result.status,
    pixCode: result.point_of_interaction?.transaction_data?.qr_code,
    pixQrCode: result.point_of_interaction?.transaction_data?.qr_code_base64,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  }
}

export interface CreateMPPreferenceParams {
  orderId: string
  items: { title: string; quantity: number; unit_price: number }[]
  payerEmail: string
  backUrls: { success: string; failure: string; pending: string }
}

export async function createMPPreference(params: CreateMPPreferenceParams) {
  const client = getMPClient()

  if ((client as any)._mock) {
    return {
      id: `pref_mock_${Date.now()}`,
      initPoint: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_${params.orderId}`,
    }
  }

  const preference = new Preference(client)
  const result = await preference.create({
    body: {
      items: params.items.map((item, idx) => ({ id: String(idx + 1), ...item })),
      payer: { email: params.payerEmail },
      external_reference: params.orderId,
      back_urls: params.backUrls,
      auto_return: 'approved',
    },
  })

  return {
    id: result.id,
    initPoint: result.init_point,
  }
}
