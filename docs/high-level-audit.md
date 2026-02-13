# High-Level Technical Audit

**Project:** The Local Yield  
**Date:** [Insert Date]  
**Auditor:** [Name]  
**Environment:** Dev / Staging / Production  

---

## 1. Executive Summary

### 1.1 Product Overview

**Clear one-paragraph description of what the app does**

The Local Yield is local economic infrastructure on one domain with two experiences. **Market**: buyers browse goods by ZIP/radius, add to cart, checkout (pickup or delivery); producers manage products, profile, orders, and see demand near them. **Care** (feature-flagged): seekers browse caregivers by location/species/service, view profiles with trust signals, and request bookings; caregivers manage listings and bookings. Shared backbone: one User table with role flags (isProducer, isBuyer, isCaregiver, isHomesteadOwner), location (ZIP + lib/geo), messaging (Conversation/Message), trust infrastructure (resolution window, structured reviews, admin moderation), and reviews (Market | Care). Stripe is stubbed and ready for wiring (no keys = no checkout).

**Defined user roles (Buyer, Producer, Admin, etc.)**

- **BUYER** — Browse market, cart, checkout, orders, messages, (optional) request items; optional Care seeker.
- **PRODUCER** — Sell products, manage profile, orders, products, events, customers, records, reviews, messages; dashboard with revenue/metrics.
- **CAREGIVER** — Care listings, bookings, messages; dashboard care-bookings.
- **CARE_SEEKER / Homestead owner** — Find care, request bookings, messages.
- **ADMIN** — All producer capabilities plus: users, listings, reviews moderation, flagged reviews, custom categories; admin action logs.

Roles are stored as `User.role` (legacy) and `UserRole` join table; flags `isProducer`, `isBuyer`, `isCaregiver`, `isHomesteadOwner` drive UI and access.

**Clear definition of MVP vs future features**

- **MVP (current):** Market browse/shop/cart/checkout/order confirmation; producer dashboard (revenue, analytics, orders, products, profile, customers, records, events, reviews, messages); Care browse/caregiver profile/booking (when `NEXT_PUBLIC_ENABLE_CARE=true`); auth (Clerk or dev stub); item requests; reviews with resolution window and admin moderation; messaging for orders/care.
- **Future:** Stripe checkout and payouts; weekly box subscriptions UI; PWA/mobile app tabs and deep links; split payouts/escrow for Care.

**Monetization model documented**

- Producers sell goods (orders); future: platform fee, Stripe payments. Care: booking flow and messaging in place; future: care fees/escrow. No subscription fee for buyers/producers today.

**Public URL(s) documented**

- Production: [Insert e.g. thelocalyield.com]
- Staging: [Insert staging URL]

**Staging / Dev URL(s) documented**

- Dev: `http://localhost:3000` (or per README)

---

## 2. Tech Stack Documentation

### 2.1 Frontend

- **Framework and version:** Next.js 16.1.6, App Router (`app/`).
- **TypeScript strict mode:** Enabled (`tsconfig.json`: `"strict": true`).
- **State management:** React Context for cart (`contexts/CartContext.tsx`, localStorage key `localyield_cart`). Server state via `getCurrentUser()` and server components; client components call API routes or use context. No global client store.
- **Styling:** Tailwind CSS v4; `app/globals.css` with `@theme` (brand, brand-light, brand-accent, font-display, font-body). Components use Tailwind utility classes.

### 2.2 Backend

- **API strategy:** Next.js Route Handlers only (`app/api/**/route.ts`). No Server Actions for mutations; all mutations go through API routes. Server pages load data in server components (Prisma, lib) and pass to client components as needed.
- **Input validation:** Zod in `lib/validators.ts` (CreateOrderSchema, UpdateOrderStatusSchema, OnboardingSchema, ProfileUpdateSchema, SignupSchema, etc.). API routes use `parseJsonBody()` from `lib/api.ts` then validate with Zod; invalid bodies return 400 with structured error.
- **Error handling:** `lib/api.ts`: `ok(data)`, `fail(error, code?, status)`. Routes return `NextResponse.json` with consistent shape. No raw DB errors surfaced to client; errors are caught and returned as message strings or codes.

