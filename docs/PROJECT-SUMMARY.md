# The Local Yield — Full Project Summary

**Last updated:** 2026-02-18  
**Purpose:** Single reference for frontend flows, every button/link, routes, APIs, file structure, and project health.

---

## 1. What This Project Is

**The Local Yield** is a local marketplace and care platform on one domain with two experiences:

- **Market:** Buyers browse goods by ZIP/radius, add to cart, checkout (pickup or delivery). Producers manage products, profile, orders, and see demand.
- **Care** is always available alongside Market. Seekers browse caregivers by location/species/service, view profiles, request bookings. Caregivers manage listings and bookings.

**Tech:** Next.js (App Router), TypeScript, Tailwind CSS, Prisma (PostgreSQL). Auth: Clerk when env set, else dev stub. All mutations go through API routes; frontend uses a single API client (`lib/client/api-client.ts`) that expects `{ ok, data }` / `{ ok: false, error, code?, requestId? }`.

---

## 2. File Structure (High Level)

```
local-yield/
├── app/
│   ├── layout.tsx                 # Root: CartProvider, NavbarWrapper, FooterWrapper, getCurrentUser
│   ├── page.tsx                   # Home: hero, Market / Care / About links
│   ├── about/
│   ├── auth/                      # login, signup, onboarding
│   ├── sign-in/ → redirect auth/login
│   ├── sign-up/ → redirect auth/signup
│   ├── market/                    # browse, shop/[id], cart, checkout, order-confirmation/[orderId]
│   ├── care/                      # hub, browse, caregiver/[id], post-job
│   ├── dashboard/                 # home, revenue, customers, analytics, orders, messages, profile,
│   │                              # products, events, reviews, records, care-bookings, subscriptions
│   ├── admin/                     # users, listings, reviews, flagged-reviews, custom-categories,
│   │                              # bookings, help-exchange, reports
│   ├── api/                       # All route handlers (see API Routes below)
│   ├── care-safety/
│   ├── seller-guidelines/
│   ├── community-guidelines/
│   ├── privacy/
│   └── terms/
├── components/                    # Shared UI
│   ├── Navbar.tsx, Footer.tsx, NavbarWrapper, FooterWrapper
│   ├── AuthForm, SignupForm, SignOutButton, RoleSelection
│   ├── MarketSearchCard, CareSearchCard, LocationInput, ZipCodeInput
│   ├── BrowseClient, ListingRow, ProducerHeader, ProducerProductGrid
│   ├── CartLink, CartItemRow, AddToCartButton, FulfillmentSelector
│   ├── RequestItemForm, DemandNearYou
│   ├── AccountForm, ProducerProfileForm, ProductCatalogForm
│   ├── OrderStatusBadge, MarkFulfilledButton, ReportDialog
│   ├── dashboard/                 # MetricCard, GrowthSignalCard
│   └── ui/                        # PageHeader, SectionCard, EmptyState, InlineAlert, LoadingSkeleton, etc.
├── contexts/
│   └── CartContext.tsx            # Cart state, localStorage key: localyield_cart
├── lib/
│   ├── auth/                      # getCurrentUser, requireAuth, requireAdmin, dev stub
│   ├── authz/                     # server + client; getUserCapabilities, canSell, canAdmin, etc.
│   ├── client/                    # api-client.ts (apiGet/Post/Patch/Delete), market.ts, care.ts, helpExchange.ts
│   ├── api.ts                     # ok(), fail(), parseJsonBody(), withRequestId()
│   ├── prisma.ts
│   ├── validators.ts              # Zod schemas
│   ├── geo/, market/, care/, orders/, reviews/, messaging/, dashboard-alerts/, producer-metrics/
│   ├── nav-routes.ts, nav-config.ts
│   └── ...
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── types/                         # Shared types (listings, care, etc.)
├── docs/                          # routes.md, PROJECT-SUMMARY.md, nav-architecture.md (canonical); qa-checklist-10min.md; auth-flows.md
├── scripts/                       # Test scripts (e.g. care API, help-exchange)
└── package.json, tsconfig.json, tailwind.config.ts, proxy.ts
```

---

## 3. Page Routes (Where Links Go)

### Public

