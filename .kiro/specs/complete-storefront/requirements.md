# Requirements: Complete Storefront

## Requirement 1: Category Browsing Pages

### 1.1 Category Listing Page
When a user navigates to `/categorias`, the page must display all top-level categories as cards showing the category name, image (if available), description, and product count. Categories must be sorted by `sortOrder`. Each card links to `/categorias/[slug]`.

**Acceptance Criteria:**
- Given the API returns a category tree with 3 top-level categories, the page renders 3 category cards
- Given a category has `imageUrl: null`, a placeholder image is shown
- Given a category has 0 products, it is still displayed but shows "0 produtos"

### 1.2 Category Detail Page
When a user navigates to `/categorias/[slug]`, the page must show a breadcrumb trail (Home > Categorias > [Parent?] > [Category]), the category name and description, and a product grid filtered by that category. Child categories (if any) are shown as filter chips above the product grid.

**Acceptance Criteria:**
- Given a category "Camisetas" with parent "Masculino", breadcrumbs show: Home > Categorias > Masculino > Camisetas
- Given a root category "Masculino" with 3 children, the page shows 3 child category chips
- Given a category with 15 products and page size 12, pagination controls appear
- Given a category slug that doesn't exist, a "Categoria não encontrada" message is shown with a link to `/categorias`

### 1.3 Category Mega-Menu
The Navbar must include a "Categorias" dropdown that, on hover (desktop) or tap (mobile), shows a mega-menu with all top-level categories and their children. Each category links to `/categorias/[slug]`.

**Acceptance Criteria:**
- Given 4 top-level categories each with 3 children, the mega-menu renders 4 columns with 3 links each
- Given the user clicks a category link, the mega-menu closes and navigation occurs
- Given the user clicks outside the mega-menu, it closes
- On mobile, the mega-menu renders as an accordion within the hamburger menu

## Requirement 2: Enhanced Product Detail Page

### 2.1 Dynamic Variant Selector
The product detail page (`/produtos/[slug]`) must render variant option selectors dynamically based on the product's variant `options` keys (e.g., "size", "color"). When the user selects an option, other option groups must cross-filter to show only available combinations.

**Acceptance Criteria:**
- Given a product with variants having options `{size: "M", color: "Azul"}` and `{size: "G", color: "Vermelho"}`, two selector groups appear: "size" and "color"
- Given user selects size "M", only colors available for size M are shown as selectable
- Given a variant combination is out of stock (stock = 0), it appears dimmed and is not addable to cart
- Given all option types have a selection, the matched variant's price and stock are displayed
- Given a product with no variants, no variant selector is shown and the base product price is used

### 2.2 Reviews Section
The product detail page must show a reviews section with: average rating (stars), total review count, list of reviews (paginated), and a review submission form for authenticated users.

**Acceptance Criteria:**
- Given a product with 5 reviews averaging 4.2 stars, the section shows 4 filled stars and "4.2 (5 avaliações)"
- Given the user is authenticated and has not reviewed this product, a review form with rating (1-5 stars), title, and body fields is shown
- Given the user is not authenticated, a "Faça login para avaliar" link is shown instead of the form
- Given the user submits a valid review, it appears in the list with "Pendente" status
- Given the user has already reviewed this product, the form is hidden and their review is highlighted

### 2.3 Related Products
The product detail page must show a "Produtos relacionados" section below the reviews, displaying up to 4 products from the same category (excluding the current product).

**Acceptance Criteria:**
- Given a product in category "Camisetas" with 6 other products in the same category, 4 related products are shown
- Given a product with no category, the related products section is hidden
- Given a product is the only one in its category, the related products section is hidden

## Requirement 3: Search Results Page

### 3.1 Search Page with Query
When a user navigates to `/busca?q=...`, the page must display products matching the search query in a grid layout with the search term shown prominently.

**Acceptance Criteria:**
- Given the URL `/busca?q=camiseta`, the page shows products matching "camiseta" and displays "Resultados para 'camiseta'"
- Given the search returns 0 results, an empty state message is shown with suggestions to try different terms
- Given the search returns 20 results with page size 12, pagination controls appear

### 3.2 Search Filters
The search page must include filters for: category (from category tree), and sort order (newest, price ascending, price descending, name A-Z). Filters must sync with URL query parameters.

**Acceptance Criteria:**
- Given the user selects category "Masculino", the URL updates to include `categoria=<categoryId>` and results are filtered
- Given the user changes sort to "Menor preço", the URL updates to include `ordem=price_asc` and results re-sort
- Given the user shares the URL `/busca?q=camiseta&categoria=xxx&ordem=price_asc`, the page loads with those filters pre-applied
- Given the user clicks "Limpar filtros", all filters reset and URL returns to `/busca?q=...`

### 3.3 Navbar Search Integration
The Navbar must include a search input that, on submit, navigates to `/busca?q=<query>`.

