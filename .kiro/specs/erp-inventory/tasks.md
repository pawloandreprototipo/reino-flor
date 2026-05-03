# Implementation Plan: ERP Inventory Management

## Overview

This plan implements inventory management for the e-commerce platform. It starts with the shared inventory service, then builds API endpoints (inventory CRUD, warehouses, alerts, movements), integrates stock operations into the existing checkout/webhook/order flows, and finishes with admin hooks and dashboard pages. The Prisma schema already has all required models — no migrations needed.

## Tasks

- [ ] 1. Create the inventory service module
  - [ ] 1.1 Create `apps/api/lib/inventory.ts` with `reserveStock`, `fulfillStock`, `releaseStock`, and `restoreStock` functions
    - `reserveStock(items, tx)`: For each item, read inventory within the transaction, verify `quantity - reserved >= requestedQty`, then increment `reserved`. If any item fails, throw an error (all-or-nothing).
    - `fulfillStock(orderId, items, tx)`: Decrement both `quantity` and `reserved` for each item, create an OUT StockMovement with the orderId.
    - `releaseStock(orderId, items, tx)`: Decrement `reserved` for each item, create a RETURN StockMovement with the orderId.
    - `restoreStock(orderId, items, tx)`: Increment `quantity` for each item, create a RETURN StockMovement with the orderId.
    - All functions accept a Prisma transaction client (`tx`) parameter.
    - _Requirements: 7.1, 7.2, 7.4, 8.1, 8.2, 8.3, 9.1, 9.2, 9.4_

  - [ ]* 1.2 Write unit tests for the inventory service
    - Test `reserveStock` with sufficient and insufficient stock scenarios
    - Test `fulfillStock` decrements quantity and reserved, creates OUT movements
    - Test `releaseStock` decrements reserved only, creates RETURN movements
    - Test `restoreStock` increments quantity, creates RETURN movements
    - Test all-or-nothing behavior: if one item fails reservation, no items are reserved
    - _Requirements: 7.1, 7.2, 7.4, 8.1, 8.2, 8.3, 9.1, 9.2, 9.4_

- [ ] 2. Implement inventory API endpoints
  - [ ] 2.1 Create `apps/api/pages/api/inventory/index.ts` — GET list endpoint
    - Return paginated list of products with `quantity`, `reserved`, computed `availableStock`, `lowStockAlert`, product name, warehouse info
    - Support `search` (case-insensitive product name filter), `warehouseId`, `lowStock` (boolean), `page`, `limit` query params
    - Scope to authenticated user's tenant store
    - Require `products:read` permission via `withAuth`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 2.2 Create `apps/api/pages/api/inventory/[productId]/index.ts` — PUT update endpoint
    - Accept `lowStockAlert` (number) and `warehouseId` (string, optional) in request body
    - Validate warehouse exists and is active when `warehouseId` is provided
    - Return 404 if inventory record not found for the product
    - Return 400 if warehouse not found or inactive
    - Require `products:write` permission
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 2.3 Create `apps/api/pages/api/inventory/[productId]/adjust.ts` — POST stock adjustment endpoint
    - Accept `type` (IN, OUT, ADJUSTMENT), `quantity` (number), `reason` (optional string) via Zod validation
    - IN: increment inventory quantity by amount
    - OUT: decrement inventory quantity by amount; return 400 if would go negative
    - ADJUSTMENT: set inventory quantity to the specified value; create movement with `|newQty - oldQty|`
    - Create a StockMovement record in the same transaction
    - Require `products:write` permission
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 2.4 Create `apps/api/pages/api/inventory/[productId]/movements.ts` — GET movements endpoint
    - Return paginated list of StockMovement records ordered by `createdAt` descending
    - Support `page`, `limit`, `type` (IN/OUT/ADJUSTMENT/RETURN) query params
    - Return 404 if inventory record not found
    - Require `products:read` permission
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 2.5 Create `apps/api/pages/api/inventory/alerts.ts` — GET low stock alerts endpoint
    - Return products where `quantity <= lowStockAlert`
    - Include product name, `quantity`, `lowStockAlert`, computed `availableStock`
    - Order by `(quantity - lowStockAlert)` ascending (most critical first)
    - Require `products:read` permission
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.6 Write unit tests for inventory API endpoints
    - Test GET list with pagination, search, warehouseId, and lowStock filters
    - Test PUT update with valid data, missing inventory (404), invalid warehouse (400)
    - Test POST adjust for IN, OUT, ADJUSTMENT types and negative stock rejection
    - Test GET movements with pagination and type filter
    - Test GET alerts ordering and response shape
    - Test permission enforcement on all endpoints
    - _Requirements: 1.1–1.5, 2.1–2.5, 3.1–3.7, 5.1–5.5, 6.1–6.4_