| Path | Purpose |
|------|--------|
| `/` | Home: "Choose your path" — links to Market, Care, About, Sign up |
| `/about` | About page; links to Market browse, Sign up |
| `/terms` | Terms of Use; links to Community Guidelines, Home |
| `/privacy` | Privacy Policy; link to Home |
| `/community-guidelines` | Community Guidelines; link to Home |
| `/seller-guidelines` | Seller Guidelines; links to Community Guidelines, Home |
| `/care-safety` | Care & Safety; links to Terms, Community Guidelines, Home |

### Auth (no main nav chrome on `/auth/*`)

| Path | Purpose |
|------|--------|
| `/auth/login` | Sign in; supports `?next=` for post-login redirect |
| `/auth/signup` | Sign up (Buyer always on; "what else" optional). Supports `?next=` (passed to onboarding). |
| `/auth/onboarding` | Terms + optional ZIP + roles; optional after terms; redirect uses next= → lastActiveMode → market |
| `/sign-in` | Redirects to `/auth/login` |
| `/sign-up` | Redirects to `/auth/signup` |

**Post-auth redirect:** Priority is next= (validated safe path) → cart checkout → lastActiveMode cookie → `/market/browse`. lastActiveMode is set on entry to each mode root and when user chooses Account → Switch mode.

### Market

| Path | Purpose |
|------|--------|
| `/market` | Market hub: hero + MarketSearchCard, Request item form, producer CTA (Dashboard or Sign up) |
| `/market/browse` | Browse listings (ZIP/radius/search); results link to `/market/shop/[id]` |
| `/market/shop/[id]` | Producer storefront; "Back to browse" → `/market/browse`; add to cart (context) |
| `/market/cart` | Cart; "Browse" → `/market/browse`, "Proceed to checkout" → `/market/checkout` |
| `/market/checkout` | Checkout; "View cart" / "Edit cart" → `/market/cart`; submit → `/market/order-confirmation/[orderId]` |
| `/market/order-confirmation/[orderId]` | Confirmation; links to Dashboard orders, Market browse |

### Care

Care is **always available** in the main nav (Browse, Care, About) for public discovery. Browsing caregivers and viewing profiles do not require an account. The **Care** entry in the dashboard mode switcher and actions (booking, post job) are **capability-gated** (require auth and care roles).

| Path | Purpose |
|------|--------|
| `/care` | Care hub: hero + CareSearchCard; "Find care" → `/care/browse`, "Post a job" → `/care/post-job`, Sign up link |
| `/care/browse` | Browse caregivers; "Back to Care" → `/care`; card click → `/care/caregiver/[id]` |
| `/care/caregiver/[id]` | Caregiver profile; "Sign in to request" → `/auth/login`; booking submit → redirect to messages |
| `/care/post-job` | Post help-exchange job; redirects if not logged in or not allowed; submit → `/care/browse?category=...` |

### Dashboard (authenticated)

| Path | Purpose |
|------|--------|
| `/dashboard` | Home: buyer (Profile, Orders, Browse) or producer (alerts, metrics, quick actions, orders, admin links) |
| `/dashboard/profile` | Profile & "Your modes" (add Seller/Helper/Hire); links to Orders, Products, Care |
| `/dashboard/orders` | Orders (buyer: history + reviews; producer: list + Mark fulfilled) |
| `/dashboard/revenue` | Revenue: Overview / Orders / Customers tabs; links to Products, Orders, Customers |
| `/dashboard/customers` | Customers list; back to Dashboard |
| `/dashboard/analytics` | Sales analytics; "View all orders" → `/dashboard/orders` |
| `/dashboard/messages` | Conversations list + thread |
| `/dashboard/products` | Products CRUD; back to Dashboard |
| `/dashboard/events` | Events list; add/delete |
| `/dashboard/reviews` | Reviews (producer); link to Messages |
| `/dashboard/records` | Sales records; back to Dashboard |
| `/dashboard/care-bookings` | Care bookings (seeker/caregiver); "Message" → messages thread |
| `/dashboard/subscriptions` | Subscriptions (TODO placeholder); producer only |

### Admin (admin-only)

Non-admins get **403**. Admins can use both Dashboard and Admin.

| Path | Purpose |
|------|--------|
| `/admin` | Admin home (e.g. redirects to reviews) |
| `/admin/users` | User management |
| `/admin/listings` | Listings management |
| `/admin/reviews` | Reviews list; "Show hidden" toggle |
| `/admin/flagged-reviews` | Flagged reviews queue (dismiss, approve, guidance) |
| `/admin/custom-categories` | Custom category approve/reject/edit |
| `/admin/bookings` | Care bookings list; link to Dashboard care-bookings |
| `/admin/help-exchange` | Help exchange postings |
| `/admin/reports` | Reports list; update status |

