# Requirements: Complete Missing APIs

## Requirement 1: Affiliates API

### 1.1 Admin Affiliate CRUD

**User Story**: As an admin, I want to manage affiliates so that I can create referral partnerships and track their performance.

**Acceptance Criteria**:
- AC1: GET /api/affiliates returns a paginated list of affiliates scoped to the admin's tenant, including user name/email and click/commission counts.
- AC2: POST /api/affiliates creates a new affiliate with userId, code, and optional commissionRate (default 5). Returns 201 on success.
- AC3: GET /api/affiliates/[id] returns affiliate details including related clicks and commissions.
- AC4: PUT /api/affiliates/[id] updates commissionRate and/or active status. Returns 200 on success.
- AC5: All four endpoints require authentication with 'affiliates:manage' permission. Returns 403 if unauthorized.
- AC6: POST /api/affiliates returns 400 if the affiliate code already exists.
- AC7: POST /api/affiliates returns 400 if the userId already has an affiliate profile.

### 1.2 Affiliate Click Tracking

**User Story**: As a visitor, when I click an affiliate link, the click is recorded so the affiliate gets credit.

**Acceptance Criteria**:
- AC1: POST /api/affiliates/track accepts { code } without authentication and records a click with ip, userAgent, and referer metadata.
- AC2: Returns 200 with { affiliateCode } on success.
- AC3: Returns 404 if the affiliate code does not exist or the affiliate is inactive.

### 1.3 Affiliate Commissions Listing

**User Story**: As an admin, I want to view commissions for a specific affiliate to track earnings and payment status.

**Acceptance Criteria**:
- AC1: GET /api/affiliates/[id]/commissions returns a paginated list of commissions for the specified affiliate.
- AC2: Supports filtering by commission status (PENDING, APPROVED, PAID, CANCELLED) via query param.
- AC3: Requires authentication with 'affiliates:manage' permission.

---

## Requirement 2: Vendors API

### 2.1 Vendor Registration

**User Story**: As an authenticated user, I want to register as a vendor so I can sell products on the marketplace.

**Acceptance Criteria**:
- AC1: POST /api/vendors creates a vendor profile linked to the authenticated user with storeName (required), description, logoUrl, and bankInfo.
- AC2: New vendors are created with status PENDING and default commissionRate of 10.
- AC3: Returns 201 on success.
- AC4: Returns 400 if the user already has a vendor profile.
- AC5: Requires authentication but no specific RBAC permission (any authenticated user can register).

### 2.2 Admin Vendor Management

**User Story**: As an admin, I want to manage vendors so I can approve registrations, adjust commission rates, and handle payouts.

**Acceptance Criteria**:
- AC1: GET /api/vendors returns a paginated list of vendors scoped to the admin's tenant, including user info and product/payout counts.
- AC2: GET /api/vendors/[id] returns vendor details with associated products and payouts.
- AC3: PUT /api/vendors/[id] allows updating status (PENDING/APPROVED/SUSPENDED) and commissionRate.
- AC4: All three endpoints require authentication with 'vendors:manage' permission.

### 2.3 Vendor Payouts

**User Story**: As an admin, I want to create and track payouts for vendors.

**Acceptance Criteria**:
- AC1: GET /api/vendors/[id]/payouts returns a paginated list of payouts for the specified vendor.
- AC2: POST /api/vendors/[id]/payouts creates a payout with amount (required, positive) and optional notes. Status defaults to PENDING.
- AC3: Returns 201 on success, 400 if amount is invalid.
- AC4: Both endpoints require authentication with 'vendors:manage' permission.

---

## Requirement 3: Reviews API

### 3.1 Customer Review Submission

**User Story**: As a customer, I want to submit a review for a product I've interacted with so other shoppers can benefit from my experience.

**Acceptance Criteria**:
- AC1: POST /api/storefront/reviews accepts { productId, rating (1-5), title?, body? } from an authenticated user.
- AC2: New reviews are created with status PENDING.
- AC3: Returns 201 on success.
- AC4: Returns 400 if the user has already reviewed the specified product.
- AC5: Returns 400 if the product does not exist or is not ACTIVE.
- AC6: Requires authentication (any authenticated user).

### 3.2 Admin Review Moderation

**User Story**: As an admin, I want to moderate reviews so I can approve or reject them before they appear on the storefront.

