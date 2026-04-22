/**
 * Preservation Property Tests — Platform Stability Fixes
 *
 * These tests capture the CURRENT working behavior that MUST be preserved
 * after the bug fixes are applied. They MUST PASS on unfixed code.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
import { createMocks } from 'node-mocks-http'
import { signAccessToken } from '@reino-flor/auth'
import { prisma } from '@reino-flor/database'
import {
  ok,
  badRequest,
  unauthorized as unauthorizedResponse,
  notFound,
  forbidden as forbiddenResponse,
  created,
  serverError,
} from '../lib/response'

// Mock the queues module BEFORE importing handlers that use it
const mockAnalyticsAdd = jest.fn().mockResolvedValue({})
const mockOrderConfirmationAdd = jest.fn().mockResolvedValue({})
jest.mock('../lib/queues', () => ({
  getAnalyticsQueue: () => ({ add: mockAnalyticsAdd }),
  getOrderConfirmationQueue: () => ({ add: mockOrderConfirmationAdd }),
}))

import trackHandler from '../pages/api/storefront/track'
import productsHandler from '../pages/api/products/index'

const prismaMock = prisma as jest.Mocked<typeof prisma>

// ─── Helpers ──────────────────────────────────────────────────────────────────

const adminPayload = {
  sub: 'user-1',
  tenantId: 'tenant-1',
  role: 'ADMIN' as const,
  email: 'admin@test.com',
}

const adminToken = signAccessToken(adminPayload)

const customerPayload = {
  sub: 'user-2',
  tenantId: 'tenant-1',
  role: 'CUSTOMER' as const,
  email: 'customer@test.com',
}

const customerToken = signAccessToken(customerPayload)

// ─── 1. Track endpoint HTTP contract preservation ─────────────────────────────
// Validates: Requirements 3.1

describe('Preservation — Track endpoint HTTP contract', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns HTTP 202 with { success: true } for a valid POST body', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        storeSlug: 'reino-flor-store',
        type: 'page_view',
        sessionId: 'sess-abc',
        data: { page: '/home' },
      },
    })

    await trackHandler(req as any, res as any)

    expect(res._getStatusCode()).toBe(202)
    expect(res._getJSONData()).toEqual({ success: true })
  })

  it('returns HTTP 400 with { success: false } when required fields are missing', async () => {
    // Missing storeSlug and type — zod validation fails
    const { req, res } = createMocks({
      method: 'POST',
      body: { data: { page: '/home' } },
    })

    await trackHandler(req as any, res as any)

    expect(res._getStatusCode()).toBe(400)
    expect(res._getJSONData()).toEqual({ success: false })
  })

  it('returns HTTP 202 even when the queue throws (fire-and-forget)', async () => {
    mockAnalyticsAdd.mockRejectedValueOnce(new Error('Redis down'))

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        storeSlug: 'reino-flor-store',
        type: 'page_view',
        sessionId: 'sess-xyz',
        data: {},
      },
    })

    await trackHandler(req as any, res as any)

    expect(res._getStatusCode()).toBe(202)
    expect(res._getJSONData()).toEqual({ success: true })
  })

  it('returns HTTP 405 for non-POST methods', async () => {
    const { req, res } = createMocks({ method: 'GET' })

    await trackHandler(req as any, res as any)

    expect(res._getStatusCode()).toBe(405)
  })
})

// ─── 2. Auth middleware preservation ──────────────────────────────────────────
// Validates: Requirements 3.5

describe('Preservation — Auth middleware', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when no Authorization header is present', async () => {
    // Products endpoint is auth-protected
    const { req, res } = createMocks({ method: 'GET' })

    await productsHandler(req as any, res as any)

    expect(res._getStatusCode()).toBe(401)
    const body = res._getJSONData()
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
  })

  it('returns 401 when Authorization header has no Bearer prefix', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: 'InvalidFormat token123' },
    })

    await productsHandler(req as any, res as any)

    expect(res._getStatusCode()).toBe(401)
  })

  it('returns 401 for an invalid/expired token', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: 'Bearer invalid.jwt.token' },
    })

    await productsHandler(req as any, res as any)

    expect(res._getStatusCode()).toBe(401)
  })

  it('allows access with a valid admin token', async () => {
    ;(prismaMock.store.findFirst as jest.Mock).mockResolvedValue({
      id: 'store-1',
      tenantId: 'tenant-1',
      slug: 'reino-flor-store',
      active: true,
    })
    ;(prismaMock.product.findMany as jest.Mock).mockResolvedValue([])
    ;(prismaMock.product.count as jest.Mock).mockResolvedValue(0)

    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: `Bearer ${adminToken}` },
    })

    await productsHandler(req as any, res as any)

    // Should NOT be 401 or 403 — the handler runs
    expect(res._getStatusCode()).toBe(200)
  })
})

// ─── 3. Response helpers preservation ─────────────────────────────────────────
// Validates: Requirements 3.6

describe('Preservation — Response helpers', () => {
  function makeMockRes() {
    const { res } = createMocks()
    return res
  }

  it('ok() returns status 200 with { success: true, data }', () => {
    const res = makeMockRes()
    ok(res as any, { items: [1, 2, 3] })

    expect(res._getStatusCode()).toBe(200)
    const body = res._getJSONData()
    expect(body).toEqual({ success: true, data: { items: [1, 2, 3] } })
  })

  it('created() returns status 201 with { success: true, data }', () => {
    const res = makeMockRes()
    created(res as any, { id: 'new-1' })

    expect(res._getStatusCode()).toBe(201)
    const body = res._getJSONData()
    expect(body).toEqual({ success: true, data: { id: 'new-1' } })
  })

  it('badRequest() returns status 400 with { success: false, error }', () => {
    const res = makeMockRes()
    badRequest(res as any, 'Campo obrigatório')

    expect(res._getStatusCode()).toBe(400)
    const body = res._getJSONData()
    expect(body).toEqual({ success: false, error: 'Campo obrigatório' })
  })

  it('unauthorized() returns status 401 with { success: false, error }', () => {
    const res = makeMockRes()
    unauthorizedResponse(res as any)

    expect(res._getStatusCode()).toBe(401)
    const body = res._getJSONData()
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
  })

  it('forbidden() returns status 403 with { success: false, error }', () => {
    const res = makeMockRes()
    forbiddenResponse(res as any)

    expect(res._getStatusCode()).toBe(403)
    const body = res._getJSONData()
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
  })

  it('notFound() returns status 404 with { success: false, error }', () => {
    const res = makeMockRes()
    notFound(res as any)

    expect(res._getStatusCode()).toBe(404)
    const body = res._getJSONData()
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
  })

  it('serverError() returns status 500 with { success: false, error }', () => {
    const res = makeMockRes()
    // Suppress console.error from serverError
    jest.spyOn(console, 'error').mockImplementation(() => {})
    serverError(res as any, new Error('Something broke'))

    expect(res._getStatusCode()).toBe(500)
    const body = res._getJSONData()
    expect(body).toEqual({ success: false, error: 'Something broke' })
    ;(console.error as jest.Mock).mockRestore()
  })
})
