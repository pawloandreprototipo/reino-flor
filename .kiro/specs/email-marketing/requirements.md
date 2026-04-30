# Requirements Document

## Introduction

Email Marketing module for the multi-tenant e-commerce SaaS platform. This module enables store administrators to manage newsletter subscribers, create and send email campaigns, schedule deliveries, and track basic engagement metrics (sent, opened, clicked). The backend infrastructure (Prisma models, BullMQ campaign queue, campaign worker, email templates, and SendGrid/Ethereal sender) already exists. This spec covers the missing API endpoints, admin dashboard pages, storefront newsletter integration, and the campaign sending orchestration flow.

## Glossary

- **Admin_API**: Authenticated Next.js API routes under `apps/api/pages/api/` protected by `withAuth` middleware, scoped to the authenticated user's tenant/store
- **Subscriber**: A `Subscriber` Prisma record representing a newsletter recipient, uniquely identified by `[storeId, email]`
- **Campaign**: A `Campaign` Prisma record representing a bulk email send, progressing through statuses: DRAFT → SCHEDULED → SENDING → SENT (or CANCELLED)
- **Campaign_Worker**: The existing BullMQ worker (`campaignWorker.ts`) that processes `CampaignJobData` jobs, generates HTML via `campaignTemplate()`, and enqueues to `emailQueue`
- **Campaign_Queue**: The existing BullMQ queue (`campaignQueue`) that holds `CampaignJobData` jobs for the Campaign_Worker
- **Storefront_API**: Unauthenticated public API endpoint for storefront visitor actions (e.g., newsletter subscription)
- **Admin_Dashboard**: The Next.js admin app (`apps/admin`) using React Query, Topbar, Card/Table UI components
- **CSV_Importer**: The server-side logic that parses a CSV file containing `email` and `name` columns and creates Subscriber records in bulk
- **RBAC_System**: The existing role-based access control system (`packages/auth/src/rbac.ts`) that checks permissions per role

## Requirements

### Requirement 1: Subscriber CRUD API

**User Story:** As a store admin, I want to list, create, update, and delete subscribers via API, so that I can manage my newsletter audience.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/subscribers` with valid authentication, THE Admin_API SHALL return a paginated list of Subscriber records scoped to the authenticated user's store, including `id`, `email`, `name`, `active`, and `createdAt` fields
2. WHEN a GET request includes `search` query parameter, THE Admin_API SHALL filter Subscriber records where `email` or `name` contains the search term (case-insensitive)
3. WHEN a GET request includes `page` and `limit` query parameters, THE Admin_API SHALL return the corresponding page of results and a `total` count
4. WHEN a POST request is made to `/api/subscribers` with a valid `email` and optional `name`, THE Admin_API SHALL create a new Subscriber record with `active` defaulting to `true` and return the created record with status 201
5. IF a POST request to `/api/subscribers` provides an email that already exists for the same store, THEN THE Admin_API SHALL return a 409 conflict response with a descriptive error message
6. WHEN a PUT request is made to `/api/subscribers/[id]` with `name` or `active` fields, THE Admin_API SHALL update the matching Subscriber record and return the updated record
7. IF a PUT or DELETE request targets a Subscriber that does not belong to the authenticated user's store, THEN THE Admin_API SHALL return a 404 response
8. WHEN a DELETE request is made to `/api/subscribers/[id]`, THE Admin_API SHALL remove the Subscriber record and return a 204 response
9. IF a request to any subscriber endpoint lacks valid authentication or the required permission, THEN THE Admin_API SHALL return a 401 or 403 response

### Requirement 2: Subscriber CSV Import

**User Story:** As a store admin, I want to bulk import subscribers from a CSV file, so that I can migrate existing email lists efficiently.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/subscribers/import` with a CSV file containing `email` and `name` columns, THE CSV_Importer SHALL parse the file and create Subscriber records for each valid row scoped to the authenticated user's store
2. WHEN the CSV contains rows with email addresses that already exist for the store, THE CSV_Importer SHALL skip duplicate rows without failing the entire import
3. WHEN the CSV contains rows with invalid email format, THE CSV_Importer SHALL skip those rows and include them in the error summary
4. WHEN the import completes, THE Admin_API SHALL return a summary containing `created` count, `skipped` count, and a list of `errors` with row numbers and reasons
5. IF the CSV file is missing the required `email` column header, THEN THE Admin_API SHALL return a 400 response with a descriptive error message