- [ ] 3. Implement warehouse API endpoints
  - [ ] 3.1 Create `apps/api/pages/api/warehouses/index.ts` — GET list and POST create
    - GET: return all warehouses, require `products:read`
    - POST: create warehouse with `name`, `address`, `city`, `state`, `zipCode` via Zod validation, return 201, require `products:write`
    - _Requirements: 4.1, 4.2, 4.7, 4.8_

  - [ ] 3.2 Create `apps/api/pages/api/warehouses/[id].ts` — PUT update and DELETE
    - PUT: update warehouse fields, return 404 if not found, require `products:write`
    - DELETE: delete warehouse, return 204 on success, return 409 if inventory is assigned, return 404 if not found, require `products:write`
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 3.3 Write unit tests for warehouse API endpoints
    - Test GET list, POST create, PUT update, DELETE
    - Test 409 on delete with assigned inventory
    - Test 404 for missing warehouse
    - _Requirements: 4.1–4.8_

- [ ] 4. Checkpoint — Verify all API endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Integrate stock operations into existing order flows
  - [ ] 5.1 Modify `apps/api/pages/api/orders/checkout.ts` to call `reserveStock`
    - Wrap order creation and stock reservation in a single `prisma.$transaction`
    - Call `reserveStock(items, tx)` before creating the order
    - If `reserveStock` throws (insufficient stock), return 400 with the product name
    - Move the existing `prisma.order.create` call inside the transaction
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 5.2 Modify `apps/api/pages/api/webhooks/stripe.ts` to call `fulfillStock`
    - On `payment_intent.succeeded`, fetch order items, then call `fulfillStock(orderId, items, tx)` inside a transaction alongside the existing payment/order status updates
    - Check if order is already CONFIRMED to avoid double fulfillment
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 5.3 Modify `apps/api/pages/api/webhooks/mercadopago.ts` to call `fulfillStock`
    - On payment approval (both mock and production paths), fetch order items, then call `fulfillStock(orderId, items, tx)` inside a transaction
    - Check if order is already CONFIRMED to avoid double fulfillment
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 5.4 Modify `apps/api/pages/api/orders/[id].ts` to call `releaseStock` or `restoreStock` on cancellation
    - When status changes to CANCELLED, check the current order status:
      - If order was PENDING (not yet fulfilled): call `releaseStock(orderId, items, tx)` to decrement `reserved`
      - If order was CONFIRMED or later (already fulfilled): call `restoreStock(orderId, items, tx)` to increment `quantity`
    - Wrap the order update and stock operation in a single transaction
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 5.5 Write integration tests for order-inventory flows
    - Test checkout reserves stock and rejects on insufficient stock
    - Test webhook fulfills stock and creates OUT movements
    - Test cancellation of pending order releases reserved stock
    - Test cancellation of confirmed order restores quantity
    - Test idempotent webhook handling (no double fulfillment)
    - _Requirements: 7.1–7.4, 8.1–8.4, 9.1–9.4_

