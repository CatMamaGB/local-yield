# High-Level Audit: File Placement, Components & Data Flow

**Generated:** 2025-02-11  
**Scope:** App structure, component usage, API ↔ lib wiring, and how each area works.

---

## 1. App structure & entry points

### Root
- **`app/layout.tsx`** — Root layout. Wraps app in `CartProvider`, renders `Navbar(user)` and `children`. Calls `getCurrentUser()` (server) for session; optional `ClerkProvider` when Clerk env is set. No forced auth.
- **`app/page.tsx`** — Landing: “Choose your path” (Market vs Care). Links to `/market`, `/care`, `/about`.
- **`app/globals.css`** — Global styles (Tailwind + brand).

### Auth
- **`app/auth/login/page.tsx`** — Login page; uses `AuthForm` (mode sign-in).
- **`app/auth/signup/page.tsx`** — Sign-up page; uses `AuthForm` (mode sign-up) and `RolePicker`.
- **`app/auth/onboarding/page.tsx`** — Post-signup ZIP onboarding; server uses `getCurrentUser()`, client uses `OnboardingClient` with `ZipCodeInput`. Redirects if already onboarded.
- **`app/sign-in/page.tsx`** — Redirects to `/auth/login`.
- **`app/sign-up/page.tsx`** — (If present) typically redirects to `/auth/signup`.

### Market (buyer flow)
- **`app/market/page.tsx`** — Market hub: `MarketSearchCard`, `RequestItemForm`; uses `getCurrentUser()`.
- **`app/market/browse/page.tsx`** — Browse listings by ZIP/radius/search; renders `BrowseClient`.
- **`app/market/shop/[id]/page.tsx`** — Producer storefront (server): loads producer + products from Prisma, `getDistanceBetweenZips`, then `ProducerHeader` + `ProducerProductGrid` (which uses `AddToCartButton`, `DeliveryBadge`).
- **`app/market/cart/page.tsx`** — Cart page; client `CartPageClient` uses `CartItemRow`, `useCart`, `formatPrice`.
- **`app/market/checkout/page.tsx`** — Checkout; server `getCurrentUser()`, client `CheckoutClient` (cart, `FulfillmentSelector`, POST `/api/orders`).
- **`app/market/order-confirmation/[orderId]/page.tsx`** — Order confirmation; uses `getCurrentUser()`, Prisma for order, `formatPrice`/`formatDate`.

### Care (feature-flagged)
- **`app/care/page.tsx`** — Care hub; uses `isCareEnabled()`, `CareSearchCard`.
- **`app/care/browse/page.tsx`** — Care browse; `isCareEnabled()`.
- **`app/care/caregiver/[id]/page.tsx`** — Caregiver profile; `isCareEnabled()`.

### Dashboard (producer / role-gated)
- **`app/dashboard/page.tsx`** — Dashboard home; `getCurrentUser()`, `getOrdersForProducer`, `DemandNearYou`, `ExampleOrderPreview`.
- **`app/dashboard/orders/page.tsx`** — Orders list; `getCurrentUser()`, `getOrdersForBuyer`/`getOrdersForProducer`, `OrderStatusBadge`, `ProducerOrdersClient` (filter, mark fulfilled).
- **`app/dashboard/products/page.tsx`** — Products CRUD; `requireProducerOrAdmin()`, `ProductsClient` (uses `/api/products`, no shared product grid component).
- **`app/dashboard/profile/page.tsx`** — Producer profile; `requireProducerOrAdmin()`, `ProducerProfileForm` (uses `PickupNotesField`, `DeliverySettings`).
- **`app/dashboard/customers/page.tsx`** — Customers list; `requireProducerOrAdmin()`, `getCustomersForProducer`/`customersToCsv`, `CustomersClient`.
- **`app/dashboard/records/page.tsx`** — Sales records; `requireProducerOrAdmin()`, `lib/sales-summary`, `RecordsClient`, `formatPrice`.
- **`app/dashboard/events/page.tsx`** — Events placeholder; `requireProducerOrAdmin()` (no EventCard yet).
- **`app/dashboard/subscriptions/page.tsx`** — Subscriptions; `requireProducerOrAdmin()`.