**Acceptance Criteria:**
- Given the user types "vestido" and presses Enter, the browser navigates to `/busca?q=vestido`
- Given the user clicks the search icon on mobile, a search input expands/appears
- Given the search input is empty and user presses Enter, no navigation occurs

## Requirement 4: User Account Pages

### 4.1 Account Layout with Sidebar
All `/conta/*` pages must share a layout with a sidebar showing navigation links (Perfil, Pedidos, Endereços) and the user's name/email. Unauthenticated users must be redirected to `/login?redirect=/conta`.

**Acceptance Criteria:**
- Given an authenticated user navigates to `/conta`, the sidebar shows their name and email with 3 navigation links
- Given an unauthenticated user navigates to `/conta`, they are redirected to `/login?redirect=/conta`
- On mobile, the sidebar renders as horizontal tabs at the top of the page

### 4.2 Profile Page
The `/conta` page must display the user's profile information (name, email, phone) and allow editing name and phone.

**Acceptance Criteria:**
- Given an authenticated user, the page shows their current name, email (read-only), and phone
- Given the user edits their name and clicks save, the API is called and the UI updates
- Given the API returns a validation error, the error message is shown inline

### 4.3 Order History Page
The `/conta/pedidos` page must list the user's past orders sorted by date (newest first), showing order ID, date, status badge, item count, and total.

**Acceptance Criteria:**
- Given a user with 5 orders, all 5 are listed with correct status badges (color-coded)
- Given a user clicks an order, they navigate to `/pedido/[id]` (existing page)
- Given a user has no orders, an empty state message is shown with a link to `/produtos`

### 4.4 Address Management Page
The `/conta/enderecos` page must list the user's saved addresses and allow adding, editing, and deleting addresses. One address can be marked as default.

**Acceptance Criteria:**
- Given a user with 2 addresses, both are shown as cards with edit/delete actions
- Given the user clicks "Adicionar endereço", a form appears with fields: label, street, number, complement, district, city, state, zipCode
- Given the user submits a valid address, it appears in the list
- Given the user deletes an address, it is removed from the list with confirmation
- Given the user marks an address as default, the previous default is unmarked

## Requirement 5: Authentication Pages

### 5.1 Login Page
The `/login` page must show a login form with email and password fields. On successful login, the user is redirected to the URL in the `redirect` query parameter, or to `/` if none.

**Acceptance Criteria:**
- Given valid credentials, the user is logged in, tokens are stored, and redirect occurs
- Given invalid credentials, an error message "E-mail ou senha inválidos" is shown
- Given the URL `/login?redirect=/checkout`, after login the user is redirected to `/checkout`
- The page includes a link to `/cadastro` for new users

### 5.2 Register Page
The `/cadastro` page must show a registration form with name, email, password, and password confirmation fields. On successful registration, the user is automatically logged in.

**Acceptance Criteria:**
- Given valid registration data, the user account is created, user is logged in, and redirected to `/`
- Given an email that already exists, an error message is shown
- Given passwords don't match, a client-side validation error is shown
- Given password is less than 6 characters, a validation error is shown
- The page includes a link to `/login` for existing users

## Requirement 6: Cart Server Sync

### 6.1 Cart Synchronization
When a user logs in, the local cart (localStorage) must be merged with the server-side cart. After merge, the server cart becomes the source of truth.

**Acceptance Criteria:**
- Given a user has 2 items in local cart and 1 different item on server, after login the cart shows 3 items
- Given a user has the same product in both local and server cart, quantities are not duplicated (server's existing item is kept)
- Given a local cart item references an inactive product, it is silently dropped during merge
- Given the user logs out, the cart reverts to localStorage-only mode

## Requirement 7: Navigation Improvements

### 7.1 Responsive Navbar
The Navbar must be fully responsive: desktop shows horizontal nav with mega-menu, search input, user menu, and cart icon. Mobile shows a hamburger menu that expands to show all navigation items including categories as an accordion.

**Acceptance Criteria:**
- On desktop (≥768px), the navbar shows: logo, category mega-menu trigger, search input, user icon, cart icon
- On mobile (<768px), the navbar shows: logo, search icon, cart icon, hamburger menu
- The hamburger menu includes: categories (accordion), search input, login/account link
- The cart icon always shows the current item count badge

### 7.2 Enhanced Footer
The Footer must show: store logo and description, category links (top-level categories from API), account links (Minha conta, Meus pedidos), and contact information. The footer must be generic (not flower-specific).

**Acceptance Criteria:**
- Given 4 top-level categories, the footer shows 4 category links under "Categorias"
- The footer shows links to `/conta` and `/conta/pedidos` under "Minha conta"
- The footer copyright uses the current year dynamically
- The footer does not contain any flower-specific or store-specific hardcoded text (uses store name from config)
