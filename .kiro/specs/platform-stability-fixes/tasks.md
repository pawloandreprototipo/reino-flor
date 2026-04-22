# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** — Platform Stability Bugs
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bugs exist
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases for each bug
  - Create test file `apps/api/tests/platform-stability-bugs.test.ts`
  - **Bug 1 — Analytics storeId**: Call the `track.ts` handler with a mocked Prisma store (`{ id: "clx1abc2d0000", slug: "reino-flor-store" }`) and a mocked `getAnalyticsQueue().add()`. Assert that the `storeId` in the enqueued job data is the cuid `"clx1abc2d0000"`, NOT the slug string `"reino-flor-store"`. On unfixed code, the handler passes `STORE_SLUG` directly, so this will FAIL.
  - **Bug 2 — Duplicate queues**: Import `apps/api/lib/queues.ts` and assert it re-exports from `@reino-flor/workers` (e.g., check the file does NOT contain `new IORedis` or `new Queue`). On unfixed code, the file defines its own queues, so this will FAIL.
  - **Bug 3 — Missing dotenv**: Read `apps/workers/package.json` and assert `dotenv` is in `dependencies`. On unfixed code, it is missing, so this will FAIL.
  - **Bug 4 — Missing API queue deps**: Read `apps/api/package.json` and assert `@reino-flor/workers` is in `dependencies` (providing transitive bullmq/ioredis). On unfixed code, it is missing, so this will FAIL.
  - **Bugs 5-6 — Empty directories**: Assert `apps/api/pages/api/affiliates/index.ts` and `apps/api/pages/api/vendors/index.ts` exist and export a handler returning 501. On unfixed code, these files don't exist, so this will FAIL.
  - **Bug 7 — Empty packages/ui**: Assert `packages/ui/package.json` exists with name `@reino-flor/ui`. On unfixed code, the directory is empty, so this will FAIL.
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found to understand root causes
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** — Existing Endpoint and Worker Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Create test file `apps/api/tests/platform-stability-preservation.test.ts`
  - **Track endpoint HTTP contract**: Call `track.ts` handler with valid and invalid payloads on UNFIXED code. Observe it always returns HTTP 202 with `{ success: true }`. Write property-based tests (using `fast-check`) generating random analytics payloads and asserting the endpoint always returns 202 regardless of input validity — fire-and-forget pattern preserved.
  - **Checkout queue data shape**: Call `checkout.ts` handler with mocked Prisma and observe the job data passed to `getOrderConfirmationQueue().add()`. Assert the data shape includes `orderId`, `userEmail`, `userName`, `items` (array of `{ name, quantity, price, total }`), `total`, and `paymentMethod`. Write property-based test generating random valid checkout payloads and asserting the enqueued job always has this shape.
  - **Auth middleware preservation**: Call an auth-protected endpoint without a token and assert 401. Call with a valid token and assert the handler is invoked. These behaviors must be unchanged.
  - **Existing API response contracts**: Call `GET /api/products` with a valid admin token and mocked data, assert 200 with `{ success: true, data: { products, total } }` shape. This must be unchanged.
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Fix platform stability bugs

  - [x] 3.1 Fix `track.ts` to resolve storeSlug to cuid via Prisma lookup
    - Import `prisma` from `@reino-flor/database`
    - Use `parsed.data.storeSlug` to look up the store: `prisma.store.findUnique({ where: { slug: storeSlug } })`
    - Use `store.id` (cuid) as `storeId` in the analytics job data
    - If store not found, return 202 without enqueuing (preserve fire-and-forget)
    - Remove the `STORE_SLUG` constant and `NEXT_PUBLIC_STORE_SLUG` env var usage
    - _Bug_Condition: isBugCondition(input) where input.type == "analytics_enqueue" AND input.storeId == STORE_SLUG (not a cuid)_
    - _Expected_Behavior: storeId in enqueued job is the cuid from prisma.store.findUnique({ where: { slug } })_
    - _Preservation: track.ts continues to return HTTP 202 and never fails to the client_
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 3.2 Update workers package.json to export queues for API consumption
    - Add `"main": "src/index.ts"` or an `"exports"` field to `apps/workers/package.json` that exposes `src/queues/index.ts`
    - Ensure the API can import from `@reino-flor/workers` to access queue instances and types
    - _Bug_Condition: workers package does not export queues for external consumption_
    - _Expected_Behavior: API can import { orderConfirmationQueue, analyticsQueue } from @reino-flor/workers_
    - _Requirements: 2.2, 2.4_

  - [x] 3.3 Replace `apps/api/lib/queues.ts` with re-exports from `@reino-flor/workers`
    - Delete the entire duplicate content (IORedis connection, Queue instances, interfaces)
    - Import `orderConfirmationQueue` and `analyticsQueue` from `@reino-flor/workers`
    - Export wrapper functions `getOrderConfirmationQueue()` and `getAnalyticsQueue()` that return the workers' queue instances, preserving the existing call-site API in `checkout.ts` and `track.ts`
    - Re-export type interfaces (`OrderConfirmationJobData`, `AnalyticsJobData`) from `@reino-flor/workers`
    - _Bug_Condition: isBugCondition(input) where input.type == "api_queue_import" AND duplicateDefinitionsExist_
    - _Expected_Behavior: single source of truth for queue definitions, shared Redis connection and job options_
    - _Preservation: checkout.ts continues to call getOrderConfirmationQueue().add() with same data shape_
    - _Requirements: 1.2, 2.2, 3.2_

  - [x] 3.4 Add dotenv to `apps/workers/package.json` dependencies
    - Add `"dotenv": "^16.4.0"` to the `dependencies` section
    - _Bug_Condition: isBugCondition(input) where "dotenv" NOT IN dependencies("apps/workers/package.json")_
    - _Expected_Behavior: dotenv resolves correctly on clean pnpm install_
    - _Requirements: 1.3, 2.3, 3.4_

  - [x] 3.5 Add `@reino-flor/workers` to `apps/api/package.json` dependencies
    - Add `"@reino-flor/workers": "workspace:*"` to the `dependencies` section
    - This provides transitive access to `bullmq` and `ioredis` without adding them directly
    - _Bug_Condition: isBugCondition(input) where "bullmq" and "ioredis" NOT IN dependencies("apps/api/package.json")_
    - _Expected_Behavior: queue functionality resolves via @reino-flor/workers workspace dependency_
    - _Requirements: 1.4, 2.4_

  - [x] 3.6 Create placeholder 501 routes for affiliates and vendors
    - Create `apps/api/pages/api/affiliates/index.ts` returning `{ status: 501, body: { success: false, error: "Not Implemented" } }`
    - Create `apps/api/pages/api/vendors/index.ts` returning `{ status: 501, body: { success: false, error: "Not Implemented" } }`
    - _Bug_Condition: empty directories with no route handlers_
    - _Expected_Behavior: directories contain placeholder handlers returning 501_
    - _Requirements: 1.5, 1.6, 2.5, 2.6_

  - [x] 3.7 Scaffold minimal `packages/ui/` package
    - Create `packages/ui/package.json` with name `@reino-flor/ui`, version `0.0.1`, `"main": "src/index.ts"`
    - Create `packages/ui/tsconfig.json` extending the root or with minimal config
    - Create `packages/ui/src/index.ts` with a placeholder export (e.g., `export {}`)
    - _Bug_Condition: packages/ui/ is empty with no package.json or exports_
    - _Expected_Behavior: valid workspace package with package.json, tsconfig, and entry point_
    - _Preservation: admin and storefront apps continue to use their local UI components unchanged_
    - _Requirements: 1.7, 2.7, 3.7_

  - [x] 3.8 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** — Platform Stability Bugs Fixed
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior for all 7 bugs
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.9 Verify preservation tests still pass
    - **Property 2: Preservation** — Existing Endpoint and Worker Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite: `cd apps/api && npx jest --passWithNoTests`
  - Ensure all bug condition tests pass (task 1 tests now green)
  - Ensure all preservation tests pass (task 2 tests still green)
  - Ensure all existing tests pass (auth, products, payments, builder)
  - Ask the user if questions arise