### Requirement 3: Campaign CRUD API

**User Story:** As a store admin, I want to create, list, view, and update email campaigns, so that I can prepare marketing emails for my subscribers.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/campaigns` with valid authentication, THE Admin_API SHALL return a paginated list of Campaign records scoped to the authenticated user's store, including `id`, `name`, `subject`, `status`, `scheduledAt`, `sentAt`, `sentCount`, and `createdAt`
2. WHEN a GET request includes a `status` query parameter, THE Admin_API SHALL filter Campaign records by the specified CampaignStatus value
3. WHEN a POST request is made to `/api/campaigns` with `name`, `subject`, `body`, and optional `scheduledAt`, THE Admin_API SHALL create a new Campaign record with status DRAFT and return the created record with status 201
4. WHEN a POST request includes a `scheduledAt` value, THE Admin_API SHALL set the Campaign status to SCHEDULED
5. WHEN a GET request is made to `/api/campaigns/[id]`, THE Admin_API SHALL return the Campaign record along with aggregated subscriber stats: total recipients, sent count, opened count, and clicked count
6. WHEN a PUT request is made to `/api/campaigns/[id]` with updated fields, THE Admin_API SHALL update the Campaign record and return the updated record
7. IF a PUT request targets a Campaign whose status is not DRAFT, THEN THE Admin_API SHALL return a 400 response indicating that only DRAFT campaigns can be edited
8. IF a request targets a Campaign that does not belong to the authenticated user's store, THEN THE Admin_API SHALL return a 404 response

### Requirement 4: Campaign Send Flow

**User Story:** As a store admin, I want to trigger sending a campaign to all active subscribers, so that my marketing emails reach my audience.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/campaigns/[id]/send`, THE Admin_API SHALL set the Campaign status to SENDING and enqueue one CampaignJobData job per active Subscriber in the store to the Campaign_Queue
2. WHEN jobs are enqueued, THE Admin_API SHALL create a CampaignSubscriber record for each active Subscriber linked to the Campaign
3. IF a send request targets a Campaign whose status is not DRAFT or SCHEDULED, THEN THE Admin_API SHALL return a 400 response indicating the campaign cannot be sent in its current status
4. WHEN all CampaignJobData jobs for a Campaign have been processed by the Campaign_Worker, THE Campaign status SHALL be updated to SENT and the `sentAt` timestamp and `sentCount` SHALL be recorded
5. WHEN a POST request is made to `/api/campaigns/[id]/cancel`, THE Admin_API SHALL set the Campaign status to CANCELLED
6. IF a cancel request targets a Campaign whose status is not DRAFT or SCHEDULED, THEN THE Admin_API SHALL return a 400 response indicating the campaign cannot be cancelled in its current status

### Requirement 5: Storefront Newsletter Subscription

**User Story:** As a storefront visitor, I want to subscribe to a store's newsletter from the website, so that I can receive marketing emails.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/storefront/subscribe` with a valid `email` and `storeSlug`, THE Storefront_API SHALL create a new Subscriber record with `active` set to `true` for the matching store and return a success response
2. IF the email already exists as a Subscriber for the store, THEN THE Storefront_API SHALL return a success response without creating a duplicate (idempotent behavior)
3. IF the `storeSlug` does not match any existing store, THEN THE Storefront_API SHALL return a 404 response
4. IF the `email` field is missing or has an invalid format, THEN THE Storefront_API SHALL return a 400 response with a validation error message
5. THE Storefront_API SHALL NOT require authentication for the subscribe endpoint

