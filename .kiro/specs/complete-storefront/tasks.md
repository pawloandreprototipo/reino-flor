# Tasks: Complete Storefront

## Task 1: Shared Hooks and Utilities
- [x] 1.1 Create `useCategories` hook in `apps/storefront/hooks/useCategories.ts` that fetches the category tree from `GET /api/storefront/categories` using React Query with 5-minute staleTime. Export the `CategoryNode` interface.
- [x] 1.2 Create variant utility functions in `apps/storefront/lib/variants.ts`: `extractVariantOptions()`, `findMatchingVariant()`, `getAvailableOptionsForSelection()`, and `computeVariantState()` with the signatures and logic defined in the design document.
- [x] 1.3 Create `buildBreadcrumbs()` and `findCategoryInTree()` functions in `apps/storefront/lib/categories.ts` as specified in the design.
- [x] 1.4 Create `parseSearchParams()` and `buildSearchUrl()` functions in `apps/storefront/lib/search.ts` for URL-synced search filter state.
- [x] 1.5 Create `useOrders` hook in `apps/storefront/hooks/useOrders.ts` that fetches user orders from `GET /api/orders` (authenticated). Export `OrderSummary` interface.
- [x] 1.6 Create `useAddresses` hook in `apps/storefront/hooks/useAddresses.ts` with `useAddresses()` (list), `useCreateAddress()`, `useUpdateAddress()`, `useDeleteAddress()` mutations using React Query. The API endpoints are inferred from the Address model (GET/POST/PUT/DELETE on a user addresses endpoint).
- [x] 1.7 Create `useReviews` hook in `apps/storefront/hooks/useReviews.ts` that fetches paginated reviews from `GET /api/storefront/products/[slug]/reviews` and provides a `useSubmitReview()` mutation for `POST /api/storefront/reviews`.
- [x] 1.8 Create `useServerCart` hook in `apps/storefront/hooks/useServerCart.ts` that wraps `GET /api/cart`, `POST /api/cart`, `PUT /api/cart/[id]`, `DELETE /api/cart/[id]` with React Query. Include `mergeCartWithServer()` function.

## Task 2: Category Pages
- [x] 2.1 Create the category listing page at `apps/storefront/app/categorias/page.tsx`. Fetch categories using `useCategories`, render top-level categories as cards with name, image, description, and product count. Link each card to `/categorias/[slug]`.
- [x] 2.2 Create the category detail page at `apps/storefront/app/categorias/[slug]/page.tsx`. Show breadcrumbs using `buildBreadcrumbs()`, category name/description, child category chips (if any), and a product grid filtered by `categoryId` using `useProducts`. Include pagination.

## Task 3: Enhanced Product Detail Page
- [x] 3.1 Create `VariantSelector` component in `apps/storefront/components/ui/VariantSelector.tsx`. Use `computeVariantState()` to render option groups with cross-filtering. Show each option type as a labeled group of selectable buttons. Dim out-of-stock options. Update parent with selected variant via `onSelect` callback.
- [x] 3.2 Create `ReviewSection` component in `apps/storefront/components/ui/ReviewSection.tsx`. Show average rating stars, total count, review list with pagination (load more), and review form for authenticated users. Use `useReviews` hook and `useAuth` context. Show "Faça login para avaliar" for unauthenticated users.
- [x] 3.3 Create `RelatedProducts` component in `apps/storefront/components/ui/RelatedProducts.tsx`. Fetch up to 4 products from the same category (excluding current product) using `useProducts({ categoryId, limit: 5 })` and render as a horizontal scroll of `ProductCard` components.
- [x] 3.4 Refactor `apps/storefront/app/produtos/[slug]/page.tsx` to integrate `VariantSelector`, `ReviewSection`, and `RelatedProducts`. Replace the existing inline variant buttons with `VariantSelector`. Add image gallery with thumbnail selection. Update add-to-cart to use the matched variant's price and ID.