### 2.3 Database

- **Database provider:** PostgreSQL (Prisma).
- **Prisma version:** 7.3.x (`@prisma/client`, `prisma` in package.json).
- **Migration history:** Migrations under `prisma/migrations/` with descriptive names (e.g. phase1_shared_infrastructure, p0_order_fulfillment, add_custom_category, review_flagged_for_admin, add_primary_mode_user_roles_care_profiles). Migration lock present.
- **Schema drift:** [Auditor: verify no drift between dev/staging/production — run `prisma migrate status` and compare.]

### 2.4 Infrastructure

- **Hosting provider:** [Insert e.g. Vercel]
- **Environment variable list (names only):**  
  `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_ENABLE_CARE`, `NEXT_PUBLIC_ENABLE_DEV_TOOLS`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_APP_URL` (optional; used for messages base URL). Optional Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Production and development separated:** `NODE_ENV` used (e.g. dev stub auth only when not production; cookie `secure` in production). Clerk middleware active only when Clerk env vars set.
- **Deployment process:** [Auditor: document — e.g. Git push → Vercel build → migrate/seed policy.]

---

## 3. Architecture Review

### 3.1 Folder Structure

- **Logical separation:**  
  `app/` — routes, layouts, page and API route handlers.  
  `components/` — shared UI (Navbar, cart, forms, cards); `components/dashboard/` for dashboard-specific (MetricCard, GrowthSignalCard).  
  `lib/` — server-side business logic (auth, orders, validators, api, prisma, geo, care, producer-metrics, etc.).  
  `prisma/` — schema, migrations, seed.  
  `types/` — shared types (`index.ts`, `listings.ts`, `care.ts`).  
  `contexts/` — CartContext.  
  API routes live under `app/api/` by domain (auth, orders, products, care, dashboard, admin, catalog, etc.).
- **Circular dependencies:** [Auditor: run dependency analysis; current design avoids lib → app/components cycles.]
- **Business logic in UI:** Business logic lives in `lib/`; pages and API routes call lib. UI components handle presentation and call API or context; no direct Prisma in components.

### 3.2 Data Flow

- **Request lifecycle:** User → Page or API Route → (if API) parse body → validate with Zod → call lib (Prisma, orders, care, etc.) → return JSON or redirect. No direct DB calls inside React components; server components use async data loading and pass props.
- **No direct DB in components:** Confirmed; only server pages and API routes use Prisma.
- **No duplicated business logic:** Order creation, care booking, profile updates, etc. live in lib; API routes are thin (parse → validate → lib).

### 3.3 Shared Types

- **Centralized types:** `types/index.ts`, `types/listings.ts`, `types/care.ts`; API and components import as needed. SessionUser and Role in `lib/auth`; ProducerMetrics in `lib/producer-metrics`.
- **API responses typed:** Responses are JSON with known shapes; some routes return `{ ok, data }` or `{ ok: false, error, code }`. [Auditor: recommend formalizing response types per route where missing.]
- **Mobile and web type parity:** Same codebase for web; if Expo/mobile is added, shared types in `types/` and shared lib contracts support parity.
- **No `any` in production code:** TypeScript strict; [Auditor: grep for `: any` and fix or document exceptions.]

---

## 4. Authentication & Authorization

### 4.1 Authentication

- **Session handling:** Clerk when env vars set; otherwise dev stub (`__dev_user` cookie). Session established via Clerk or dev-login; `getCurrentUser()` in layout/pages and API returns `SessionUser | null`. Cookies used for stub; Clerk manages its own session.
- **Password hashing:** Clerk handles auth; dev stub has no passwords. If custom auth added, use secure hashing (e.g. bcrypt).
- **Tokens not exposed to client:** Session identity resolved server-side; no raw tokens sent to client in responses.
- **Environment secrets:** Clerk secret and Stripe secret are server-only; `.env.example` documents names without values.

### 4.2 Role-Based Access Control

- **Roles in schema:** `User.role` (enum), `UserRole` join table, and flags `isProducer`, `isBuyer`, `isCaregiver`, `isHomesteadOwner`. `requireProducerOrAdmin()`, `requireAdmin()` in `lib/auth` throw if unauthorized.
- **Middleware:** `proxy.ts` (Clerk middleware when configured) protects `/dashboard(.*)`, `/market/checkout(.*)`, `/api/dashboard(.*)`, `/api/orders(.*)`, `/api/products(.*)`. When Clerk not set, middleware is no-op for dev stub.
- **Admin routes:** All `/admin/*` pages call `requireAdmin()`; API routes use `requireAdmin()`.
- **Producer-only routes:** Dashboard profile, products, customers, records, etc. use `requireProducerOrAdmin()`; care-bookings allow caregiver role.
- **No role checks client-only:** Role is used for UI (Navbar, dashboard tabs); enforcement is server-side in pages and API.

### 4.3 Security Controls

- **CSRF:** Same-origin API calls; [Auditor: confirm CSRF strategy if forms POST to API from other origins.]
- **CORS:** Next.js default; [Auditor: verify CORS if mobile or external clients call API.]
- **Rate limiting:** [Not implemented at audit time — document as recommendation.]
- **Stripe webhook signature:** `lib/stripe.ts` has `constructWebhookEvent` stub; when Stripe is enabled, webhook route must verify signature with `STRIPE_WEBHOOK_SECRET`.
- **File upload validation:** [Auditor: if UploadThing or other uploads are used, document validation and size limits.]

---

## 5. Database & Schema Integrity

### 5.1 Schema Design

- **Foreign keys:** Used throughout (User, Order, OrderItem, Product, Conversation, Message, Review, CareBooking, etc.).
- **Cascading:** Defined on relations (e.g. `onDelete: Cascade` for Order → OrderItem, User → ProducerProfile). [Auditor: confirm cascade rules are intentional.]
- **Indexes:** [Auditor: review schema for high-traffic fields — e.g. Order.producerId, Order.buyerId, Order.status, Product.userId, Message.conversationId — and add indexes if missing.]
- **Unique constraints:** User.email, User.clerkId, UserRole (userId, role), etc.
- **JSON usage:** AdminActionLog.details, etc.; relational data is in normal tables, not overused as JSON.

### 5.2 Marketplace Logic (Critical)

- **Orders linked to users:** Order.buyerId, Order.producerId → User. OrderItem → Order, Product.
- **Line items:** OrderItem (orderId, productId, quantity, unitPriceCents); order creation in `lib/orders.createOrder()` uses transaction and snapshot prices.
- **Payment status:** Order.paid, Order.paidAt, Order.status (PENDING, PAID, FULFILLED, CANCELED, REFUNDED); Order.stripeSessionId for future Stripe.
- **Race conditions:** Order creation in single transaction; [Auditor: confirm inventory/quantity handling if applicable.]

### 5.3 Data Integrity

- **Soft delete:** Not used globally; some entities use status (e.g. Review.hiddenByAdmin). [Auditor: define soft-delete strategy if required.]
- **Orphaned records:** Cascades and required relations reduce orphans; [Auditor: spot-check key relations.]
- **Audit fields:** createdAt/updatedAt on major models; AdminActionLog for admin actions.
- **Seed data:** `prisma/seed.ts`; separate from production data; [Auditor: confirm seed not run in production or is idempotent.]

---

## 6. API Quality & Standards

### 6.1 Structure

- **All API routes documented:** See `docs/routes.md` for full list of API routes and purposes.
- **Consistent response shape:** `ok(data)` / `fail(error, code, status)` from `lib/api`; many routes return `{ ok, data }` or error object with message.
- **HTTP status codes:** 200/201 for success, 400 for validation, 401/403 for auth, 404/500 as appropriate. [Auditor: audit individual routes for correct status codes.]
- **No raw DB errors returned:** Errors caught and converted to message strings or codes.

### 6.2 Validation

- **All inputs validated server-side:** Mutable POST/PATCH bodies use Zod in `lib/validators.ts`; routes call parseJsonBody then schema.parse or safeParse.
- **Zod schemas centralized:** `lib/validators.ts`.
- **No trust of client input:** Validation on every mutation; IDs and scopes checked in lib (e.g. producer can only update own orders).

### 6.3 Error Handling

- **Structured format:** `fail(error, code?, status)` returns JSON with `ok: false`, `error`, optional `code`.
- **Logging:** [Auditor: confirm production error logging — e.g. server logs or error monitoring.]
- **No sensitive data in error messages:** Generic messages to client; details only in server logs.

---

## 7. Performance & Scalability

### 7.1 Query Efficiency

- **N+1:** [Auditor: review list routes (listings, orders, caregivers) for includes and avoid N+1; producer-metrics uses targeted aggregates.]
- **Pagination:** [Auditor: confirm pagination on large lists (e.g. orders, messages, admin lists).]
- **Filtering and search:** Listings/caregivers use ZIP/radius and filters; geo in lib/geo. [Auditor: confirm indexes support filters.]
- **Geo:** `getDistanceBetweenZips` (in-memory or DB); caregiver/producer listing filtered by radius in application or DB.

### 7.2 Caching

- **Revalidation:** Next.js default; [Auditor: document revalidate or cache headers for key pages/APIs.]
- **Server caching:** [Not explicitly implemented — document if added.]
- **Re-renders:** Client components use local state and context; [Auditor: spot-check for unnecessary re-renders.]

### 7.3 Scalability Risk

- **First scaling bottleneck:** [Auditor: identify — e.g. listing search, order creation, or messaging.]
- **Plan for 10,000+ users:** [Auditor: outline — DB connection pooling, read replicas, background jobs, CDN.]
- **Background jobs:** [Not implemented — document strategy for order reminders, cleanup, webhooks.]
- **Webhook queueing:** When Stripe is live, webhook handler should be idempotent and consider queue for heavy work.

---

## 8. Stripe & Payments Audit (If Enabled)

- **Stripe keys stored securely:** Server env only (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`); not exposed to client.
- **No secret keys client-side:** Confirmed.
- **Webhook endpoint secured:** `lib/stripe.ts` provides `constructWebhookEvent`; route must verify signature and use it. [When enabled: implement and test.]
- **Idempotency:** [When Stripe is live: document idempotency keys for payment and order creation.]
- **Payment failures:** [When live: document retry and user messaging.]
- **Order creation only after payment confirmation:** Current flow creates order on checkout (cash/viaCash or placeholder); when Stripe is wired, order creation must follow payment confirmation (e.g. checkout.session.completed or payment_intent.succeeded).

---

## 9. Mobile & API Parity (If Using Expo)

- **Mobile consumes production API URL:** [If mobile app exists: document base URL config; no hardcoded localhost.]
- **Shared types strategy:** `types/` and lib contracts support shared types for web and mobile.
- **Authentication flow consistent:** Same session model (Clerk or token); mobile must use same auth contract.
- **No route logic duplicated in mobile:** Business logic in lib/API; mobile calls API only.

---

## 10. AI-Generated Code Review (Cursor Audit)

### 10.1 AI Usage Transparency

- **Identify which modules were AI-generated:** [Auditor/team: list modules or areas that were AI-assisted.]
- **Confirm manual refactors performed:** [Auditor: confirm critical paths (auth, orders, payments) were reviewed and refactored.]
- **Remove duplicated or hallucinated logic:** [Auditor: search for duplicate helpers or dead code.]

### 10.2 Code Consistency

- **Naming conventions:** Components PascalCase; lib functions camelCase; routes kebab or camel per Next.js. [Auditor: confirm consistency.]
- **Unused imports:** ESLint and TypeScript help; [Auditor: run lint and fix.]
- **Commented-out legacy blocks:** [Auditor: remove or document.]
- **Dead routes:** [Auditor: confirm all routes in docs/routes.md are reachable and used.]

### 10.3 Technical Debt Log

- Known refactors: [e.g. formalize API response types; add rate limiting; rename proxy.ts → middleware.ts if Next.js expects it.]
- Quick fixes: [e.g. add missing indexes; tighten error messages.]
- Architectural compromises: [e.g. order created before Stripe payment when Stripe disabled; dev stub auth for local development.]

---

## 11. Testing & Code Quality

### 11.1 Static Quality

- **ESLint:** Configured (`eslint.config.mjs` with eslint-config-next).
- **Prettier:** [Auditor: confirm if Prettier is in use and format-on-save.]
- **TypeScript strict:** Enabled.
- **No console.logs in production:** [Auditor: grep and remove or replace with logger.]

### 11.2 Testing

- **Unit tests:** [Auditor: document — present or planned; e.g. lib/validators, lib/orders.]
- **API route tests:** [Auditor: document — present or planned.]
- **Integration tests:** [Auditor: document — e.g. checkout flow, auth.]
- **Critical order flow tested:** [Auditor: document coverage.]
- **Auth edge cases tested:** [Auditor: document — e.g. unauthenticated, wrong role.]

---

## 12. DevOps & Production Readiness

- **CI/CD pipeline:** [Auditor: document — e.g. GitHub Actions, Vercel.]
- **Deployment rollback plan:** [Auditor: document.]
- **Error monitoring:** [Auditor: document — e.g. Sentry, Vercel logs.]
- **Logging strategy:** [Auditor: document — what is logged where.]
- **Database backup strategy:** [Auditor: document.]
- **Environment parity:** [Auditor: verify dev/staging/prod env vars and DB state.]

---

## 13. Risk Assessment

**High Risk**

- [Auditor: list critical issues — e.g. Stripe not wired but order marked PAID; missing rate limiting on auth; etc.]

**Medium Risk**

- [Auditor: list structural weaknesses — e.g. no pagination on some lists; no background job for webhooks; etc.]

**Low Risk**

- [Auditor: list minor improvements — e.g. unused components; optional type tightening.]

---

## 14. Production Readiness Score

| Area              | Score (/) | Notes |
|-------------------|-----------|--------|
| Architecture      | ___ / 10  | [Auditor] |
| Security          | ___ / 10  | [Auditor] |
| Scalability       | ___ / 10  | [Auditor] |
| Code Quality      | ___ / 10  | [Auditor] |
| Business Risk     | ___ / 10  | [Auditor] |
| **Overall Readiness** | ___ / 10 | [Auditor] |

---

## 15. 30 / 60 / 90 Day Stabilization Plan

**30 Days**

- Immediate security fixes: [Auditor: list.]
- Critical refactors: [Auditor: list.]
- Stripe hardening: [If going live with payments: webhook verification, idempotency, order-after-payment.]

**60 Days**

- Performance optimization: [Auditor: list — e.g. indexes, pagination, caching.]
- Add tests: [Auditor: list — unit, API, integration.]
- Mobile parity hardening: [If mobile: API contract, auth, types.]

**90 Days**

- Scaling improvements: [Auditor: list.]
- Monitoring automation: [Auditor: list.]
- Tech debt reduction: [Auditor: list.]

---

## Appendix: File Placement & Data Flow (Reference)

- **Pages:** `app/**/page.tsx` (server components; client components colocated where needed).
- **API routes:** `app/api/**/route.ts`.
- **Shared UI:** `components/` and `components/dashboard/`.
- **Page-specific client logic:** e.g. `CheckoutClient`, `CartPageClient`, `ProducerOrdersClient`, `OnboardingClient`, `CareBrowseClient`, `RevenuePageClient`, `CareBookingsClient`, `DashboardMessagesClient`, `ProducerReviewsClient`, `EventsClient`, etc., next to their pages or under the same segment.
- **State:** `contexts/CartContext.tsx` for cart (localStorage).
- **Server-only logic:** `lib/` (auth, orders, validators, api, prisma, geo, care, producer-metrics, dashboard-alerts, messaging, etc.).
- **Types:** `types/index.ts`, `types/listings.ts`, `types/care.ts`; API and components import as needed.

**Key data flows:** Session (getCurrentUser); Market browse → GET /api/listings → geo + Prisma → ListingRow; Shop → ProducerProductGrid + AddToCartButton → CartContext; Checkout → POST /api/orders → lib/orders.createOrder; Producer orders → getOrdersForProducer, PATCH /api/orders/[id]; Care booking → POST /api/care/bookings → lib/care + lib/messaging; Dashboard metrics → getProducerMetrics (revenue, orders, top product, repeat customers). All mutable API bodies validated with Zod in `lib/validators`; routes use `parseJsonBody` and `ok`/`fail` from `lib/api`.