### Requirement 6: Admin Email Marketing Dashboard

**User Story:** As a store admin, I want to see an overview of my email marketing performance, so that I can assess the effectiveness of my campaigns.

#### Acceptance Criteria

1. WHEN the admin navigates to `/dashboard/email`, THE Admin_Dashboard SHALL display summary stat cards showing total subscribers count, total campaigns sent count, and overall open rate percentage
2. WHEN the admin navigates to `/dashboard/email/subscribers`, THE Admin_Dashboard SHALL display a paginated table of subscribers with columns for email, name, active status, and created date
3. WHEN the admin uses the search input on the subscribers page, THE Admin_Dashboard SHALL filter the subscriber list by email or name in real time
4. WHEN the admin clicks "Add Subscriber" on the subscribers page, THE Admin_Dashboard SHALL display a form to enter email and name, and submit a POST request to create the subscriber
5. WHEN the admin clicks "Import CSV" on the subscribers page, THE Admin_Dashboard SHALL display a file upload dialog, submit the CSV to the import endpoint, and display the import summary result
6. WHEN the admin navigates to `/dashboard/email/campaigns`, THE Admin_Dashboard SHALL display a paginated list of campaigns with name, status badge, sent date, and sent count
7. WHEN the admin navigates to `/dashboard/email/campaigns/new`, THE Admin_Dashboard SHALL display a campaign creation form with fields for name, subject, rich text body editor, and an option to schedule or send immediately
8. WHEN the admin navigates to `/dashboard/email/campaigns/[id]`, THE Admin_Dashboard SHALL display the campaign details including delivery stats: sent count, open rate, and click rate

### Requirement 7: Storefront Newsletter UI Integration

**User Story:** As a storefront visitor, I want the newsletter signup form to actually subscribe me, so that I receive store emails after signing up.

#### Acceptance Criteria

1. WHEN a visitor submits the NewsletterSection form with a valid email, THE NewsletterSection component SHALL send a POST request to `/api/storefront/subscribe` with the email and store slug
2. WHEN the subscription request succeeds, THE NewsletterSection component SHALL display a success message to the visitor
3. WHEN the subscription request fails, THE NewsletterSection component SHALL display an error message to the visitor
4. IF the visitor submits an email that is already subscribed, THEN THE NewsletterSection component SHALL display the success message (matching the idempotent API behavior)

### Requirement 8: RBAC for Email Marketing

**User Story:** As a platform operator, I want email marketing actions to be permission-controlled, so that only authorized roles can manage campaigns and subscribers.

#### Acceptance Criteria

1. THE RBAC_System SHALL include a `campaigns:manage` permission that grants access to all subscriber and campaign API endpoints
2. THE RBAC_System SHALL grant the `campaigns:manage` permission to SUPER_ADMIN, ADMIN, and MANAGER roles
3. THE Admin_API SHALL require the `campaigns:manage` permission for all subscriber and campaign endpoints
4. IF a user without the `campaigns:manage` permission attempts to access a subscriber or campaign endpoint, THEN THE Admin_API SHALL return a 403 forbidden response

### Requirement 9: Input Validation

**User Story:** As a platform operator, I want all email marketing inputs to be validated, so that the system maintains data integrity.

#### Acceptance Criteria

1. THE Admin_API SHALL validate all request bodies for subscriber and campaign endpoints using Zod schemas
2. WHEN a subscriber creation or import request contains an email that does not match a valid email format, THE Admin_API SHALL return a 400 response with a validation error
3. WHEN a campaign creation request is missing `name`, `subject`, or `body`, THE Admin_API SHALL return a 400 response listing the missing fields
4. WHEN a campaign `scheduledAt` value is provided, THE Admin_API SHALL validate that the date is in the future
5. IF any request body fails Zod validation, THEN THE Admin_API SHALL return a 400 response with the Zod error details