**Acceptance Criteria**:
- AC1: GET /api/reviews returns a paginated list of all reviews scoped to the admin's store, with product and user info.
- AC2: Supports filtering by status (PENDING, APPROVED, REJECTED), productId, and rating via query params.
- AC3: PUT /api/reviews/[id] updates the review status to APPROVED or REJECTED.
- AC4: GET requires 'products:read' permission; PUT requires 'products:write' permission.

### 3.3 Public Product Reviews

**User Story**: As a storefront visitor, I want to see approved reviews for a product so I can make informed purchase decisions.

**Acceptance Criteria**:
- AC1: GET /api/storefront/products/[slug]/reviews returns a paginated list of APPROVED reviews for the product identified by slug.
- AC2: Response includes avgRating calculated from all approved reviews.
- AC3: No authentication required.
- AC4: Returns 404 if the product slug does not exist.
- AC5: Only reviews with status APPROVED are returned; PENDING and REJECTED reviews are never exposed.

---

## Requirement 4: Categories API

### 4.1 Admin Category CRUD

**User Story**: As an admin, I want to manage product categories with a hierarchical tree structure.

**Acceptance Criteria**:
- AC1: GET /api/categories returns all categories for the admin's store as a flat list (admin view), including product counts.
- AC2: POST /api/categories creates a category with name, slug (required), and optional parentId, description, imageUrl, active (default true), sortOrder (default 0).
- AC3: PUT /api/categories/[id] updates any category field.
- AC4: DELETE /api/categories/[id] deletes a category only if it has zero associated products and zero child categories. Returns 400 otherwise.
- AC5: POST returns 400 if the slug already exists within the store.
- AC6: POST returns 400 if parentId is provided but does not reference an existing category in the same store.
- AC7: GET/POST require 'products:read'/'products:write'; PUT requires 'products:write'; DELETE requires 'products:delete'.

### 4.2 Public Storefront Categories

**User Story**: As a storefront visitor, I want to browse product categories in a tree structure.

**Acceptance Criteria**:
- AC1: GET /api/storefront/categories returns active categories for the store as a nested tree structure.
- AC2: Only categories with active = true are included.
- AC3: Categories are sorted by sortOrder within each level.
- AC4: No authentication required. Store is resolved from a storeSlug query parameter or request header.

---

## Requirement 5: Cart API (Server-Side)

### 5.1 Cart Item Management

**User Story**: As an authenticated customer, I want to manage my shopping cart on the server so my cart persists across devices and enables abandoned cart recovery.

**Acceptance Criteria**:
- AC1: GET /api/cart returns the user's cart items with product details (name, slug, price, images) and variant info, plus calculated total and itemCount.
- AC2: POST /api/cart adds an item with { productId, variantId?, quantity }. If the same productId+variantId already exists, quantity is incremented (upsert behavior).
- AC3: PUT /api/cart/[id] updates the quantity of a specific cart item.
- AC4: DELETE /api/cart/[id] removes a specific cart item.
- AC5: DELETE /api/cart clears all cart items for the authenticated user.
- AC6: All endpoints require authentication. No specific RBAC permission needed.
- AC7: Users can only access and modify their own cart items. Attempting to access another user's cart item returns 404.

### 5.2 Cart Validation

**User Story**: As the system, I want to ensure cart items reference valid products so customers don't encounter errors at checkout.

**Acceptance Criteria**:
- AC1: POST /api/cart returns 400 if the productId does not exist or the product status is not ACTIVE.
- AC2: POST /api/cart returns 400 if variantId is provided but does not belong to the specified product.
- AC3: POST /api/cart returns 400 if quantity is not a positive integer.
- AC4: PUT /api/cart/[id] returns 400 if quantity is not a positive integer.

---

## Cross-Cutting Requirements

### 6.1 Tenant Isolation

**Acceptance Criteria**:
- AC1: All admin endpoints resolve the store via `prisma.store.findFirst({ where: { tenantId: user.tenantId } })` and scope all queries by storeId.
- AC2: No endpoint accepts storeId as a client-provided parameter.

### 6.2 Consistent Response Format

**Acceptance Criteria**:
- AC1: All success responses use `{ success: true, data: ... }` format via response helpers.
- AC2: All error responses use `{ success: false, error: "message" }` format.
- AC3: All paginated responses include `{ data, total, page, limit }`.

### 6.3 Input Validation

**Acceptance Criteria**:
- AC1: All POST/PUT endpoints validate request bodies with Zod schemas before any database operations.
- AC2: Invalid input returns 400 with the first validation error message.

### 6.4 Method Not Allowed

**Acceptance Criteria**:
- AC1: All endpoints return 405 for unsupported HTTP methods.