## Task 4: Search Results Page
- [x] 4.1 Create `SearchFilters` component in `apps/storefront/components/ui/SearchFilters.tsx`. Render category filter as a collapsible list (from `useCategories`), sort dropdown (newest, price asc, price desc, name A-Z), and a "Limpar filtros" button. Accept filter state and change callbacks as props.
- [x] 4.2 Create the search page at `apps/storefront/app/busca/page.tsx`. Read query params using `useSearchParams`, parse with `parseSearchParams()`, fetch products with `useProducts`, render `SearchFilters` sidebar and product grid. Update URL on filter changes using `buildSearchUrl()` and `router.push()`. Show empty state when no results.

## Task 5: Authentication Pages
- [x] 5.1 Create the login page at `apps/storefront/app/login/page.tsx`. Form with email and password fields validated with Zod. On submit, call `AuthContext.login()`. On success, redirect to `searchParams.redirect` or `/`. Show error on failure. Include link to `/cadastro`.
- [x] 5.2 Create the register page at `apps/storefront/app/cadastro/page.tsx`. Form with name, email, password, and confirmPassword fields validated with Zod (password min 6 chars, passwords must match). On submit, call `POST /api/auth/register` then auto-login. Show errors. Include link to `/login`.

## Task 6: User Account Pages
- [x] 6.1 Create the account layout at `apps/storefront/app/conta/layout.tsx`. Check auth state from `useAuth()`. If not authenticated, redirect to `/login?redirect=/conta`. Render sidebar with user info and nav links (Perfil, Pedidos, Endereços). On mobile, render as horizontal tabs.
- [x] 6.2 Create the profile page at `apps/storefront/app/conta/page.tsx`. Display user name, email (read-only), and phone. Allow editing name and phone with a form. Call `PUT /api/auth/me` or equivalent on save.
- [x] 6.3 Create the order history page at `apps/storefront/app/conta/pedidos/page.tsx`. Use `useOrders` to fetch orders. Render as a list of cards with order ID, date, status badge (color-coded), item count, total. Link each to `/pedido/[id]`. Show empty state if no orders.
- [x] 6.4 Create the address management page at `apps/storefront/app/conta/enderecos/page.tsx`. Use `useAddresses` to list, create, edit, delete addresses. Render addresses as cards with edit/delete actions. "Adicionar endereço" button opens a form modal/inline form. Support marking one address as default.

## Task 7: Cart Server Sync
- [-] 7.1 Update `apps/storefront/context/CartContext.tsx` to integrate server cart sync. On auth state change (login), call `mergeCartWithServer()` from `useServerCart`. After merge, load server cart as source of truth. On logout, revert to localStorage-only mode. Add `LOAD_FROM_SERVER` action to the reducer.

## Task 8: Navigation Improvements
- [ ] 8.1 Create `CategoryMegaMenu` component in `apps/storefront/components/layout/CategoryMegaMenu.tsx`. Fetch categories with `useCategories`. Render as a full-width dropdown with columns for each top-level category and child links. Close on outside click or navigation.
- [ ] 8.2 Refactor `apps/storefront/components/layout/Navbar.tsx` to: replace hardcoded "Flores"/"Vasos" links with `CategoryMegaMenu`, add a search input (desktop) that navigates to `/busca?q=...` on Enter, improve mobile hamburger menu with category accordion and search input. Remove all flower-specific references.
- [ ] 8.3 Refactor `apps/storefront/components/layout/Footer.tsx` to: fetch categories with `useCategories` and render top-level category links, add account links (Minha conta, Meus pedidos), remove all flower-specific hardcoded text (use generic store name from env/config), keep dynamic copyright year.
- [ ] 8.4 Update `apps/storefront/app/layout.tsx` to remove flower-specific metadata. Use generic store name from environment variable (`NEXT_PUBLIC_STORE_NAME`) for title and description. Update the HTML lang attribute if needed.