### Admin
- **`app/admin/users/page.tsx`** — `requireAdmin()`.
- **`app/admin/listings/page.tsx`** — `requireAdmin()`.
- **`app/admin/reviews/page.tsx`** — `requireAdmin()`, `getReviewsForAdmin`, `AdminReviewsClient`.

### Other
- **`app/about/page.tsx`** — About page.

---

## 2. Components: where they live and where they’re used

### Layout & shell
| Component      | Path                    | Used in                          |
|----------------|-------------------------|----------------------------------|
| **Navbar**     | `components/Navbar.tsx` | `app/layout.tsx`                 |
| **CartLink**   | `components/CartLink.tsx` | `Navbar`                       |
| **SignOutButton** | `components/SignOutButton.tsx` | `Navbar`                    |

### Auth
| Component    | Path                     | Used in                          |
|-------------|--------------------------|----------------------------------|
| **AuthForm** | `components/AuthForm.tsx` | `app/auth/login/page.tsx`, `app/auth/signup/page.tsx` |
| **RolePicker** | `components/RolePicker.tsx` | `AuthForm` (signup/onboarding) |
| **ZipCodeInput** | `components/ZipCodeInput.tsx` | `app/auth/onboarding/OnboardingClient.tsx` |

### Market – browse & shop
| Component           | Path                            | Used in |
|---------------------|----------------------------------|--------|
| **BrowseClient**    | `components/BrowseClient.tsx`    | `app/market/browse/page.tsx` |
| **LocationInput**   | `components/LocationInput.tsx`   | `BrowseClient` |
| **ListingRow**      | `components/ListingRow.tsx`      | `BrowseClient` |
| **MarketSearchCard**| `components/MarketSearchCard.tsx`| `app/market/page.tsx` |
| **RequestItemForm** | `components/RequestItemForm.tsx` | `app/market/page.tsx` |
| **ProducerHeader**  | `components/ProducerHeader.tsx`  | `app/market/shop/[id]/page.tsx` |
| **ProducerProductGrid** | `components/ProducerProductGrid.tsx` | `app/market/shop/[id]/page.tsx` |
| **AddToCartButton** | `components/AddToCartButton.tsx` | `ProducerProductGrid` |
| **DeliveryBadge**   | `components/DeliveryBadge.tsx`  | `ProducerHeader`, `ProducerProductGrid`, `ListingRow`, `ProductCard`, `WeeklyBox` |

### Cart & checkout
| Component           | Path                            | Used in |
|---------------------|----------------------------------|--------|
| **CartItemRow**     | `components/CartItemRow.tsx`     | `app/market/cart/CartPageClient.tsx` |
| **FulfillmentSelector** | `components/FulfillmentSelector.tsx` | `app/market/checkout/CheckoutClient.tsx` |

### Dashboard
| Component            | Path                              | Used in |
|----------------------|------------------------------------|--------|
| **DemandNearYou**    | `components/DemandNearYou.tsx`     | `app/dashboard/page.tsx` |
| **ExampleOrderPreview** | `components/ExampleOrderPreview.tsx` | `app/dashboard/page.tsx` |
| **OrderStatusBadge** | `components/OrderStatusBadge.tsx`   | `app/dashboard/orders/page.tsx`, `ProducerOrdersClient` |
| **OrderStatusFilter**| `components/OrderStatusFilter.tsx`  | `ProducerOrdersClient` |
| **MarkFulfilledButton** | `components/MarkFulfilledButton.tsx` | `ProducerOrdersClient` |
| **ProducerProfileForm** | `components/ProducerProfileForm.tsx` | `app/dashboard/profile/page.tsx` |
| **PickupNotesField** | `components/PickupNotesField.tsx`   | `ProducerProfileForm` |
| **DeliverySettings** | `components/DeliverySettings.tsx`   | `ProducerProfileForm` |

