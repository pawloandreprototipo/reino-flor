// Mock do BullMQ e Redis para testes
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-mock-1' }),
    getJob: jest.fn().mockResolvedValue(null),
    close: jest.fn().mockResolvedValue(undefined),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}))

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
  }))
})

jest.mock('@reino-flor/database', () => ({
  prisma: {
    cartItem: { findMany: jest.fn() },
    order: { findFirst: jest.fn() },
    campaignSubscriber: { updateMany: jest.fn() },
    analyticsEvent: { create: jest.fn() },
  },
}))
