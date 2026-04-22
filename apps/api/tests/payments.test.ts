import { createMocks } from 'node-mocks-http'
import { prisma } from '@reino-flor/database'
import { signAccessToken } from '@reino-flor/auth'
import createPaymentHandler from '../pages/api/payments/create'
import statusHandler from '../pages/api/payments/status'

const prismaMock = prisma as jest.Mocked<typeof prisma>

const clientToken = signAccessToken({
  sub: 'user-1',
  tenantId: 'tenant-1',
  role: 'CUSTOMER',
  email: 'cliente@teste.com',
})

const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  total: 98.52,
  status: 'PENDING',
  payment: null,
  user: { name: 'Cliente Teste', email: 'cliente@teste.com' },
  items: [{ id: 'item-1', quantity: 2, price: 45.9, product: { name: 'Girassol Amarelo' } }],
}

const mockPayment = {
  id: 'pay-1',
  orderId: 'order-1',
  provider: 'PIX',
  method: 'PIX',
  providerRef: 'mp_mock_123',
  amount: 98.52,
  status: 'PENDING',
  pixCode: '00020126...MOCK',
  pixExpiration: new Date(Date.now() + 30 * 60 * 1000),
  paidAt: null,
  createdAt: new Date(),
}

describe('POST /api/payments/create', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve retornar 401 sem token', async () => {
    const { req, res } = createMocks({ method: 'POST' })
    await createPaymentHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(401)
  })

  it('deve retornar 400 para método inválido', async () => {
    ;(prismaMock.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: `Bearer ${clientToken}` },
      body: { orderId: 'order-1', method: 'METODO_INVALIDO' },
    })
    await createPaymentHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(400)
  })

  it('deve criar pagamento PIX com sucesso', async () => {
    ;(prismaMock.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)
    ;(prismaMock.payment.upsert as jest.Mock).mockResolvedValue(mockPayment)

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: `Bearer ${clientToken}` },
      body: { orderId: 'order-1', method: 'PIX' },
    })
    await createPaymentHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(200)

    const data = res._getJSONData()
    expect(data.success).toBe(true)
    expect(data.data.method).toBe('PIX')
    expect(data.data.pixCode).toBeTruthy()
    expect(data.data.amount).toBe(98.52)
  })

  it('deve criar pagamento com cartão (Stripe) com sucesso', async () => {
    ;(prismaMock.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)
    ;(prismaMock.payment.upsert as jest.Mock).mockResolvedValue({
      ...mockPayment, method: 'CREDIT_CARD', provider: 'STRIPE',
    })

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: `Bearer ${clientToken}` },
      body: { orderId: 'order-1', method: 'CREDIT_CARD' },
    })
    await createPaymentHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(200)

    const data = res._getJSONData()
    expect(data.data.clientSecret).toBeTruthy()
    expect(data.data.method).toBe('CREDIT_CARD')
  })

  it('deve retornar 404 para pedido inexistente', async () => {
    ;(prismaMock.order.findFirst as jest.Mock).mockResolvedValue(null)

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: `Bearer ${clientToken}` },
      body: { orderId: 'nao-existe', method: 'PIX' },
    })
    await createPaymentHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(404)
  })

  it('deve retornar 400 para pedido já pago', async () => {
    ;(prismaMock.order.findFirst as jest.Mock).mockResolvedValue({
      ...mockOrder,
      payment: { ...mockPayment, status: 'PAID' },
    })

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: `Bearer ${clientToken}` },
      body: { orderId: 'order-1', method: 'PIX' },
    })
    await createPaymentHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(400)
  })
})

describe('GET /api/payments/status', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve retornar status do pagamento', async () => {
    ;(prismaMock.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)

    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: `Bearer ${clientToken}` },
      query: { orderId: 'order-1' },
    })
    await statusHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(200)

    const data = res._getJSONData()
    expect(data.data.status).toBe('PENDING')
    expect(data.data.method).toBe('PIX')
  })

  it('deve retornar 404 para pagamento inexistente', async () => {
    ;(prismaMock.payment.findFirst as jest.Mock).mockResolvedValue(null)

    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: `Bearer ${clientToken}` },
      query: { orderId: 'nao-existe' },
    })
    await statusHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(404)
  })
})
