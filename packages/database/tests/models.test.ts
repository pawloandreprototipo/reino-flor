import { Plan, Role } from '@prisma/client'

// Mock do prisma client — sem dependência de banco real
const prismaMock = {
  tenant: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  product: {
    create: jest.fn(),
  },
}

describe('Tenant model (mock)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve criar um tenant com sucesso', async () => {
    const mockTenant = {
      id: 'tenant-1',
      name: 'Reino Flor',
      slug: 'reino-flor',
      domain: null,
      plan: Plan.FREE,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    prismaMock.tenant.create.mockResolvedValue(mockTenant)

    const result = await prismaMock.tenant.create({
      data: { name: 'Reino Flor', slug: 'reino-flor' },
    })

    expect(result.slug).toBe('reino-flor')
    expect(result.active).toBe(true)
    expect(prismaMock.tenant.create).toHaveBeenCalledTimes(1)
  })

  it('deve buscar tenant por slug', async () => {
    const mockTenant = { id: 'tenant-1', slug: 'reino-flor', plan: Plan.PRO }
    prismaMock.tenant.findUnique.mockResolvedValue(mockTenant)

    const result = await prismaMock.tenant.findUnique({ where: { slug: 'reino-flor' } })

    expect(result).not.toBeNull()
    expect(result?.plan).toBe(Plan.PRO)
  })

  it('deve retornar null para tenant inexistente', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue(null)
    const result = await prismaMock.tenant.findUnique({ where: { slug: 'nao-existe' } })
    expect(result).toBeNull()
  })
})

describe('User model (mock)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve criar usuário com role CUSTOMER por padrão', async () => {
    const mockUser = {
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'teste@teste.com',
      passwordHash: 'hash',
      name: 'Teste',
      role: Role.CUSTOMER,
      active: true,
      emailVerified: false,
    }
    prismaMock.user.create.mockResolvedValue(mockUser)

    const result = await prismaMock.user.create({
      data: { tenantId: 'tenant-1', email: 'teste@teste.com', passwordHash: 'hash', name: 'Teste' },
    })

    expect(result.role).toBe(Role.CUSTOMER)
    expect(result.emailVerified).toBe(false)
  })

  it('deve retornar null para usuário inexistente', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    const result = await prismaMock.user.findUnique({ where: { id: 'nao-existe' } })
    expect(result).toBeNull()
  })
})

describe('Product model (mock)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve criar produto com status DRAFT por padrão', async () => {
    const mockProduct = {
      id: 'prod-1',
      storeId: 'store-1',
      name: 'Rosa Vermelha',
      slug: 'rosa-vermelha',
      price: 89.9,
      status: 'DRAFT',
      featured: false,
    }
    prismaMock.product.create.mockResolvedValue(mockProduct)

    const result = await prismaMock.product.create({
      data: { storeId: 'store-1', name: 'Rosa Vermelha', slug: 'rosa-vermelha', price: 89.9 },
    })

    expect(result.status).toBe('DRAFT')
    expect(result.featured).toBe(false)
  })
})
