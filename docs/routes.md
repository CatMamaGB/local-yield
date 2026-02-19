# Route layout (one domain, two experiences)

Exact paths for thelocalyield.com. Deep links map 1:1 to these paths (PWA + mobile app).

**Last updated:** 2026-02-18

---

## Public website + web app (PWA)

### Landing & info

| Path | Purpose |
|------|--------|
| `/` | Brand landing: “Choose your path” (Market vs Care). Links to `/market`, `/care`, `/about`. |
| `/about` | About page. |

### Market (buyer flow)

**Nav:** Navbar “Browse” → `/market` (Market hub). `/market/browse` is the listings/results page (reached from hub search or post-login default).

| Path | Purpose |
|------|--------|
| `/market` | Market home (hub): hero + MarketHomeSearchCard (category, ZIP, radius, q). Links to browse. |
| `/market/browse` | Browse listings: Products \| Producers view, group/category, sort, ZIP/radius/q. URL params: view, map, group, category, sort, zip, radius, q. |
| `/market/shop/[id]` | Producer storefront (products, add to cart). |
| `/market/cart` | Shopping cart. |
| `/market/checkout` | Checkout (fulfillment, place order). |
| `/market/order-confirmation/[orderId]` | Order confirmation. |

### Care

Care is always available alongside Market.

| Path | Purpose |
|------|--------|
| `/care` | Care hub: hero + search card. |
| `/care/browse` | Browse caregivers (ZIP/radius/species/service). |
| `/care/caregiver/[id]` | Caregiver profile: trust signals, listings, reviews, booking form. |

---

## Auth

| Path | Purpose |
|------|--------|
| `/auth/login` | Sign in. Supports `?next=` for post-login redirect (validated safe path). |
| `/auth/signup` | Sign up (Buyer always on; "what else" = Sell / Offer help / Find help). Supports `?next=` for post-signup → onboarding redirect. |
| `/auth/onboarding` | Terms + optional ZIP + roles. Optional after terms; redirect uses lastActiveMode or `next=`. |
| `/sign-in` | Redirects to `/auth/login`. |
| `/sign-up` | Redirects to `/auth/signup`. |

---

## Dashboard (authenticated)

**Buyer-only:** Dashboard home shows orders + browse; no producer tabs.

**Producer/Admin:** Full dashboard with nav tabs and secondary links.

### Dashboard pages

| Path | Purpose |
|------|--------|
| `/dashboard` | Dashboard home. Producer: alerts, Snapshot Metrics, Growth Signals, Repeat Behavior, quick actions, recent orders, Demand near you. |
| `/dashboard/revenue` | Revenue: Overview (chart + metrics), Orders tab, Customers tab. |
| `/dashboard/customers` | Customers list (producer). |
| `/dashboard/analytics` | Sales analytics: revenue, order count, avg order, sales history. |
| `/dashboard/orders` | Orders list (buyer or producer view). |
| `/dashboard/messages` | Conversations/messages. |
| `/dashboard/profile` | Profile: account + "Your modes" (add Seller/Helper/Hire without new account). |
| `/dashboard/products` | Products list; Add product / edit / delete. Create: name, category (auto-suggest), price, quantity, organic, photo, fulfillment; category validated against catalog; post-save redirect to list. Non-producer → onboarding. |
| `/dashboard/events` | Events management. |
| `/dashboard/reviews` | Reviews management (producer). |
| `/dashboard/records` | Sales records. |
| `/dashboard/subscriptions` | Subscriptions (producer). |
| `/dashboard/care-bookings` | Care bookings (seeker or caregiver). |

---

## Admin (admin-only)

Non-admins visiting `/admin/*` receive **403** (dev: middleware; prod: layout shows forbidden view). Admins can use both Dashboard and Admin.

| Path | Purpose |
|------|--------|
| `/admin` | Admin home (redirects to reviews or overview). |
| `/admin/users` | User management. |
| `/admin/listings` | Listings management. |
| `/admin/reviews` | Reviews moderation. |
| `/admin/flagged-reviews` | Flagged reviews queue (approve/dismiss/guidance). |
| `/admin/custom-categories` | Custom category management. |

---

## API routes (summary)

### Auth

