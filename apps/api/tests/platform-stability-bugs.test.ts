/**
 * Bug Condition Exploration Tests — Platform Stability Fixes
 *
 * These tests encode the EXPECTED (fixed) behavior for all 7 bugs.
 * They MUST FAIL on unfixed code — failure confirms the bugs exist.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */
import * as fs from 'fs'
import * as path from 'path'
import { createMocks } from 'node-mocks-http'

// ─── Bug 1: Analytics storeId ─────────────────────────────────────────────────

// Mock the analytics queue BEFORE importing track handler
const mockAdd = jest.fn().mockResolvedValue({})
jest.mock('../lib/queues', () => ({
  getAnalyticsQueue: () => ({ add: mockAdd }),
}))

// Prisma is already mocked in setup.ts
import { prisma } from '@reino-flor/database'
import trackHandler from '../pages/api/storefront/track'

const prismaMock = prisma as jest.Mocked<typeof prisma>

describe('Bug 1 — Analytics storeId should be a cuid, not a slug', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should resolve storeSlug to a cuid and use it as storeId in the analytics job', async () => {
    /**
     * Validates: Requirements 1.1, 2.1
     *
     * On UNFIXED code, track.ts passes STORE_SLUG ("reino-flor-store") directly
     * as storeId. The fix should resolve the slug to the store's cuid via Prisma.
     */
    ;(prismaMock.store.findUnique as jest.Mock).mockResolvedValue({
      id: 'clx1abc2d0000',
      slug: 'reino-flor-store',
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        storeSlug: 'reino-flor-store',
        type: 'page_view',
        sessionId: 'sess-123',
        data: { page: '/home' },
      },
    })

    await trackHandler(req as any, res as any)

    expect(res._getStatusCode()).toBe(202)
    expect(mockAdd).toHaveBeenCalledTimes(1)

    const jobData = mockAdd.mock.calls[0][1]
    // The storeId MUST be the cuid from the Prisma lookup, NOT the slug string
    expect(jobData.storeId).toBe('clx1abc2d0000')
  })
})


// ─── Bug 2: Duplicate queue definitions ───────────────────────────────────────

describe('Bug 2 — API queues.ts should NOT contain its own queue/Redis definitions', () => {
  it('should not contain "new IORedis" or "new Queue" in apps/api/lib/queues.ts', () => {
    /**
     * Validates: Requirements 1.2, 2.2
     *
     * On UNFIXED code, apps/api/lib/queues.ts defines its own IORedis connection
     * and Queue instances. The fix should re-export from @reino-flor/workers.
     */
    const queuesPath = path.resolve(__dirname, '../lib/queues.ts')
    const content = fs.readFileSync(queuesPath, 'utf-8')

    expect(content).not.toMatch(/new IORedis/)
    expect(content).not.toMatch(/new Queue/)
  })
})

// ─── Bug 3: Missing dotenv in workers ─────────────────────────────────────────

describe('Bug 3 — Workers package.json should list dotenv as a dependency', () => {
  it('should have dotenv in apps/workers/package.json dependencies', () => {
    /**
     * Validates: Requirements 1.3, 2.3
     *
     * On UNFIXED code, dotenv is not listed in apps/workers/package.json
     * despite being imported in apps/workers/src/index.ts.
     */
    const pkgPath = path.resolve(__dirname, '../../workers/package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

    expect(pkg.dependencies).toHaveProperty('dotenv')
  })
})

// ─── Bug 4: Missing API queue deps ───────────────────────────────────────────

describe('Bug 4 — API package.json should depend on @reino-flor/workers', () => {
  it('should have @reino-flor/workers in apps/api/package.json dependencies', () => {
    /**
     * Validates: Requirements 1.4, 2.4
     *
     * On UNFIXED code, apps/api/package.json does not list @reino-flor/workers,
     * bullmq, or ioredis as dependencies. The fix adds @reino-flor/workers
     * which provides transitive access to bullmq and ioredis.
     */
    const pkgPath = path.resolve(__dirname, '../package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

    expect(pkg.dependencies).toHaveProperty('@reino-flor/workers')
  })
})

// ─── Bugs 5-6: Empty directories ─────────────────────────────────────────────

describe('Bugs 5-6 — Empty API directories should have placeholder route handlers', () => {
  it('should have apps/api/pages/api/affiliates/index.ts', () => {
    /**
     * Validates: Requirements 1.5, 2.5
     *
     * On UNFIXED code, the affiliates directory is empty with no route handlers.
     */
    const filePath = path.resolve(__dirname, '../pages/api/affiliates/index.ts')
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('should have apps/api/pages/api/vendors/index.ts', () => {
    /**
     * Validates: Requirements 1.6, 2.6
     *
     * On UNFIXED code, the vendors directory is empty with no route handlers.
     */
    const filePath = path.resolve(__dirname, '../pages/api/vendors/index.ts')
    expect(fs.existsSync(filePath)).toBe(true)
  })
})

// ─── Bug 7: Empty packages/ui ─────────────────────────────────────────────────

describe('Bug 7 — packages/ui should have a valid package.json', () => {
  it('should have packages/ui/package.json with name @reino-flor/ui', () => {
    /**
     * Validates: Requirements 1.7, 2.7
     *
     * On UNFIXED code, packages/ui/ is completely empty with no package.json.
     */
    const pkgPath = path.resolve(__dirname, '../../../packages/ui/package.json')
    expect(fs.existsSync(pkgPath)).toBe(true)

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    expect(pkg.name).toBe('@reino-flor/ui')
  })
})