---

## 4. Frontend: Buttons and Links (By Screen)

### Navbar (global unless chrome hidden)

- **Logo / "The Local Yield"** → `/`
- **Account** dropdown when logged in: **Switch mode** (Market | Sell | Care) only when `isMultiMode`; Profile; Admin (if admin); Sign out
- **Browse** → `/market/browse`
- **Care** → `/care`
- **About** → `/about`
- **Cart** (buyers only, when not in app area) → `/market/cart`
- **Sign in** → `/auth/login`
- **Sign up** → `/auth/signup`
- **Dashboard** (when not admin) → `/dashboard`
- **Admin** (when admin) → `/admin`
- **Sign out** → `POST /api/auth/sign-out` then redirect

### Home (`/`)

- "Browse Market" → `/market`
- "Find Care" → `/care/browse`
- "Sell goods or offer care" → `/auth/signup`
- Two-path cards: Market → `/market/browse`, Care → `/care/browse`
- "Browse Market" / "Find Care" in sections → same
- "Seller guidelines" → `/seller-guidelines`
- "About" in footer → `/about`

### Market hub (`/market`)

- **MarketSearchCard** "Search" → navigates to `/market/browse` with ZIP/radius (client-side)
- **RequestItemForm** submit → `POST /api/item-requests`
- "Go to Dashboard" (producer) → `/dashboard`
- "Start selling" → `/auth/signup`

### Market browse (`/market/browse`)

- **BrowseClient:** LocationInput + search; "Search" → `GET /api/listings?zip=...&radius=...&q=...`
- Each **ListingRow** click → `/market/shop/[producerId]`

### Shop (`/market/shop/[id]`)

- "Back to browse" → `/market/browse`
- **AddToCartButton** → updates CartContext (no API)
- (Checkout flow uses cart and then POST `/api/orders`)

### Cart (`/market/cart`)

- "Browse" (empty) → `/market/browse`
- "Proceed to checkout" → `/market/checkout`

### Checkout (`/market/checkout`)

- "View cart" / "Edit cart" → `/market/cart`
- Delivery options → `GET /api/shop/[id]/delivery` (when single producer)
- Submit order → `POST /api/orders` → redirect to `/market/order-confirmation/[orderId]`

### Order confirmation

- "View orders" → `/dashboard/orders`
- "Continue shopping" → `/market/browse`

### Care hub (`/care`)

- **CareSearchCard** → `/care/browse` with ZIP/radius
- "Find care" → `/care/browse`
- "Post a job" → `/care/post-job`
- "Sign up" → `/auth/signup`

### Care browse (`/care/browse`)

- "Back to Care" → `/care`
- **CareBrowseClient:** search → `GET /api/care/caregivers?...`; card click → `/care/caregiver/[id]`
- "Message" (from results) → `POST /api/dashboard/conversations/create` → redirect to `/dashboard/messages?conversation=...`

### Caregiver profile (`/care/caregiver/[id]`)

- "Sign in to request" → `/auth/login`
- **BookingForm** submit → `POST /api/care/bookings` → redirect to `/dashboard/messages?conversation=...`

### Care post-job (`/care/post-job`)

- **PostJobForm** submit → `POST /api/help-exchange/postings` → redirect to `/care/browse?category=...`

### Dashboard home (`/dashboard`)

- Buyer: Profile → `/dashboard/profile`, Orders → `/dashboard/orders`, Browse → `/market/browse`
- Producer: Alert cards → `/dashboard/orders`, `/dashboard/reviews`, `/dashboard/messages`
- MetricCard links → Revenue, Orders, Customers, Products
- Quick actions → Profile, Products (add), Events (add), Storefront (`/market/shop/[user.id]`)
- "View all orders" → `/dashboard/orders`
- "Demand near you" uses `GET /api/item-requests`
- Admin links → `/admin/users`, `/admin/listings`, `/admin/reviews`, `/admin/flagged-reviews`, `/admin/custom-categories`

### Dashboard Revenue / Analytics / Orders / Messages / Products / Events / Reviews / Records / Care bookings

