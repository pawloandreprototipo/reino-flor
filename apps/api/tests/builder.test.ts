import { createMocks } from 'node-mocks-http'
import { prisma } from '@reino-flor/database'
import { signAccessToken } from '@reino-flor/auth'
import builderHandler from '../pages/api/builder/page'

const prismaMock = prisma as jest.Mocked<typeof prisma>

const adminToken = signAccessToken({
  sub: 'user-1',
  tenantId: 'tenant-1',
  role: 'ADMIN',
  email: 'admin@reinoflor.com',
})

const mockStore = { id: 'store-1', tenantId: 'tenant-1', slug: 'reino-flor-store', active: true }

const mockSections = [
  { id: 'hero-1', type: 'hero', order: 0, props: { title: 'Flores', subtitle: 'Sub', buttonText: 'Ver', buttonUrl: '/produtos' } },
  { id: 'products-1', type: 'product_grid', order: 1, props: { title: 'Destaques', limit: 6 } },
]

describe('GET /api/builder/page', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve retornar 401 sem token', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await builderHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(401)
  })

  it('deve retornar seções da página', async () => {
    ;(prismaMock.store.findFirst as jest.Mock).mockResolvedValue(mockStore)
    ;(prismaMock.storePage.findUnique as jest.Mock).mockResolvedValue({
      id: 'page-1', storeId: 'store-1', slug: 'home', sections: mockSections,
    })

    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: `Bearer ${adminToken}` },
      query: { pageSlug: 'home' },
    })
    await builderHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(200)
  })
})

describe('PUT /api/builder/page', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve salvar seções com sucesso', async () => {
    ;(prismaMock.store.findFirst as jest.Mock).mockResolvedValue(mockStore)
    ;(prismaMock.storePage.upsert as jest.Mock).mockResolvedValue({
      id: 'page-1', storeId: 'store-1', slug: 'home', sections: mockSections,
    })

    const { req, res } = createMocks({
      method: 'PUT',
      headers: { authorization: `Bearer ${adminToken}` },
      body: { pageSlug: 'home', sections: mockSections },
    })
    await builderHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(200)
    expect(prismaMock.storePage.upsert).toHaveBeenCalledTimes(1)
  })

  it('deve retornar 400 para tipo de seção inválido', async () => {
    ;(prismaMock.store.findFirst as jest.Mock).mockResolvedValue(mockStore)

    const { req, res } = createMocks({
      method: 'PUT',
      headers: { authorization: `Bearer ${adminToken}` },
      body: {
        pageSlug: 'home',
        sections: [{ id: 'x-1', type: 'tipo-invalido', order: 0, props: {} }],
      },
    })
    await builderHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(400)
  })

  it('deve reordenar seções corretamente', async () => {
    ;(prismaMock.store.findFirst as jest.Mock).mockResolvedValue(mockStore)

    const reordered = [
      { id: 'products-1', type: 'product_grid', order: 0, props: { title: 'Destaques', limit: 6 } },
      { id: 'hero-1', type: 'hero', order: 1, props: { title: 'Flores', subtitle: 'Sub', buttonText: 'Ver', buttonUrl: '/produtos' } },
    ]

    ;(prismaMock.storePage.upsert as jest.Mock).mockResolvedValue({
      id: 'page-1', storeId: 'store-1', slug: 'home', sections: reordered,
    })

    const { req, res } = createMocks({
      method: 'PUT',
      headers: { authorization: `Bearer ${adminToken}` },
      body: { pageSlug: 'home', sections: reordered },
    })
    await builderHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(200)

    const saved = (prismaMock.storePage.upsert as jest.Mock).mock.calls[0][0]
    expect(saved.update.sections[0].type).toBe('product_grid')
    expect(saved.update.sections[1].type).toBe('hero')
  })
})