- [ ] 6. Checkpoint — Verify order integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Create admin hooks for inventory management
  - [ ] 7.1 Create `apps/admin/hooks/useInventory.ts`
    - `useInventory(filters)`: GET `/api/inventory` with query params (page, limit, search, warehouseId, lowStock)
    - `useProductInventory(productId)`: GET `/api/inventory/[productId]` (single product detail — reuse list endpoint filtered or add a dedicated call)
    - `useUpdateInventory(productId)`: PUT `/api/inventory/[productId]` mutation, invalidate inventory queries on success
    - `useAdjustStock(productId)`: POST `/api/inventory/[productId]/adjust` mutation, invalidate inventory queries on success
    - `useStockMovements(productId, filters)`: GET `/api/inventory/[productId]/movements` with pagination and type filter
    - `useInventoryAlerts()`: GET `/api/inventory/alerts`
    - Follow the same `useQuery`/`useMutation` patterns as `useProducts.ts`
    - _Requirements: 10.1, 10.2, 10.3, 11.1, 11.3, 11.4, 12.1, 12.2, 12.3, 12.4, 14.1_

  - [ ] 7.2 Create `apps/admin/hooks/useWarehouses.ts`
    - `useWarehouses()`: GET `/api/warehouses`
    - `useCreateWarehouse()`: POST `/api/warehouses` mutation
    - `useUpdateWarehouse(id)`: PUT `/api/warehouses/[id]` mutation
    - `useDeleteWarehouse()`: DELETE `/api/warehouses/[id]` mutation
    - Invalidate warehouse queries on success for all mutations
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 8. Create admin inventory dashboard pages
  - [ ] 8.1 Create `apps/admin/app/dashboard/inventory/page.tsx` — Inventory overview
    - Display stat cards: total products with inventory, low stock count, total stock value
    - Display recent stock movements summary
    - Navigation links to products list, warehouses, and alerts pages
    - Use `useInventory` and `useInventoryAlerts` hooks
    - Reuse existing `StatCard`, `Card`, `Topbar` components
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 8.2 Create `apps/admin/app/dashboard/inventory/products/page.tsx` — Products inventory list
    - Paginated table showing product name, quantity, reserved, available stock, alert status
    - Search input for filtering by product name
    - Low stock badge (visual indicator) when `quantity <= lowStockAlert`
    - Rows link to product inventory detail page
    - Reuse existing `Table`, `Input`, `Badge` components
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ] 8.3 Create `apps/admin/app/dashboard/inventory/products/[id]/page.tsx` — Product inventory detail
    - Display product name, quantity, reserved, available stock, lowStockAlert, assigned warehouse
    - Paginated stock movements table (type, quantity, reason, orderId, date)
    - Manual stock adjustment form (type select, quantity input, reason input, submit button)
    - Inventory settings form (lowStockAlert number input, warehouseId select, submit button)
    - Use `useProductInventory`, `useStockMovements`, `useAdjustStock`, `useUpdateInventory`, `useWarehouses` hooks
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ] 8.4 Create `apps/admin/app/dashboard/inventory/warehouses/page.tsx` — Warehouse management
    - List all warehouses with name, address, city, state, zip code, active status
    - Create warehouse form (name, address, city, state, zipCode fields)
    - Edit warehouse inline or modal form
    - Delete button per warehouse with error display on 409 conflict
    - Use `useWarehouses`, `useCreateWarehouse`, `useUpdateWarehouse`, `useDeleteWarehouse` hooks
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 8.5 Create `apps/admin/app/dashboard/inventory/alerts/page.tsx` — Low stock alerts
    - List products where quantity <= lowStockAlert, ordered by urgency
    - Show product name, quantity, lowStockAlert threshold, available stock
    - Each row links to the product inventory detail page
    - Use `useInventoryAlerts` hook
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 9. Add inventory navigation to the admin sidebar
  - Modify the Sidebar component to include an "Inventário" section with links to `/dashboard/inventory`, `/dashboard/inventory/products`, `/dashboard/inventory/warehouses`, `/dashboard/inventory/alerts`
  - Follow the existing navigation pattern used for other sections (orders, products, etc.)
  - _Requirements: 10.3_

- [ ] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The Prisma schema already has Inventory, Warehouse, and StockMovement models — no migration tasks needed
- All API endpoints follow the existing patterns: `withAuth` for permissions, `ok`/`badRequest`/`notFound`/`conflict` response helpers, Zod for validation
- Admin hooks follow the `useQuery`/`useMutation` pattern from `useProducts.ts`
- Admin pages reuse existing UI components (StatCard, Card, Table, Badge, Input, Button, Topbar)
