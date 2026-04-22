import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

export const prismaMock = mockDeep<PrismaClient>()

jest.mock('../src/index', () => ({
  __esModule: true,
  prisma: prismaMock,
}))

beforeEach(() => {
  mockReset(prismaMock)
})