- **RevenuePageClient:** Overview/Orders/Customers tabs; links to Products, Orders, Customers
- **ProducerOrdersClient:** Mark fulfilled → `PATCH /api/orders/[id]` (status FULFILLED)
- **BuyerOrdersClient:** Leave/update review → `POST /api/reviews`, `PATCH /api/reviews/[id]`; "Message" → Messages
- **DashboardMessagesClient:** list → `GET /api/dashboard/conversations`
- **ProductsClient:** list/add/edit/delete → `GET/POST/PATCH/DELETE /api/products`
- **EventsClient:** list/add/delete → `GET/POST/DELETE /api/dashboard/events`
- **ProducerReviewsClient:** Approve → `POST /api/dashboard/reviews/[id]/approve`, Flag → `POST .../flag`, Message → `POST .../message` → redirect to messages
- **CareBookingsClient:** status update → `PATCH /api/care/bookings/[id]`; "Message" → `POST .../conversation` → redirect to messages
- **CustomersClient:** note → `PATCH /api/dashboard/customers/note`
- **RecordsClient:** pagination (client state), back → `/dashboard`

### Admin screens

- **UsersClient** → `GET /api/admin/users`
- **ListingsClient** → `GET /api/admin/listings`
- **BookingsClient** → `GET /api/admin/bookings`; "View in dashboard" → `/dashboard/care-bookings`
- **HelpExchangeClient** → `GET /api/admin/help-exchange`
- **ReportsClient** → `GET /api/reports?...`, status update → `POST /api/admin/reports/[id]/status`
- **AdminReviewsClient** → Hide → `POST /api/admin/reviews/[id]/hide`
- **FlaggedReviewsClient** → Dismiss → `POST .../dismiss-flag`, Approve → `POST .../approve-flag`, Guidance → `PATCH .../guidance`
- **AdminCustomCategoriesClient** → Approve/Reject/Edit → `PATCH /api/admin/custom-categories/[id]`

### Auth

- **AuthForm** (login) → `POST /api/auth/dev-login` → redirect
- **SignupForm** → `POST /api/auth/signup` → redirect (or onboarding)
- **OnboardingClient** → `POST /api/auth/onboarding` → redirect
- **SignOutButton** → `POST /api/auth/sign-out` → redirect
- **Navbar** mode switch → `PATCH /api/auth/primary-mode`

### Profile / Catalog

- **AccountForm** → `GET /api/account`, `PATCH /api/account`
- **ProducerProfileForm** → `GET /api/dashboard/profile`, `PATCH /api/dashboard/profile`
- **ProductCatalogForm** → `GET /api/catalog/categories`, `POST /api/catalog/custom-categories`
- **RequestItemForm** → `POST /api/item-requests`
- **DemandNearYou** → `GET /api/item-requests?zip=...&radius=...`
- **ReportDialog** → `POST /api/reports`

---

## 5. API Routes (Backend) and Who Calls Them

### Auth

| Method + Path | Purpose | Called from |
|---------------|---------|-------------|
| POST `/api/auth/dev-login` | Dev stub login | AuthForm |
| POST `/api/auth/dev-signup` | Dev stub signup | (if used) |
| POST `/api/auth/signup` | Signup with role | SignupForm |
| POST `/api/auth/onboarding` | Set ZIP (authenticated) | OnboardingClient |
| PATCH `/api/auth/primary-mode` | Set MARKET/SELL/CARE | Navbar |
| POST `/api/auth/sign-out` | Sign out | SignOutButton |

### Market & catalog

| Method + Path | Purpose | Called from |
|---------------|---------|-------------|
| GET `/api/listings` | Listings by ZIP/radius/q | BrowseClient |
| GET `/api/shop/[id]/delivery` | Delivery options for shop | CheckoutClient |
| POST `/api/orders` | Create order from cart | CheckoutClient |
| PATCH `/api/orders/[id]` | Update order status | MarkFulfilledButton, ProducerOrdersClient |
| POST `/api/orders/[id]/review` | Create order review | (if used from orders) |
| GET `/api/item-requests` | Item requests (ZIP/radius) | DemandNearYou |
| POST `/api/item-requests` | Create item request | RequestItemForm |
| GET `/api/products`, POST/PATCH/DELETE `/api/products`, `/api/products/[id]` | Products CRUD | ProductsClient |
| GET `/api/catalog/categories` | Catalog categories (incl. custom) | ProductCatalogForm |
| GET `/api/catalog/custom-categories` | (if used) | ProductCatalogForm (POST for create) |
| POST `/api/catalog/custom-categories` | Create custom category | ProductCatalogForm |

