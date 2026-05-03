# Requirements Document

## Introduction

This feature adds a complete inventory management system to the multi-tenant e-commerce SaaS platform. It covers inventory tracking APIs, warehouse management, stock movement logging, low stock alerts, order-inventory integration (stock reservation and fulfillment), and admin dashboard pages. The Prisma schema already defines the Inventory, Warehouse, and StockMovement models. The checkout flow creates orders but does not yet update inventory. This feature closes that gap and provides full visibility into stock levels.

## Glossary

- **Inventory_API**: The set of Next.js API route handlers under `/api/inventory` responsible for listing, updating, and adjusting product inventory records.
- **Warehouse_API**: The set of Next.js API route handlers under `/api/warehouses` responsible for CRUD operations on warehouse records.
- **Movement_API**: The Next.js API route handler at `/api/inventory/[productId]/movements` responsible for listing stock movement history for a product.
- **Alert_API**: The Next.js API route handler at `/api/inventory/alerts` responsible for listing products whose quantity is at or below the low stock alert threshold.
- **Checkout_Handler**: The existing Next.js API route handler at `/api/orders/checkout` that creates orders during the checkout flow.
- **Payment_Webhook**: The existing Next.js API route handlers at `/api/webhooks/stripe` and `/api/webhooks/mercadopago` that process payment provider callbacks.
- **Inventory_Dashboard**: The set of Next.js admin pages under `/dashboard/inventory` that display inventory overview, product inventory lists, product detail with movement history, warehouse management, and low stock alerts.
- **Available_Stock**: The computed value equal to `quantity - reserved` for a given Inventory record.
- **Stock_Reservation**: The process of incrementing the `reserved` field on an Inventory record when an order is created, without changing `quantity`.
- **Stock_Fulfillment**: The process of decrementing both `quantity` and `reserved` on an Inventory record when payment is confirmed, accompanied by creation of an OUT StockMovement.
- **Stock_Release**: The process of decrementing the `reserved` field on an Inventory record when an order is cancelled, accompanied by creation of a RETURN StockMovement.
- **StockMovement**: A database record that logs a change to inventory with a type (IN, OUT, ADJUSTMENT, RETURN), quantity, optional reason, and optional orderId.
- **Low_Stock_Threshold**: The `lowStockAlert` field on an Inventory record. A product is considered low stock when `quantity <= lowStockAlert`.

## Requirements

### Requirement 1: List Inventory

**User Story:** As an admin, I want to list all products with their inventory information, so that I can see stock levels across the catalog.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/inventory`, THE Inventory_API SHALL return a paginated list of products including `quantity`, `reserved`, Available_Stock, and `lowStockAlert` for each product.
2. WHEN a `search` query parameter is provided, THE Inventory_API SHALL filter products whose name contains the search term using case-insensitive matching.
3. WHEN a `warehouseId` query parameter is provided, THE Inventory_API SHALL filter products assigned to the specified warehouse.
4. WHEN a `lowStock` query parameter is set to `true`, THE Inventory_API SHALL filter products where `quantity` is less than or equal to `lowStockAlert`.
5. THE Inventory_API SHALL require the `products:read` permission to access the inventory list endpoint.

### Requirement 2: Update Inventory Settings

**User Story:** As an admin, I want to update inventory settings for a product, so that I can configure low stock thresholds and warehouse assignments.

#### Acceptance Criteria

1. WHEN a PUT request is made to `/api/inventory/[productId]` with a valid body, THE Inventory_API SHALL update the `lowStockAlert` and `warehouseId` fields on the corresponding Inventory record.
2. IF the specified productId does not have an associated Inventory record, THEN THE Inventory_API SHALL return a 404 status with an error message.
3. WHEN a `warehouseId` is provided in the request body, THE Inventory_API SHALL validate that the referenced Warehouse exists and is active before applying the update.
4. IF the referenced Warehouse does not exist or is inactive, THEN THE Inventory_API SHALL return a 400 status with a descriptive error message.
5. THE Inventory_API SHALL require the `products:write` permission to access the update inventory endpoint.

### Requirement 3: Manual Stock Adjustment

**User Story:** As an admin, I want to manually adjust stock for a product, so that I can correct inventory after physical counts, receiving shipments, or handling damages.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/inventory/[productId]/adjust` with a valid body containing `type` (IN, OUT, or ADJUSTMENT), `quantity`, and optional `reason`, THE Inventory_API SHALL update the Inventory `quantity` field and create a corresponding StockMovement record.
2. WHEN the adjustment type is IN, THE Inventory_API SHALL increment the Inventory `quantity` by the specified amount.
3. WHEN the adjustment type is OUT, THE Inventory_API SHALL decrement the Inventory `quantity` by the specified amount.
4. WHEN the adjustment type is ADJUSTMENT, THE Inventory_API SHALL set the Inventory `quantity` to the specified amount and create a StockMovement with a quantity equal to the difference between the new and old values.
5. IF an OUT adjustment would cause `quantity` to become negative, THEN THE Inventory_API SHALL return a 400 status with an error message and leave the Inventory record unchanged.
6. THE Inventory_API SHALL execute the quantity update and StockMovement creation within a single database transaction.
7. THE Inventory_API SHALL require the `products:write` permission to access the stock adjustment endpoint.

