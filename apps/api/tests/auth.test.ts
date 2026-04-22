import { createMocks } from 'node-mocks-http'
import { prisma } from '@reino-flor/database'
import loginHandler from '../pages/api/auth/login'
import registerHandler from '../pages/api/auth/register'

const prismaMock = prisma as jest.Mocked<typeof prisma>

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve retornar 405 para método GET', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await loginHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(405)
  })

  it('deve retornar 400 para body inválido', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { email: 'invalido', password: '' },
    })
    await loginHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(400)
  })

  it('deve retornar 401 para tenant inexistente', async () => {
    ;(prismaMock.tenant.findUnique as jest.Mock).mockResolvedValue(null)

    const { req, res } = createMocks({
      method: 'POST',
      body: { email: 'admin@reinoflor.com', password: 'Admin123', tenantSlug: 'nao-existe' },
    })
    await loginHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(401)
  })

  it('deve retornar 401 para credenciais inválidas', async () => {
    ;(prismaMock.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 't1', active: true })
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)

    const { req, res } = createMocks({
      method: 'POST',
      body: { email: 'nao@existe.com', password: 'Admin123', tenantSlug: 'reino-flor' },
    })
    await loginHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(401)
  })
})

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve retornar 400 para senha fraca', async () => {
    ;(prismaMock.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 't1', active: true })

    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'Teste', email: 'teste@teste.com', password: 'fraca', tenantSlug: 'reino-flor' },
    })
    await registerHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(400)
  })

  it('deve retornar 409 para email já cadastrado', async () => {
    ;(prismaMock.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 't1', active: true })
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', email: 'teste@teste.com' })

    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'Teste', email: 'teste@teste.com', password: 'Senha123', tenantSlug: 'reino-flor' },
    })
    await registerHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(409)
  })

  it('deve retornar 201 para registro válido', async () => {
    ;(prismaMock.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 't1', active: true })
    ;(prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prismaMock.user.create as jest.Mock).mockResolvedValue({
      id: 'u1', name: 'Novo', email: 'novo@teste.com', role: 'CUSTOMER', tenantId: 't1',
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'Novo', email: 'novo@teste.com', password: 'Senha123', tenantSlug: 'reino-flor' },
    })
    await registerHandler(req as any, res as any)
    expect(res._getStatusCode()).toBe(201)

    const data = res._getJSONData()
    expect(data.success).toBe(true)
    expect(data.data.accessToken).toBeTruthy()
    expect(data.data.refreshToken).toBeTruthy()
  })
})