### Care

| Method + Path | Purpose | Called from |
|---------------|---------|-------------|
| GET `/api/care/caregivers` | List caregivers (ZIP/radius/species/serviceType) | CareBrowseClient |
| GET `/api/care/caregivers/[id]` | Caregiver profile | Server (caregiver page) |
| POST `/api/care/bookings` | Create booking | BookingForm |
| GET `/api/care/bookings/[id]`, PATCH `/api/care/bookings/[id]` | Get/update booking | CareBookingsClient (PATCH) |
| POST `/api/care/bookings/[id]/conversation` | Get/create conversation | CareBookingsClient |

### Help exchange

| Method + Path | Purpose | Called from |
|---------------|---------|-------------|
| POST `/api/help-exchange/postings` | Create posting | PostJobForm |
| GET `/api/admin/help-exchange` | List postings (admin) | HelpExchangeClient |

### Account & dashboard

| Method + Path | Purpose | Called from |
|---------------|---------|-------------|
| GET `/api/account`, PATCH `/api/account` | Current user account | AccountForm |
| GET `/api/dashboard/conversations` | List conversations | DashboardMessagesClient |
| POST `/api/dashboard/conversations/create` | Create conversation | CareBrowseClient, CareBookingsClient, ProducerReviewsClient |
| GET/POST/DELETE `/api/dashboard/events`, `/api/dashboard/events/[id]` | Events CRUD | EventsClient |
| GET `/api/dashboard/profile`, PATCH `/api/dashboard/profile` | Producer profile | ProducerProfileForm |
| GET `/api/dashboard/summary` | Dashboard summary stats | Server (dashboard page) |
| PATCH `/api/dashboard/customers/note` | Customer note | CustomersClient |
| GET `/api/dashboard/reviews` | Reviews list | Server |
| POST `/api/dashboard/reviews/[id]/approve` | Approve private review | ProducerReviewsClient |
| POST `/api/dashboard/reviews/[id]/flag` | Flag review | ProducerReviewsClient |
| POST `/api/dashboard/reviews/[id]/message` | Message reviewer | ProducerReviewsClient |

### Reviews (public + buyer)

| Method + Path | Purpose | Called from |
|---------------|---------|-------------|
| GET `/api/reviews/[id]` | Public review details | (server or client as needed) |
| POST `/api/reviews` | Create review | BuyerOrdersClient |
| PATCH `/api/reviews/[id]` | Update review (buyer) | BuyerOrdersClient |

### Reports & admin

| Method + Path | Purpose | Called from |
|---------------|---------|-------------|
| GET `/api/reports` | List reports (admin filter) | ReportsClient |
| POST `/api/reports` | Create report | ReportDialog |
| POST `/api/admin/reports/[id]/status` | Update report status | ReportsClient |
| GET `/api/admin/users` | List users | UsersClient |
| GET `/api/admin/listings` | List listings | ListingsClient |
| GET `/api/admin/bookings` | List care bookings | BookingsClient |
| POST `/api/admin/reviews/[id]/hide` | Hide review | AdminReviewsClient |
| POST `/api/admin/reviews/[id]/dismiss-flag` | Dismiss flag | FlaggedReviewsClient |
| POST `/api/admin/reviews/[id]/approve-flag` | Approve flag | FlaggedReviewsClient |
| PATCH `/api/admin/reviews/[id]/guidance` | Set guidance | FlaggedReviewsClient |
| GET/POST/PATCH/DELETE `/api/admin/custom-categories`, `.../custom-categories/[id]`, `.../logs` | Custom categories CRUD | AdminCustomCategoriesClient (server + client) |

---

## 6. Files / Modules Not Used (or Rarely Used)

- **`lib/client/market.ts`** — `searchListings()` is never imported; BrowseClient builds URL and uses `apiGet` directly.
- **`components/RolePicker.tsx`** — Not imported; signup/onboarding use `RoleSelection` instead.
- **`components/WeeklyBox.tsx`** — Not imported anywhere.
- **`components/ProductCard.tsx`** — Not imported; product grids use other patterns (e.g. ProducerProductGrid).
- **`components/EventCard.tsx`** — Not imported anywhere.
- **`components/CatalogSelector.tsx`** — Not imported anywhere.
- **`nul`** (root) — Windows artifact file; safe to delete.

