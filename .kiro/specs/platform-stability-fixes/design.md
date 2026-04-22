# Platform Stability Fixes — Bugfix Design

## Overview

The Reino Flor e-commerce platform has seven stability issues spanning incorrect data (slug vs cuid), duplicated infrastructure code, missing dependencies, and empty placeholder directories. The fix strategy is minimal and surgical: correct the `track.ts` analytics endpoint to resolve the store slug to a cuid, consolidate queue definitions by having the API import from the workers package, add missing `package.json` dependencies, and clean up or scaffold the three empty directories. No working code paths are restructured.

## Glossary

- **Bug_Condition (C)**: The set of conditions under which each bug manifests — wrong storeId type, duplicate queue definitions, missing dependency at runtime, or empty directory confusing tooling
- **Property (P)**: The desired correct behavior — valid cuid in analytics jobs, single source of truth for queues, clean dependency resolution, and no empty placeholder directories
- **Preservation**: All existing API endpoints, worker processing, email flows, auth middleware, and admin/storefront UI rendering must remain unchanged
- **`track.ts`**: The storefront analytics endpoint at `apps/api/pages/api/storefront/track.ts` that enqueues analytics events
- **`queues.ts` (API)**: The duplicate queue definition file at `apps/api/lib/queues.ts` with its own Redis connection and type interfaces
- **`queues/index.ts` (Workers)**: The canonical queue definition file at `apps/workers/src/queues/index.ts` used by all workers
- **`STORE_SLUG`**: The `NEXT_PUBLIC_STORE_SLUG` env var (e.g. `"reino-flor-store"`) incorrectly used as `storeId`

## Bug Details

### Bug Condition

The platform has seven distinct bug conditions that collectively degrade stability:

1. **Analytics storeId mismatch**: `track.ts` passes the `STORE_SLUG` string literal as `storeId` instead of resolving the slug to the store's cuid via Prisma lookup
2. **Duplicate queue definitions**: `apps/api/lib/queues.ts` redefines `OrderConfirmationJobData`, `AnalyticsJobData`, queue names, and Redis connection logic already present in `apps/workers/src/queues/index.ts`
3. **Missing dotenv in workers**: `apps/workers/src/index.ts` imports `dotenv/config` but `dotenv` is not in `apps/workers/package.json`
4. **Missing bullmq/ioredis in API**: `apps/api/lib/queues.ts` imports `bullmq` and `ioredis` but neither is in `apps/api/package.json`
5. **Empty affiliates directory**: `apps/api/pages/api/affiliates/` exists with no route handlers
6. **Empty vendors directory**: `apps/api/pages/api/vendors/` exists with no route handlers
7. **Empty packages/ui directory**: `packages/ui/` exists with no `package.json` or exports

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type PlatformOperation
  OUTPUT: boolean

  // Bug 1: Analytics tracking with slug instead of cuid
  IF input.type == "analytics_enqueue"
     AND input.storeId IS NOT a valid cuid
     AND input.storeId == STORE_SLUG
     RETURN true

  // Bug 2: API loads its own queue definitions
  IF input.type == "api_queue_import"
     AND input.sourceFile == "apps/api/lib/queues.ts"
     AND duplicateDefinitionsExist("apps/workers/src/queues/index.ts")
     RETURN true

  // Bug 3: Workers start without dotenv dependency
  IF input.type == "workers_start"
     AND "dotenv" NOT IN dependencies("apps/workers/package.json")
     RETURN true

  // Bug 4: API loads queues without bullmq/ioredis dependency
  IF input.type == "api_queue_load"
     AND ("bullmq" NOT IN dependencies("apps/api/package.json")
          OR "ioredis" NOT IN dependencies("apps/api/package.json"))
     RETURN true

  // Bugs 5-7: Empty directories
  IF input.type == "directory_inspect"
     AND input.path IN ["apps/api/pages/api/affiliates/",
                         "apps/api/pages/api/vendors/",
                         "packages/ui/"]
     AND directoryIsEmpty(input.path)
     RETURN true

  RETURN false
