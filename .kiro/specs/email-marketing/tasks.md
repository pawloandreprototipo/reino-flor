# Tasks

## Task 1: Add `campaigns:manage` RBAC permission
- [ ] 1.1 Add `'campaigns:manage'` to the `Permission` type union in `packages/auth/src/rbac.ts`
- [ ] 1.2 Add `'campaigns:manage'` to `SUPER_ADMIN`, `ADMIN`, and `MANAGER` role permission arrays in `ROLE_PERMISSIONS`
- [ ] 1.3 Verify `hasPermission` returns `true` for SUPER_ADMIN/ADMIN/MANAGER and `false` for VENDOR/AFFILIATE/CUSTOMER with `campaigns:manage`

## Task 2: Subscriber CRUD API endpoints
- [ ] 2.1 Create `apps/api/pages/api/subscribers/index.ts` with GET (paginated list with search, scoped by store) and POST (create subscriber with Zod validation, 409 on duplicate email) handlers, protected by `withAuth(handler, 'campaigns:manage')`
- [ ] 2.2 Create `apps/api/pages/api/subscribers/[id].ts` with GET (single subscriber), PUT (update name/active), and DELETE (remove, 204) handlers, returning 404 if subscriber doesn't belong to store
- [ ] 2.3 Create `apps/api/pages/api/subscribers/import.ts` with POST handler that parses CSV with `email` and `name` columns, skips duplicates and invalid emails, returns `{ created, skipped, errors }` summary

## Task 3: Campaign CRUD API endpoints
- [ ] 3.1 Create `apps/api/pages/api/campaigns/index.ts` with GET (paginated list with status filter, scoped by store) and POST (create campaign with Zod validation, status DRAFT or SCHEDULED based on scheduledAt) handlers, protected by `withAuth(handler, 'campaigns:manage')`
- [ ] 3.2 Create `apps/api/pages/api/campaigns/[id].ts` with GET (campaign detail with aggregated subscriber stats) and PUT (update only DRAFT campaigns) handlers, returning 404 if campaign doesn't belong to store

## Task 4: Campaign send and cancel API endpoints
- [ ] 4.1 Create `apps/api/pages/api/campaigns/[id]/send.ts` with POST handler that validates campaign is DRAFT/SCHEDULED, fetches active subscribers, creates CampaignSubscriber records, updates campaign to SENDING with sentAt and sentCount, and enqueues one CampaignJobData job per subscriber to campaignQueue
- [ ] 4.2 Create `apps/api/pages/api/campaigns/[id]/cancel.ts` with POST handler that validates campaign is DRAFT/SCHEDULED and updates status to CANCELLED

## Task 5: Storefront subscribe API endpoint
- [ ] 5.1 Create `apps/api/pages/api/storefront/subscribe.ts` with POST handler (no auth required) that validates email and storeSlug with Zod, looks up store by slug, upserts subscriber with `[storeId, email]` unique constraint for idempotent behavior, returns 404 for invalid storeSlug

## Task 6: Admin React Query hooks
- [ ] 6.1 Create `apps/admin/hooks/useCampaigns.ts` with `useCampaigns`, `useCampaign`, `useCreateCampaign`, `useUpdateCampaign`, `useSendCampaign`, `useCancelCampaign` hooks following the `useProducts` pattern
- [ ] 6.2 Create `apps/admin/hooks/useSubscribers.ts` with `useSubscribers`, `useCreateSubscriber`, `useUpdateSubscriber`, `useDeleteSubscriber`, `useImportSubscribers` hooks following the `useProducts` pattern
- [ ] 6.3 Create `apps/admin/hooks/useEmailStats.ts` with `useEmailStats` hook that fetches summary data (total subscribers, campaigns sent, open rate) for the dashboard overview

## Task 7: Admin email marketing dashboard pages
- [ ] 7.1 Create `/dashboard/email/page.tsx` overview page with StatCards showing total subscribers, total campaigns sent, and overall open rate
- [ ] 7.2 Create `/dashboard/email/subscribers/page.tsx` with paginated Table, search input, "Add Subscriber" button/modal, "Import CSV" button/dialog, and edit/delete actions per row
- [ ] 7.3 Create `/dashboard/email/campaigns/page.tsx` with paginated Table showing campaign name, status Badge, sent date, and sent count, plus "New Campaign" button
- [ ] 7.4 Create `/dashboard/email/campaigns/new/page.tsx` with campaign creation form (name, subject, body textarea, optional scheduledAt date picker)
- [ ] 7.5 Create `/dashboard/email/campaigns/[id]/page.tsx` with campaign detail view showing delivery stats (sent, opened, clicked), send button (for DRAFT/SCHEDULED), and cancel button

## Task 8: Wire storefront NewsletterSection
- [ ] 8.1 Verify the existing `NewsletterSection` component already sends POST to `/api/storefront/subscribe` with `email` and `storeSlug` — no code changes needed if the endpoint from Task 5 matches the existing component's API call

## Task 9: Property-based tests
- [ ] 9.1 Write property test for store isolation: generate random multi-store subscriber/campaign data, verify API only returns records for the authenticated store (Feature: email-marketing, Property 1: Store isolation) ~PBT
- [ ] 9.2 Write property test for subscriber uniqueness: generate random emails, verify admin endpoint returns 409 on duplicate and storefront endpoint returns success idempotently (Feature: email-marketing, Property 2: Subscriber uniqueness and idempotent subscribe) ~PBT
- [ ] 9.3 Write property test for campaign creation default status: generate random payloads with/without scheduledAt, verify DRAFT vs SCHEDULED status and sentCount=0 (Feature: email-marketing, Property 3: Campaign creation default status) ~PBT
- [ ] 9.4 Write property test for campaign status transition guards: generate random campaign statuses and actions (send/cancel/update), verify only valid transitions succeed (Feature: email-marketing, Property 4: Campaign status transition guards) ~PBT
- [ ] 9.5 Write property test for send completeness: generate random subscriber sets, trigger send, verify CampaignSubscriber count and enqueued job count match active subscriber count (Feature: email-marketing, Property 5: Send completeness) ~PBT
- [ ] 9.6 Write property test for CSV import invariant: generate random CSV data with valid/invalid/duplicate emails, verify created + skipped + errors.length equals total rows (Feature: email-marketing, Property 6: CSV import invariant) ~PBT
- [ ] 9.7 Write property test for Zod validation rejection: generate random invalid payloads (bad emails, missing fields, past dates), verify 400 response with no database side effects (Feature: email-marketing, Property 7: Zod validation rejects invalid input) ~PBT
- [ ] 9.8 Write property test for permission enforcement: generate requests with unauthorized roles (VENDOR, AFFILIATE, CUSTOMER), verify 403 for all campaign/subscriber endpoints (Feature: email-marketing, Property 8: Permission enforcement) ~PBT