### Requirement 4: Warehouse CRUD

**User Story:** As an admin, I want to manage warehouses, so that I can organize where inventory is stored.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/warehouses`, THE Warehouse_API SHALL return a list of all warehouses.
2. WHEN a POST request is made to `/api/warehouses` with a valid body containing `name`, `address`, `city`, `state`, and `zipCode`, THE Warehouse_API SHALL create a new Warehouse record and return it with a 201 status.
3. WHEN a PUT request is made to `/api/warehouses/[id]` with a valid body, THE Warehouse_API SHALL update the specified Warehouse record.
4. WHEN a DELETE request is made to `/api/warehouses/[id]`, THE Warehouse_API SHALL delete the specified Warehouse record and return a 204 status.
5. IF a DELETE request targets a Warehouse that has Inventory records assigned to it, THEN THE Warehouse_API SHALL return a 409 status with an error message indicating the warehouse cannot be deleted while inventory is assigned.
6. IF the specified warehouse id does not exist, THEN THE Warehouse_API SHALL return a 404 status with an error message.
7. THE Warehouse_API SHALL require the `products:write` permission for create, update, and delete operations.
8. THE Warehouse_API SHALL require the `products:read` permission for the list operation.

### Requirement 5: Stock Movement History

**User Story:** As an admin, I want to view the stock movement history for a product, so that I can audit changes to inventory over time.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/inventory/[productId]/movements`, THE Movement_API SHALL return a paginated list of StockMovement records for the specified product, ordered by `createdAt` descending.
2. WHEN `page` and `limit` query parameters are provided, THE Movement_API SHALL apply pagination accordingly.
3. WHEN a `type` query parameter is provided (IN, OUT, ADJUSTMENT, or RETURN), THE Movement_API SHALL filter movements by the specified type.
4. THE Movement_API SHALL require the `products:read` permission to access the movements endpoint.
5. IF the specified productId does not have an associated Inventory record, THEN THE Movement_API SHALL return a 404 status with an error message.

### Requirement 6: Low Stock Alerts