END FUNCTION
```

### Examples

- **Bug 1**: `track.ts` enqueues `{ storeId: "reino-flor-store", type: "page_view", ... }`. The analytics worker writes this to `AnalyticsEvent.storeId` which expects a cuid like `"clx1abc2d0000..."`; the record is orphaned from any `Store` row.
- **Bug 2**: `checkout.ts` imports `getOrderConfirmationQueue` from `apps/api/lib/queues.ts` which creates its own `IORedis` connection with `{ attempts: 3, removeOnComplete: true }`. The workers' queue uses `{ attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: { count: 100 } }` — different default job options for the same queue name.
- **Bug 3**: Running `ts-node apps/workers/src/index.ts` fails with `Cannot find module 'dotenv/config'` in a clean pnpm install (strict mode).
- **Bug 4**: Running `next build` for the API may fail or behave unpredictably because `bullmq` and `ioredis` resolve only via pnpm hoisting, not explicit dependency declaration.
- **Bugs 5-7**: `ls apps/api/pages/api/affiliates/` returns nothing; same for vendors and `packages/ui/`.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The `track.ts` endpoint continues to return HTTP 202 and never fails to the client (fire-and-forget pattern preserved)
- The `checkout.ts` endpoint continues to enqueue order confirmation emails with the same job data shape
- All 5 workers (email, abandoned cart, order confirmation, campaign, analytics) continue to process jobs identically
- The analytics worker continues to write `AnalyticsEvent` records with the same schema
- Auth middleware, RBAC, and all existing API routes (products, orders, payments, coupons, customers, analytics, builder, storefront) remain unchanged
- Admin and storefront apps continue to render with their local UI components

**Scope:**
All inputs that do NOT involve the seven bug conditions should be completely unaffected by this fix. This includes:
- All authenticated API requests to existing endpoints
- All worker job processing for valid jobs already in queues
- All Prisma database operations
- All payment processing (Stripe, MercadoPago)
- All email sending via SendGrid/nodemailer

## Hypothesized Root Cause

Based on the bug analysis, the root causes are:

1. **Analytics storeId — Developer oversight**: `track.ts` was written to use the `STORE_SLUG` env var directly as `storeId` without a Prisma lookup. The request body already contains `storeSlug` but it is ignored for the `storeId` field. The developer likely intended to resolve the slug but used the env var as a shortcut.

2. **Duplicate queue definitions — Organic growth**: The API needed to enqueue jobs but couldn't easily import from the workers package (different app in the monorepo). A developer copied the queue setup into `apps/api/lib/queues.ts` rather than creating a shared import path. The workers package is already in the pnpm workspace and can be referenced as `@reino-flor/workers`.

3. **Missing dotenv — Forgotten dependency**: `dotenv` was likely hoisted from another package during development, so the import worked. It was never added to `apps/workers/package.json` explicitly.

4. **Missing bullmq/ioredis — Same hoisting issue**: These packages are declared in `apps/workers/package.json` and were hoisted, making them available to the API at development time. They were never added to `apps/api/package.json`.

5. **Empty affiliates directory — Premature scaffolding**: The Prisma schema defines `Affiliate`, `AffiliateClick`, and `AffiliateCommission` models, and RBAC defines `affiliates:manage`, but the API routes were never implemented.

6. **Empty vendors directory — Same as affiliates**: `Vendor` and `Payout` models exist in the schema but no route handlers were created.

7. **Empty packages/ui — Premature scaffolding**: The workspace config includes `packages/*` but `packages/ui/` was created as a placeholder without any content.

## Correctness Properties

Property 1: Bug Condition — Analytics storeId is a valid cuid

_For any_ analytics tracking request where `track.ts` receives a valid `storeSlug`, the fixed endpoint SHALL resolve the slug to the store's cuid via `prisma.store.findUnique({ where: { slug } })` and enqueue the analytics job with the actual `store.id` (cuid) as `storeId`. If the store is not found, the endpoint SHALL still return HTTP 202 but not enqueue the job.

**Validates: Requirements 2.1**

Property 2: Bug Condition — Single source of truth for queue definitions

_For any_ API code path that enqueues a job (order confirmation or analytics), the fixed code SHALL import queue accessors and type interfaces from `@reino-flor/workers` (or a shared package) rather than maintaining a separate `apps/api/lib/queues.ts` file, ensuring queue names, job data types, and default job options are defined in exactly one place.

**Validates: Requirements 2.2**

Property 3: Bug Condition — Workers dotenv dependency is explicit

_For any_ clean `pnpm install` of the workers package, the `dotenv` package SHALL be listed in `apps/workers/package.json` dependencies so that `import 'dotenv/config'` resolves without relying on hoisting.

**Validates: Requirements 2.3**

Property 4: Bug Condition — API queue dependencies are explicit

_For any_ clean `pnpm install` of the API package, the packages required for queue functionality (`bullmq`, `ioredis`) SHALL be listed in `apps/api/package.json` dependencies, OR the API SHALL import queue functionality from `@reino-flor/workers` which already declares these dependencies, eliminating the need for direct imports.

**Validates: Requirements 2.4**

Property 5: Bug Condition — Empty directories are resolved

_For any_ inspection of `apps/api/pages/api/affiliates/`, `apps/api/pages/api/vendors/`, and `packages/ui/`, the directories SHALL either contain meaningful placeholder content (501 routes, minimal package.json) or be removed entirely.

**Validates: Requirements 2.5, 2.6, 2.7**

Property 6: Preservation — Existing endpoint and worker behavior unchanged

_For any_ input that does NOT involve the seven bug conditions (i.e., all existing API requests, worker job processing, auth flows, payment processing), the fixed code SHALL produce exactly the same behavior as the original code, preserving all request/response contracts, job processing logic, and database operations.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `apps/api/pages/api/storefront/track.ts`

**Function**: `handler`

**Specific Changes**:
1. **Resolve slug to cuid**: Import `prisma` from `@reino-flor/database`. Use the `storeSlug` from the parsed request body (already validated by zod) to look up the store via `prisma.store.findUnique({ where: { slug: storeSlug } })`. Use `store.id` (the cuid) as the `storeId` in the analytics job data. If the store is not found, return 202 without enqueuing (preserving fire-and-forget).
2. **Remove STORE_SLUG constant**: The `NEXT_PUBLIC_STORE_SLUG` env var and the `STORE_SLUG` constant are no longer needed in this file.

---

**File**: `apps/api/lib/queues.ts`

**Specific Changes**:
3. **Replace with re-exports from workers**: Delete the entire file content (duplicate `Queue`, `IORedis` imports, `getConnection`, interfaces, and lazy queue singletons). Replace with imports from `@reino-flor/workers` that re-export the `orderConfirmationQueue` and `analyticsQueue` instances, plus the type interfaces. The API will use the workers' shared Redis connection and queue configuration.

   Since `checkout.ts` calls `getOrderConfirmationQueue()` (a function), and `track.ts` calls `getAnalyticsQueue()` (a function), we need to either:
   - Export wrapper functions that return the workers' queue instances, OR
   - Update the call sites to use the queue instances directly

   The minimal approach: export wrapper functions `getOrderConfirmationQueue()` and `getAnalyticsQueue()` that return the workers' queue instances, preserving the existing call-site API.

---

**File**: `apps/workers/package.json`

**Specific Changes**:
4. **Add dotenv dependency**: Add `"dotenv": "^16.4.0"` to the `dependencies` section.

---

**File**: `apps/workers/package.json`

**Specific Changes**:
5. **Export queues for API consumption**: Add an `"exports"` field or ensure the package's `main`/`types` fields allow the API to import from `@reino-flor/workers`. Add a `src/queues/index.ts` barrel export path. This may require adding a `"main"` or `"exports"` field pointing to the queues.

---

**File**: `apps/api/package.json`

**Specific Changes**:
6. **Add @reino-flor/workers dependency**: Add `"@reino-flor/workers": "workspace:*"` to dependencies. This transitively provides `bullmq` and `ioredis`. Remove the need to add `bullmq` and `ioredis` directly since the API will import queue functionality from the workers package.

---

**Files**: `apps/api/pages/api/affiliates/`, `apps/api/pages/api/vendors/`

**Specific Changes**:
7. **Add placeholder index.ts routes**: Create `index.ts` in each directory that returns `501 Not Implemented` with a clear message. This prevents confusion while signaling the endpoints are planned but not yet built.

---

**File**: `packages/ui/`

**Specific Changes**:
8. **Scaffold minimal package**: Create `package.json` with name `@reino-flor/ui`, a `tsconfig.json`, and a `src/index.ts` entry point that exports an empty object or a placeholder comment. This makes the workspace package valid without requiring any apps to depend on it yet.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that exercise the specific bug conditions — call `track.ts` handler and inspect the enqueued job data, verify `package.json` files for missing dependencies, and check directory contents. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Analytics storeId Test**: Call the `track.ts` handler with a valid `storeSlug` and inspect the job data passed to `getAnalyticsQueue().add()` — the `storeId` field will be the slug string, not a cuid (will fail on unfixed code)
2. **Duplicate Queue Definition Test**: Import from both `apps/api/lib/queues.ts` and `apps/workers/src/queues/index.ts` and compare the `OrderConfirmationJobData` interface shapes and default job options — they will diverge (will fail on unfixed code)
3. **Workers dotenv Test**: Parse `apps/workers/package.json` and check that `dotenv` is in `dependencies` — it will be missing (will fail on unfixed code)
4. **API bullmq/ioredis Test**: Parse `apps/api/package.json` and check that `bullmq` and `ioredis` are in `dependencies` or that the API imports from a workspace package that provides them — both will be missing (will fail on unfixed code)

**Expected Counterexamples**:
- `track.ts` enqueues `{ storeId: "reino-flor-store" }` instead of `{ storeId: "clx..." }`
- `apps/workers/package.json` has no `dotenv` key in `dependencies`
- `apps/api/package.json` has no `bullmq` or `ioredis` keys in `dependencies`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedPlatform(input)
  ASSERT expectedBehavior(result)
END FOR
```

Specifically:
- For Bug 1: Assert that the enqueued analytics job has a `storeId` matching the cuid from `prisma.store.findUnique({ where: { slug } })`
- For Bug 2: Assert that `apps/api/lib/queues.ts` imports from `@reino-flor/workers` and does not define its own interfaces or Redis connections
- For Bug 3: Assert `dotenv` is in `apps/workers/package.json` dependencies
- For Bug 4: Assert `@reino-flor/workers` is in `apps/api/package.json` dependencies (providing transitive bullmq/ioredis)
- For Bugs 5-6: Assert `apps/api/pages/api/affiliates/index.ts` and `vendors/index.ts` exist and return 501
- For Bug 7: Assert `packages/ui/package.json` exists with name `@reino-flor/ui`

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalPlatform(input) = fixedPlatform(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for checkout flow, existing API endpoints, and worker processing, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Checkout Preservation**: Verify that `checkout.ts` continues to enqueue order confirmation jobs with the same data shape (`orderId`, `userEmail`, `userName`, `items`, `total`, `paymentMethod`) after the queue import source changes
2. **Analytics Worker Preservation**: Verify that the analytics worker continues to create `AnalyticsEvent` records with all fields when given a valid cuid `storeId`
3. **Track Endpoint HTTP Contract Preservation**: Verify that `track.ts` continues to return HTTP 202 for both valid and invalid requests (fire-and-forget pattern)
4. **Auth Middleware Preservation**: Verify that auth middleware and RBAC continue to enforce permissions identically

### Unit Tests

- Test `track.ts` handler with mocked Prisma to verify slug-to-cuid resolution
- Test `track.ts` handler when store is not found (should return 202, not enqueue)
- Test that `apps/api/lib/queues.ts` re-exports produce working queue instances
- Test placeholder routes return 501 with correct response shape
- Verify `package.json` files contain required dependencies

### Property-Based Tests

- Generate random valid `storeSlug` values and verify the enqueued job always contains the corresponding cuid, never the slug string
- Generate random analytics event payloads and verify the `track.ts` endpoint always returns 202 regardless of store lookup result
- Generate random checkout payloads and verify the order confirmation job data shape is preserved after queue consolidation

### Integration Tests

- Test full analytics flow: `track.ts` → queue → analytics worker → database record with valid cuid `storeId`
- Test full checkout flow: `checkout.ts` → queue → order confirmation worker → email worker, verifying the queue consolidation doesn't break the chain
- Test `pnpm install --frozen-lockfile` in a clean environment to verify all dependencies resolve
