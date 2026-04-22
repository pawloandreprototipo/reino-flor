// Mock do prisma
jest.mock('@reino-flor/database', () => ({
  prisma: {
    tenant: { findUnique: jest.fn() },
    user: { findUnique: jest.fn(), create: jest.fn() },
    refreshToken: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    store: { findFirst: jest.fn(), findUnique: jest.fn() },
    product: { findMany: jest.fn(), count: jest.fn(), create: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
    order: { findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    coupon: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    cartItem: { deleteMany: jest.fn() },
    orderItem: { groupBy: jest.fn() },
    storePage: { findUnique: jest.fn(), upsert: jest.fn() },
    payment: { findFirst: jest.fn(), upsert: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  },
}))