### Care
| Component        | Path                         | Used in |
|------------------|------------------------------|--------|
| **CareSearchCard** | `components/CareSearchCard.tsx` | `app/care/page.tsx` |

### Not used by any page (available for future use)
| Component        | Path                         | Notes |
|------------------|------------------------------|--------|
| **ProductCard**  | `components/ProductCard.tsx`   | Standalone card; market shop uses `ProducerProductGrid` instead. |
| **EventCard**    | `components/EventCard.tsx`    | Dashboard events page is still TODO. |
| **WeeklyBox**    | `components/WeeklyBox.tsx`   | Subscription/weekly box UI; no page uses it yet. |
| **CatalogSelector** | `components/CatalogSelector.tsx` | Catalog picker; ProductsClient uses inline form. |
| **MessageThread** | `components/MessageThread.tsx` | Messaging UI; no messaging route uses it yet. |

---

## 3. Contexts

| Context        | Path                    | Used in |
|----------------|-------------------------|--------|
| **CartContext** | `contexts/CartContext.tsx` | `app/layout.tsx` (CartProvider). Consumed by: `CartLink`, `CartItemRow`, `CartPageClient`, `AddToCartButton`, `CheckoutClient`. |

Cart: `CartItem` (productId, quantity, producerId, title, price, unitPriceCents, imageUrl). Stored in `localStorage` key `localyield_cart`. MVP: one producer per cart when adding.

---

## 4. Lib modules: purpose and who uses them

| Lib file         | Purpose | Used by (summary) |
|------------------|--------|--------------------|
| **auth**         | Session: `getCurrentUser`, `requireProducerOrAdmin`, `requireAdmin`. Clerk sync or dev stub. | Layout, onboarding, dashboard pages, profile, orders, checkout, admin, API auth routes. |
| **api**          | Helpers: `ok()`, `fail()`, `parseJsonBody()`. | API routes: orders, auth (dev-login, onboarding), dashboard profile, admin reviews. |
| **validators**   | Zod: `CreateOrderSchema`, `UpdateOrderStatusSchema`, `OnboardingSchema`, `ProfileUpdateSchema`, `ZipSchema`, etc. | Same API routes that need request validation. |
| **prisma**       | Prisma client singleton. | All API routes and server pages that touch DB (orders, profile, shop, listings, products, customers, reviews, item-requests). |
| **orders**       | `createOrder()`, `getOrdersForProducer`, `getOrdersForBuyer`. | API POST orders, dashboard (page + orders page). |
| **customers**    | `getCustomersForProducer`, `customersToCsv`, `setProducerCustomerNote`. | Dashboard customers page, API dashboard/customers/note. |
| **reviews**      | `getReviewsForAdmin`, `hideReviewByAdmin`. | Admin reviews page, API admin/reviews/[id]/hide. |
| **sales-summary**| Sales aggregation by period. | Dashboard records page + RecordsClient. |
| **geo**          | `getDistanceBetweenZips`. | API listings, market shop page (distance). |
| **item-requests**| `createItemRequest`, `listItemRequestsByRadius`. | API item-requests. |
| **feature-flags**| `isCareEnabled()`. | Navbar, care pages. |
| **utils**        | `formatPrice`, `formatDate`, `isValidZip`. | Checkout, cart, dashboard, order confirmation, ProductCard, CartItemRow, ProducerProductGrid, ZipCodeInput, LocationInput, etc. |
| **stripe**       | (Stripe integration for payments.) | Referenced where card payments are planned. |
| **messaging**    | (Conversations/messages.) | For future Care/Buyer–Producer messaging. |

---

## 5. API routes: method, auth, and lib usage