**Note:** `docs/verification-pass-report.md` also notes: (1) Admin custom categories `handleReject` used raw `fetch` in one place (may have been fixed with apiPatch); (2) Dashboard messages page had dead server-side `getConversations()` — remove if still present.

---

## 7. Is Everything Working? (Health & Verification)

### Working as designed

- **Auth:** Dev stub and Clerk; sign-in, sign-up, onboarding, sign-out, primary-mode switch.
- **Market:** Browse → shop → cart → checkout → order confirmation; listings and delivery options from API.
- **Care:** Browse, caregiver profile, booking flow, post-job; redirects to messages.
- **Dashboard:** Buyer vs producer views; revenue, orders, messages, products, events, reviews, care-bookings; alerts and metrics.
- **Admin:** Users, listings, bookings, help-exchange, reports, reviews, flagged-reviews, custom categories.
- **API contract:** Frontend uses `apiGet`/`apiPost`/`apiPatch`/`apiDelete`; errors show `InlineAlert` and requestId for 500s; loading/empty states on key screens.

### Things to verify or fix

1. **Rate limiting:** 429 should show friendly "Too many requests" (api-client handles RATE_LIMIT).
2. **Dashboard messages page:** If server still calls `getConversations()` and ignores result, remove that dead code.
3. **Care bookings / Dashboard orders:** Add error handling if server data fetch throws (try/catch + InlineAlert or redirect).
4. **Subscriptions:** `/dashboard/subscriptions` is placeholder (TODO).
5. **Stripe:** Not wired; no real payments yet.
6. **Care** is always available; access to Care actions (e.g. booking, post-job) is controlled by authz and user capabilities, not a feature flag.
7. **API consistency:** Consider tightening `requestId` usage and query validation in `/api/listings` (e.g. align with `withRequestId()` and Zod for query params) for consistency with other routes.

### Manual test checklist (from frontend-api-ux-upgrade-summary)

- Market browse: ZIP/radius, loading skeleton, empty state, error with requestId.
- Cart & checkout: delivery options, place order, error/rate limit messaging.
- Dashboard: producer metrics, orders, products, messages, events, reviews, care-bookings.
- Auth: dev login, signup, onboarding, sign out.
- Care: browse, booking, messages redirect; dashboard care-bookings.
- Admin: custom categories, flagged reviews, reports status.

---

## 8. Backend Summary

- **API layer:** Next.js Route Handlers only (`app/api/**/route.ts`). No Server Actions for mutations.
- **Validation:** Zod in `lib/validators.ts`; routes use `parseJsonBody()` from `lib/api.ts` then validate.
- **Responses:** `lib/api.ts`: `ok(data)`, `fail(error, code?, status)`; consistent JSON shape; no raw DB errors to client.
- **Auth:** `getCurrentUser()` in layouts/pages; `requireAuth`, `requireAdmin`, `requireProducerOrAdmin` where needed.
- **DB:** PostgreSQL via Prisma; schema in `prisma/schema.prisma` (User, Product, Order, Review, Conversation, CareBooking, etc.).
- **Roles:** User flags (`isProducer`, `isBuyer`, `isCaregiver`, `isHomesteadOwner`) and UserRole table; `getUserCapabilities()` in authz drives UI and access.

---

## 9. Quick Reference

- **Routes overview:** `docs/routes.md`
- **UI/design system:** `docs/ui-understanding.md`
- **Frontend API/UX upgrade:** `docs/frontend-api-ux-upgrade-summary.md`
- **Verification report:** `docs/verification-pass-report.md`
- **High-level audit:** `docs/high-level-audit.md`
- **Nav config (dashboard/admin/buyer):** `lib/nav-config.ts`
- **Nav behavior (hide chrome, app area):** `lib/nav-routes.ts`
- **API client:** `lib/client/api-client.ts` — use `apiGet`, `apiPost`, `apiPatch`, `apiDelete` for all `/api` calls.

---

## 10. Detailed File Structure (Reference)

### App pages (app/)

