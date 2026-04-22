# Bugfix Requirements Document

## Introduction

The "reino-flor" multi-tenant e-commerce SaaS platform has several stability issues that need to be resolved before new feature development continues. These range from runtime crashes (missing dependencies, wrong data types sent to the database) to architectural gaps (duplicate queue definitions, empty placeholder directories, non-functional shared UI package). This document captures the defective behaviors, the expected corrections, and the existing behaviors that must be preserved.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the storefront `track.ts` endpoint receives an analytics event THEN the system enqueues the job with `storeId` set to the `STORE_SLUG` environment variable (a slug string like `"reino-flor-store"`) instead of the actual store's cuid, causing the analytics worker to write an orphaned or invalid `storeId` to the `AnalyticsEvent` table

1.2 WHEN the API server initializes and `apps/api/lib/queues.ts` is loaded THEN the system creates its own Redis connection via `new IORedis()` and defines its own `OrderConfirmationJobData` and `AnalyticsJobData` interfaces, duplicating the queue definitions and type interfaces already present in `apps/workers/src/queues/index.ts`, with separate Redis connections and potentially divergent default job options

1.3 WHEN the workers process is started via `apps/workers/src/index.ts` THEN the system crashes because `dotenv` is imported (`import 'dotenv/config'`) but `dotenv` is not listed as a dependency in `apps/workers/package.json`

1.4 WHEN the API server loads `apps/api/lib/queues.ts` THEN the system relies on `bullmq` and `ioredis` packages that are not listed in `apps/api/package.json` dependencies, making the imports fragile and dependent on pnpm hoisting behavior

1.5 WHEN a developer or CI tool inspects `apps/api/pages/api/affiliates/` THEN the system presents an empty directory with no API route handlers, despite the Prisma schema defining `Affiliate`, `AffiliateClick`, and `AffiliateCommission` models and the RBAC system defining `affiliates:manage` permission

1.6 WHEN a developer or CI tool inspects `apps/api/pages/api/vendors/` THEN the system presents an empty directory with no API route handlers, despite the Prisma schema defining `Vendor` and `Payout` models and the RBAC system defining `vendors:manage` permission

1.7 WHEN a developer or CI tool inspects `packages/ui/` THEN the system presents a completely empty directory with no `package.json`, no components, and no exports, despite the pnpm workspace including `packages/*` and both admin and storefront apps having duplicated UI components

### Expected Behavior (Correct)

2.1 WHEN the storefront `track.ts` endpoint receives an analytics event with a `storeSlug` THEN the system SHALL resolve the slug to the actual store record's cuid and enqueue the analytics job with the correct `storeId` (cuid), or return an error if the store is not found

2.2 WHEN the API server needs to enqueue jobs (order confirmation, analytics) THEN the system SHALL use a single shared queue package (or import from the workers' queue definitions) so that queue names, job data interfaces, and default job options are defined in one place, and both the API and workers share the same Redis connection configuration

2.3 WHEN the workers process is started THEN the system SHALL have `dotenv` listed as an explicit dependency in `apps/workers/package.json` so that the `import 'dotenv/config'` statement resolves correctly regardless of hoisting

2.4 WHEN the API server loads queue functionality THEN the system SHALL have `bullmq` and `ioredis` listed as explicit dependencies in `apps/api/package.json`, or the API SHALL import queue functionality from a shared package that already declares these dependencies

2.5 WHEN a developer or CI tool inspects `apps/api/pages/api/affiliates/` THEN the system SHALL either contain placeholder route handlers that return `501 Not Implemented` or the empty directory SHALL be removed to avoid confusion, with a clear indication in documentation that affiliate endpoints are not yet implemented

2.6 WHEN a developer or CI tool inspects `apps/api/pages/api/vendors/` THEN the system SHALL either contain placeholder route handlers that return `501 Not Implemented` or the empty directory SHALL be removed to avoid confusion, with a clear indication in documentation that vendor endpoints are not yet implemented

2.7 WHEN a developer or CI tool inspects `packages/ui/` THEN the system SHALL contain at minimum a valid `package.json` with the package name `@reino-flor/ui`, a `tsconfig.json`, and an `index.ts` entry point that exports shared UI components, or the empty directory SHALL be removed from the workspace until it is ready for use

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the storefront `track.ts` endpoint receives a valid analytics event with all required fields THEN the system SHALL CONTINUE TO return HTTP 202 and enqueue the analytics job without blocking the client response

3.2 WHEN the checkout endpoint (`orders/checkout.ts`) successfully creates an order THEN the system SHALL CONTINUE TO enqueue an order confirmation email job with the correct `orderId`, `userEmail`, `userName`, `items`, `total`, and `paymentMethod`

3.3 WHEN the analytics worker processes a job with a valid `storeId` (cuid) THEN the system SHALL CONTINUE TO create an `AnalyticsEvent` record in the database with all provided fields (`storeId`, `type`, `sessionId`, `userId`, `data`, `ip`, `userAgent`)

3.4 WHEN the workers process starts with a valid `.env` file THEN the system SHALL CONTINUE TO initialize all 5 workers (email, abandoned cart, order confirmation, campaign, analytics) and the abandoned cart scheduler

3.5 WHEN the auth middleware validates a JWT token and checks RBAC permissions THEN the system SHALL CONTINUE TO correctly enforce role-based access control for all existing endpoints (products, orders, customers, analytics, settings)

3.6 WHEN the existing API endpoints (auth, products, orders, payments, coupons, customers, analytics, builder, storefront) receive valid requests THEN the system SHALL CONTINUE TO function identically with no changes to their request/response contracts

3.7 WHEN the admin and storefront apps use their existing local UI components THEN the system SHALL CONTINUE TO render correctly regardless of changes to `packages/ui/`