| Route | Method | Auth | Lib / behavior |
|-------|--------|------|----------------|
| **/api/auth/dev-login** | POST | — | `prisma`, `api` (parseJsonBody, ok/fail). Dev-only stub login. |
| **/api/auth/onboarding** | POST | getCurrentUser | `auth`, `prisma`, `api`, `validators` (OnboardingSchema). Set user ZIP. |
| **/api/auth/sign-out** | POST | — | Sign-out (clear session). |
| **/api/orders** | POST | getCurrentUser | `prisma`, `auth`, `orders` (createOrder), `api`, `validators` (CreateOrderSchema). Create order from cart body. |
| **/api/orders/[id]** | PATCH | requireProducerOrAdmin | `prisma`, `auth`, `api`, `validators` (UpdateOrderStatusSchema). Status transitions. |
| **/api/dashboard/profile** | PATCH | requireProducerOrAdmin | `prisma`, `auth`, `api`, `validators` (ProfileUpdateSchema). Update producer profile. |
| **/api/dashboard/customers/note** | POST | getCurrentUser | `auth`, `customers` (setProducerCustomerNote). |
| **/api/products** | GET/POST | GET public-ish, POST requireProducerOrAdmin | `prisma`, `auth`. Products CRUD. |
| **/api/products/[id]** | GET/PATCH/DELETE | requireProducerOrAdmin | `prisma`, `auth`. |
| **/api/listings** | GET | — | `prisma`, `geo`. ZIP/radius/q, returns BrowseListing[] with distance/label. |
| **/api/shop/[id]/delivery** | GET | — | `prisma`. Delivery options for checkout. |
| **/api/item-requests** | GET/POST | POST getCurrentUser | `auth`, `item-requests`. |
| **/api/admin/reviews/[id]/hide** | POST | requireAdmin | `auth`, `reviews` (hideReviewByAdmin). |

---

## 6. Data flow (high level)

1. **Session**  
   `getCurrentUser()` in layout and pages (and API routes that need auth). Auth is `lib/auth` (Clerk or dev stub).

2. **Market browse**  
   User sets ZIP/radius in `BrowseClient` → GET `/api/listings?zip=&radius=&q=` → `lib/geo` for distance, Prisma for products → `ListingRow` list.

3. **Market shop**  
   Server page loads producer + products (Prisma), computes distance (geo). `ProducerProductGrid` + `AddToCartButton` update `CartContext` (localStorage).

4. **Cart → Checkout**  
   `CartPageClient` / `CheckoutClient` read from `useCart()`. Checkout GETs `/api/shop/[id]/delivery`, then POSTs `/api/orders` with `CreateOrderSchema`. `lib/orders.createOrder()` runs in transaction, returns orderId + pickupCode.

5. **Producer orders**  
   Dashboard orders page uses `getOrdersForBuyer` / `getOrdersForProducer`. PATCH `/api/orders/[id]` with `UpdateOrderStatusSchema` for status (e.g. mark fulfilled).

6. **Producer profile**  
   Dashboard profile page + `ProducerProfileForm` → PATCH `/api/dashboard/profile` with `ProfileUpdateSchema`; Prisma updates User + ProducerProfile.

7. **Validation**  
   All mutable API bodies use Zod in `lib/validators`; routes use `parseJsonBody` + `ok`/`fail` from `lib/api`.

---

## 7. File placement summary

- **Pages:** `app/**/page.tsx` (server components unless they only render a client component).
- **Route handlers:** `app/api/**/route.ts`.
- **Shared UI:** `components/` (client or server; Navbar, cart, forms, cards).
- **Page-specific client logic:** Often next to the page, e.g. `CheckoutClient.tsx`, `CartPageClient.tsx`, `ProducerOrdersClient.tsx`, `OnboardingClient.tsx`, `AdminReviewsClient.tsx`, `RecordsClient.tsx`, `CustomersClient.tsx`, `ProductsClient.tsx`.
- **State:** `contexts/CartContext.tsx` for cart.
- **Server-only logic & validation:** `lib/` (auth, orders, validators, api, prisma, geo, etc.).
- **Types:** `types/index.ts`, `types/listings.ts`, `types/care.ts`; API and components import as needed.

This layout keeps API thin (parse → validate → call lib), lib as single source of business logic, and components focused on UI and calling APIs or context.