```
app/
├── layout.tsx
├── page.tsx
├── about/page.tsx
├── auth/login/page.tsx, auth/signup/page.tsx, auth/onboarding/page.tsx + OnboardingClient.tsx
├── sign-in/page.tsx, sign-up/page.tsx (redirects)
├── market/page.tsx, market/browse/page.tsx, market/shop/[id]/page.tsx
├── market/cart/page.tsx + CartPageClient.tsx
├── market/checkout/page.tsx + CheckoutClient.tsx
├── market/order-confirmation/[orderId]/page.tsx
├── care/page.tsx, care/browse/page.tsx + CareBrowseClient.tsx
├── care/caregiver/[id]/page.tsx, BookingForm.tsx, CaregiverActions.tsx, ProfileViewTracker.tsx
├── care/post-job/page.tsx + PostJobForm.tsx
├── care-safety/page.tsx, seller-guidelines/page.tsx, community-guidelines/page.tsx
├── privacy/page.tsx, terms/page.tsx
├── dashboard/layout.tsx, page.tsx, DashboardNav.tsx, BuyerDashboardNav.tsx
├── dashboard/profile/page.tsx, orders/page.tsx + ProducerOrdersClient, BuyerOrdersClient
├── dashboard/revenue/page.tsx + RevenuePageClient.tsx
├── dashboard/customers/page.tsx + CustomersClient, analytics/page.tsx, messages/page.tsx + DashboardMessagesClient
├── dashboard/products/page.tsx + ProductsClient, events/page.tsx + EventsClient
├── dashboard/reviews/page.tsx + ProducerReviewsClient, records/page.tsx + RecordsClient
├── dashboard/care-bookings/page.tsx + CareBookingsClient, subscriptions/page.tsx
├── admin/layout.tsx, page.tsx, AdminNav.tsx
├── admin/users/page.tsx + UsersClient, listings/page.tsx + ListingsClient
├── admin/reviews/page.tsx + AdminReviewsClient, flagged-reviews/page.tsx + FlaggedReviewsClient
├── admin/custom-categories/page.tsx + AdminCustomCategoriesClient
├── admin/bookings/page.tsx + BookingsClient, help-exchange/page.tsx + HelpExchangeClient
└── admin/reports/page.tsx + ReportsClient
```

### API routes (app/api/)

```
api/
├── auth/dev-login, dev-signup, signup, sign-out, onboarding, primary-mode
├── account (GET, PATCH)
├── listings (GET), shop/[id]/delivery (GET)
├── orders (POST), orders/[id] (PATCH), orders/[id]/review (POST)
├── item-requests (GET, POST)
├── products (GET, POST), products/[id] (GET, PATCH, DELETE)
├── catalog/categories (GET), catalog/custom-categories (GET, POST)
├── reviews/route (POST), reviews/[id] (GET, PATCH)
├── care/caregivers (GET), care/caregivers/[id] (GET)
├── care/bookings (POST), care/bookings/[id] (GET, PATCH), care/bookings/[id]/conversation (POST)
├── help-exchange/postings (POST)
├── dashboard/summary (GET), profile (GET, PATCH), conversations (GET), conversations/create (POST)
├── dashboard/events (GET, POST), events/[id] (GET, PATCH, DELETE)
├── dashboard/reviews (GET), reviews/[id]/approve, flag, message (POST)
├── dashboard/customers/note (PATCH)
├── reports (GET, POST)
├── request-logs (if present)
├── admin/users, listings, bookings, help-exchange (GET)
├── admin/reports/[id]/status (POST)
├── admin/reviews/[id]/hide, dismiss-flag, approve-flag, guidance (POST/PATCH)
└── admin/custom-categories (GET, POST), [id] (PATCH, DELETE), logs (GET)
```

### Lib (lib/)

```
lib/
├── auth (server.ts, types), authz (server.ts, client.ts), api.ts, prisma.ts
├── validators.ts, utils (formatDate, formatPrice, etc.)
├── client/api-client.ts, market.ts, care.ts, helpExchange.ts
├── nav-routes.ts, nav-config.ts
├── geo/ (constants, distance, filter, zip), market/, care/ (search-params, categories, types, labels, telemetry)
├── orders/, reviews/ (types), messaging/, messaging/pii-blocklist
├── dashboard-alerts, producer-metrics
├── reports.ts, request-log, logger, rate-limit
├── notify/notify.ts
└── search/ (url, keys, types)
```