- `POST /api/auth/dev-login` — Dev stub login.
- `POST /api/auth/dev-signup` — Dev stub signup.
- `POST /api/auth/signup` — Signup with role.
- `POST /api/auth/onboarding` — Terms + optional ZIP + roles; sets termsAcceptedAt, onboardingCompletedAt.
- `PATCH /api/auth/primary-mode` — Set primary mode + __last_active_mode cookie (authenticated).
- `POST /api/account/modes` — Add mode (SELL/HELPER/HIRE) idempotent; returns redirect, incompleteSteps, alreadyEnabled.
- `POST /api/auth/sign-out` — Sign out.

### Market

- `GET /api/listings` — Listings by ZIP/radius/q.
- `GET /api/shop/[id]/delivery` — Delivery options for shop.
- `POST /api/orders` — Create order from cart (authenticated).
- `PATCH /api/orders/[id]` — Update order status (producer/admin).
- `POST /api/orders/[id]/review` — Create order review (authenticated).
- `GET /api/item-requests`, `POST /api/item-requests` — Item requests (POST authenticated).

### Products & catalog

- `GET /api/products`, `POST /api/products` — Products CRUD (POST: producer/admin; body may include unit, isOrganic, imageUrl).
- `GET /api/products/[id]`, `PATCH /api/products/[id]`, `DELETE /api/products/[id]` — Single product (producer/admin).
- `POST /api/upload/image` — Upload product photo (multipart `file`); returns `{ url }`. Requires producer/admin; optional when BLOB_READ_WRITE_TOKEN not set (returns 503, use URL).
- `GET /api/catalog/categories` — Public catalog categories.
- `GET /api/catalog/custom-categories` — Public custom categories.

### Care

- `GET /api/care/caregivers` — List caregivers (ZIP/radius/species/serviceType).
- `GET /api/care/caregivers/[id]` — Caregiver profile.
- `POST /api/care/bookings` — Create booking (authenticated).
- `GET /api/care/bookings/[id]`, `PATCH /api/care/bookings/[id]` — Booking get/update (authenticated).
- `GET /api/care/bookings/[id]/conversation` — Get/create conversation for booking (authenticated).

### Account (all authenticated users)

- `GET /api/account` — Current user account (name, email, phone, zipCode, address). Any authenticated user.
- `PATCH /api/account` — Update name, phone, zipCode, address (any authenticated user).

### Dashboard

- `GET /api/dashboard/conversations` — List conversations (authenticated).
- `POST /api/dashboard/customers/note` — Set customer note (authenticated).
- `GET /api/dashboard/events`, `POST /api/dashboard/events` — Events CRUD (producer/admin).
- `GET /api/dashboard/events/[id]`, `PATCH /api/dashboard/events/[id]`, `DELETE /api/dashboard/events/[id]` — Single event.
- `PATCH /api/dashboard/profile` — Update producer profile (producer/admin).
- `GET /api/dashboard/reviews`, `POST /api/dashboard/reviews` — Reviews list/create (authenticated).
- `POST /api/dashboard/reviews/[id]/approve` — Approve private review (producer/admin).
- `POST /api/dashboard/reviews/[id]/flag` — Flag review (authenticated).
- `POST /api/dashboard/reviews/[id]/message` — Message reviewer (producer/admin).
- `GET /api/dashboard/summary` — Dashboard summary stats (producer/admin).

### Reviews (public)

- `GET /api/reviews/[id]` — Public review details.

### Admin

- `POST /api/admin/reviews/[id]/hide` — Hide review (admin).
- `POST /api/admin/reviews/[id]/approve-flag` — Approve flagged review (admin).
- `POST /api/admin/reviews/[id]/dismiss-flag` — Dismiss flag (admin).
- `POST /api/admin/reviews/[id]/guidance` — Guidance on flagged review (admin).
- `GET /api/admin/custom-categories`, `POST /api/admin/custom-categories` — Custom categories CRUD (admin).
- `PATCH /api/admin/custom-categories/[id]`, `DELETE /api/admin/custom-categories/[id]` — Single category (admin).
- `GET /api/admin/custom-categories/logs` — Admin action logs (admin).

---

## Mobile app

- **Tabs:** Market | Orders | Messages | Profile | Care.
- **Deep links:** Same paths as above (e.g. `thelocalyield.com/market/shop/123` opens app to that storefront when installed).