**User Story:** As an admin, I want to see which products are running low on stock, so that I can reorder before running out.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/inventory/alerts`, THE Alert_API SHALL return a list of products where `quantity` is less than or equal to `lowStockAlert`.
2. THE Alert_API SHALL include the product name, current `quantity`, `lowStockAlert` threshold, and Available_Stock for each alert entry.
3. THE Alert_API SHALL order results by the difference between `quantity` and `lowStockAlert` ascending, so the most critical items appear first.
4. THE Alert_API SHALL require the `products:read` permission to access the alerts endpoint.

### Requirement 7: Stock Reservation on Order Creation

**User Story:** As a customer, I want stock to be reserved when I place an order, so that the items I purchased are held for me.

#### Acceptance Criteria

1. WHEN an order is created through the Checkout_Handler, THE Checkout_Handler SHALL increment the `reserved` field on the Inventory record for each ordered product by the ordered quantity.
2. IF the Available_Stock for any product in the order is less than the ordered quantity, THEN THE Checkout_Handler SHALL return a 400 status with an error message identifying the product with insufficient stock, and the order SHALL NOT be created.
3. THE Checkout_Handler SHALL execute the stock reservation and order creation within a single database transaction.
4. THE Checkout_Handler SHALL validate stock availability for all items before creating the order.

### Requirement 8: Stock Fulfillment on Payment Confirmation

**User Story:** As a store operator, I want inventory to be decremented when payment is confirmed, so that stock levels reflect actual sold quantities.

#### Acceptance Criteria

1. WHEN a payment webhook confirms a successful payment, THE Payment_Webhook SHALL decrement the `quantity` field on the Inventory record for each item in the associated order by the ordered quantity.
2. WHEN a payment webhook confirms a successful payment, THE Payment_Webhook SHALL decrement the `reserved` field on the Inventory record for each item in the associated order by the ordered quantity.
3. WHEN a payment webhook confirms a successful payment, THE Payment_Webhook SHALL create an OUT StockMovement record for each item in the associated order, with the `orderId` set to the order id and `quantity` set to the ordered quantity.
4. THE Payment_Webhook SHALL execute all inventory updates and StockMovement creations within a single database transaction.

### Requirement 9: Stock Release on Order Cancellation

**User Story:** As a store operator, I want reserved stock to be released when an order is cancelled, so that the items become available for other customers.

#### Acceptance Criteria

1. WHEN an order status is changed to CANCELLED, THE Inventory_API SHALL decrement the `reserved` field on the Inventory record for each item in the order by the ordered quantity.
2. WHEN an order is cancelled, THE Inventory_API SHALL create a RETURN StockMovement record for each item in the order, with the `orderId` set to the order id and `quantity` set to the ordered quantity.
3. THE Inventory_API SHALL execute the stock release and StockMovement creation within a single database transaction.
4. IF the order has already been fulfilled (payment confirmed and stock decremented), THEN THE Inventory_API SHALL increment the `quantity` field instead of decrementing `reserved`, and create a RETURN StockMovement.

### Requirement 10: Inventory Dashboard Overview

**User Story:** As an admin, I want an inventory overview dashboard, so that I can quickly assess the state of my inventory.

#### Acceptance Criteria

1. WHEN an admin navigates to `/dashboard/inventory`, THE Inventory_Dashboard SHALL display stat cards showing total products with inventory, count of low stock products, and total stock value (sum of `quantity * product.price` across all products).
2. THE Inventory_Dashboard SHALL display a summary of recent stock movements.
3. THE Inventory_Dashboard SHALL provide navigation links to the products inventory list, warehouse management, and alerts pages.

### Requirement 11: Inventory Products List Page

**User Story:** As an admin, I want to see a list of all products with their inventory details, so that I can manage stock levels.

#### Acceptance Criteria

1. WHEN an admin navigates to `/dashboard/inventory/products`, THE Inventory_Dashboard SHALL display a table of products showing product name, current `quantity`, `reserved`, Available_Stock, and alert status.
2. WHEN a product's `quantity` is less than or equal to its `lowStockAlert`, THE Inventory_Dashboard SHALL display a visual indicator (badge or color) marking the product as low stock.
3. THE Inventory_Dashboard SHALL support searching products by name.
4. THE Inventory_Dashboard SHALL support pagination of the product list.

### Requirement 12: Product Inventory Detail Page

**User Story:** As an admin, I want to view detailed inventory information for a single product, so that I can see its movement history and adjust stock.

#### Acceptance Criteria

1. WHEN an admin navigates to `/dashboard/inventory/products/[id]`, THE Inventory_Dashboard SHALL display the product name, current `quantity`, `reserved`, Available_Stock, `lowStockAlert`, and assigned warehouse.
2. THE Inventory_Dashboard SHALL display a paginated table of StockMovement records for the product, showing type, quantity, reason, orderId, and creation date.
3. THE Inventory_Dashboard SHALL provide a form to perform manual stock adjustments (type, quantity, reason) that submits to the stock adjustment API endpoint.
4. THE Inventory_Dashboard SHALL provide a form to update inventory settings (lowStockAlert, warehouseId) that submits to the update inventory API endpoint.

### Requirement 13: Warehouse Management Page

**User Story:** As an admin, I want to manage warehouses from the dashboard, so that I can create, edit, and remove warehouse locations.

#### Acceptance Criteria

1. WHEN an admin navigates to `/dashboard/inventory/warehouses`, THE Inventory_Dashboard SHALL display a list of all warehouses with name, address, city, state, zip code, and active status.
2. THE Inventory_Dashboard SHALL provide a form to create a new warehouse.
3. THE Inventory_Dashboard SHALL provide a form to edit an existing warehouse.
4. THE Inventory_Dashboard SHALL provide a delete action for each warehouse.
5. WHEN a warehouse deletion fails due to assigned inventory, THE Inventory_Dashboard SHALL display the error message from the API to the admin.

### Requirement 14: Low Stock Alerts Page

**User Story:** As an admin, I want a dedicated page for low stock alerts, so that I can quickly identify and act on products that need restocking.

#### Acceptance Criteria

1. WHEN an admin navigates to `/dashboard/inventory/alerts`, THE Inventory_Dashboard SHALL display a list of products where `quantity` is less than or equal to `lowStockAlert`.
2. THE Inventory_Dashboard SHALL display the product name, current `quantity`, `lowStockAlert` threshold, Available_Stock, and a link to the product inventory detail page for each alert entry.
3. THE Inventory_Dashboard SHALL order the list by urgency, with the most critically low stock products appearing first.
