import { createMocks } from 'node-mocks-http'
import { prisma } from '@reino-flor/database'
import { signAccessToken } from '@reino-flor/auth'
import productsHandler from '../pages/api/products/index'

const prismaMock = prisma as jest.Mocked<typeof prisma>

const adminToken = signAccessToken({
  sub: 'user-1',
  tenantId: 'tenant-1',
  role: 'ADMIN',
  email: 'admin@reinoflor.com',
})

const mockStore = { id: 'store-1', tenantId: 'tenant-1', slug: 'reino-flor-store', active: true }

describe('GET /api/products', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve retornar 401 sem token', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await productsHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(401)
  })

  it('deve retornar lista de produtos', async () => {
    ;(prismaMock.store.findFirst as jest.Mock).mockResolvedValue(mockStore)
    ;(prismaMock.product.findMany as jest.Mock).mockResolvedValue([
      { id: 'p1', name: 'Rosa', slug: 'rosa', price: 89.9, status: 'ACTIVE', images: [], category: null, inventory: null, _count: { reviews: 0 } },
    ])
    ;(prismaMock.product.count as jest.Mock).mockResolvedValue(1)

    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: `Bearer ${adminToken}` },
    })
    await productsHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(200)

    const data = res._getJSONData()
    expect(data.success).toBe(true)
    expect(data.data.products).toHaveLength(1)
    expect(data.data.total).toBe(1)
  })
})

describe('POST /api/products', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve retornar 400 para slug inválido', async () => {
    ;(prismaMock.store.findFirst as jest.Mock).mockResolvedValue(mockStore)

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}` },
      body: { name: 'Rosa', slug: 'Rosa Inválida', price: 89.9 },
    })
    await productsHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(400)
  })

  it('deve criar produto com sucesso', async () => {
    ;(prismaMock.store.findFirst as jest.Mock).mockResolvedValue(mockStore)
    ;(prismaMock.product.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prismaMock.product.create as jest.Mock).mockResolvedValue({
      id: 'p1', name: 'Rosa', slug: 'rosa', price: 89.9, status: 'DRAFT',
      images: [], category: null, inventory: { quantity: 0 },
    })

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: `Bearer ${adminToken}` },
      body: { name: 'Rosa', slug: 'rosa', price: 89.9 },
    })
    await productsHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(201)
    expect(res._getJSONData().data.slug).toBe('rosa')
  })
})
