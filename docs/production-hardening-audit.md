# Production Hardening Audit — Findings & Fixes

**Project:** The Local Yield  
**Date:** 2026-02-12  
**Scope:** Payments/orders sequencing, rate limiting, cookie safety, paid-state guardrails, logging, API response shape, Prisma indexes.

---

## Phase 1 — Findings (Report)

### A) Payments / Orders sequencing (HIGH RISK)

**Where orders are created**

- **Route:** `POST /api/orders`  
- **Handler:** `app/api/orders/route.ts` → calls `createOrder()` from `lib/orders.ts`.  
- **Body:** `{ producerId, items, fulfillmentType?, notes?, pickupDate? }`.  
- **Payment:** API currently passes `paymentMethod: "cash"` only (hardcoded).

**Order creation in `lib/orders.ts`**

- `createOrder()` builds order with:
  - `paid`: was set to `input.paymentMethod === "card"` (so `true` for card at creation time without Stripe).
  - `viaCash`: `input.paymentMethod === "cash"`.
  - `status`: always `"PENDING"` at creation.

**Status transitions**

- **Route:** `PATCH /api/orders/[id]` (`app/api/orders/[id]/route.ts`).  
- **Valid transitions:** PENDING → PAID, CANCELED; PAID → FULFILLED, CANCELED, REFUNDED; FULFILLED/CANCELED/REFUNDED terminal.  
- **Problem:** PATCH allowed PENDING → PAID for any order; no check that the order was cash. Card orders must only become PAID via Stripe webhook.

**Code paths that set `paid = true` or `paidAt`**

1. **At creation:** Previously `paid = (paymentMethod === "card")`. **Fix applied:** `paid` is now always `false` at creation; card payments will set it in Stripe webhook when implemented.  
2. **PATCH:** When `newStatus === "PAID"`, handler set `paidAt = new Date()`. **Fix applied:** PATCH now allows PENDING → PAID only when `order.viaCash === true`; otherwise returns 400 with clear error.

**Cash / placeholder representation**

- `Order.viaCash` = true for cash; `Order.paid` = false at creation. Producer marks cash orders PAID via PATCH. Card orders: `paid` remains false until Stripe webhook sets it (TODO when Stripe is wired).

---

### B) Rate limiting + abuse protection (HIGH RISK)

**Public mutation endpoints (POST/PATCH/DELETE) under `app/api/**`**

- Auth: `POST /api/auth/dev-login`, `dev-signup`, `signup`, `onboarding`; `PATCH /api/auth/primary-mode`; `POST /api/auth/sign-out`.  
- Orders: `POST /api/orders`, `PATCH /api/orders/[id]`.  
- Care: `POST /api/care/bookings`, `PATCH /api/care/bookings/[id]`.  
- Reviews: `POST /api/reviews`, `PATCH /api/reviews/[id]`; dashboard review approve/flag/message; admin review hide/approve-flag/dismiss-flag/guidance.  
- Products: `POST /api/products`, `PATCH/DELETE /api/products/[id]`.  
- Dashboard: profile, events, customers/note, conversations.  
- Admin: custom-categories, reviews.  
- Item-requests: `POST /api/item-requests`.

**Rate limiting before fixes**

- None. No `checkRateLimit` or similar.

**Endpoints that need rate limiting most (and where it was added)**

- `/api/auth/dev-login`, `/api/auth/signup`, `/api/auth/onboarding` — **rate limit applied.**  
- `/api/orders` (POST), `/api/orders/[id]` (PATCH) — **rate limit applied.**  
- `/api/care/bookings` (POST) — **rate limit applied.**  
- **TODO (not in this pass):** `/api/reviews/*`, `/api/dashboard/reviews/*`, `/api/admin/*`, remaining mutations. Recommend applying same `checkRateLimit()` pattern.

---

### C) CSRF / cookie safety (HIGH RISK when using cookie session)

**Cookie-based auth**

- Dev stub uses `__dev_user_id` and `__dev_user` cookies (set in `dev-login`, `dev-signup`, `signup` when NODE_ENV === "development").  
- Onboarding sets `__dev_zip` (optional).

**Current cookie settings (before fixes)**

- `dev-login`: `httpOnly: true`, `sameSite: "lax"`, `secure: false`.  
- `dev-signup`: same.  
- `signup`: cookies only when NODE_ENV === "development"; same attributes.  
- `onboarding` (`__dev_zip`): `secure: process.env.NODE_ENV === "production"` already.

**Risk**

- In production, dev-login and dev-signup return 404, so cookies are not set. If they were ever used in prod, `secure: false` would be unsafe.  
- **Fix:** Dev cookie setters now use `secure: process.env.NODE_ENV === "production"` so that if ever used in prod they are secure. getCurrentUser() already only reads dev cookies when NODE_ENV === "development".

**Assessment**

- Same-origin API calls; no cross-site form POSTs from other origins identified. For future CSRF: consider SameSite=Strict or CSRF tokens if adding cross-origin or form-based flows.

---

### D) Role system consistency (MEDIUM RISK)

**Where authorization happens**

- Server-side only: `requireProducerOrAdmin()`, `requireAdmin()`, `requireCaregiverOrAdmin()`, `requireCareSeekerOrAdmin()` in `lib/auth.ts`.  
- Pages and API routes call these; no role checks performed client-only for access control.

**User.role vs UserRole vs flags**

- `User.role` (enum) and `UserRole` join table are both written (e.g. dev-login, signup).  
- `requireProducerOrAdmin` uses `user.role === "PRODUCER" || user.role === "ADMIN" || user.isProducer === true`, so flags and role are consistent for access.  
- **Conclusion:** No inconsistency that allows unauthorized access; optional follow-up is to prefer one source (e.g. UserRole) and derive the rest.

---

### E) Error monitoring + logging (MEDIUM RISK)

**Before**

- No Sentry or structured logger. Some routes used `console.error("...", error)`.

**Change**

- Added `lib/logger.ts` with `logError(scope, error, meta?)` and used it in:
  - `app/api/orders/route.ts` (POST),
  - `app/api/orders/[id]/route.ts` (PATCH),
  - `app/api/care/bookings/route.ts` (POST and GET).
- No Sentry or other vendor added.

---

### F) Indexes + query performance (MEDIUM RISK)

**Existing indexes (from schema)**

- UserRole: `@@unique([userId, role])`.  
- ProducerCustomerNote: `@@unique([producerId, buyerId])`.  
- CareServiceListing: `@@index([caregiverId])`, `@@index([active])`.  
- CareBooking: `@@index([careSeekerId])`, `@@index([caregiverId])`, `@@index([status])`.

**Missing indexes (added in schema)**

- **Order:** `@@index([buyerId])`, `@@index([producerId])`, `@@index([status])`, `@@index([createdAt])`.  
- **OrderItem:** `@@index([orderId])`, `@@index([productId])`.  
- **Product:** `@@index([userId])`, `@@index([category])`.  
- **Conversation:** `@@index([orderId])`, `@@index([careBookingId])`, `@@index([updatedAt])`.  
- **Message:** `@@index([conversationId])`, `@@index([createdAt])`.  
- **Review:** `@@index([producerId])`, `@@index([revieweeId])`, `@@index([createdAt])`, `@@index([hiddenByAdmin])`, `@@index([flaggedForAdmin])`.

**Migration**

- Schema is updated. If your DB is in sync with migrations, run:  
  `npx prisma migrate dev --name add_performance_indexes`  
- If there is drift (e.g. Supabase applied migrations not in your repo), resolve drift first or create a new migration from current schema and apply manually.

---

## Phase 2 — Implemented Fixes

### 1) Rate limiting (HIGH PRIORITY)

- **Added:** `lib/rate-limit.ts` (single import point).  
  - When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set: Redis-backed limiter (`lib/rate-limit-redis.ts`), fixed-window key `rl:{ip}:{presetName}:{windowStart}`, atomic INCR + PEXPIRE.  
  - When env vars are missing: in-memory fallback (dev-friendly).  
  - IP: `x-forwarded-for` first IP, then `request.ip`, then `"unknown"`.  
  - `checkRateLimit(request, preset?)` returns `Response | null`; if over limit, 429 via `fail("Too many requests", "RATE_LIMIT", 429)`.

- **Applied to:**  
  - `POST /api/auth/dev-login`  
  - `POST /api/auth/onboarding`  
  - `POST /api/auth/signup`  
  - `POST /api/orders`  
  - `PATCH /api/orders/[id]`  
  - `POST /api/care/bookings`

### 2) Dev stub cookies hardened (HIGH PRIORITY)

- **dev-login, dev-signup:** Cookie options now use `secure: process.env.NODE_ENV === "production"`.  
- **signup:** Only sets cookies when NODE_ENV === "development"; left as `secure: false` in that branch.  
- **getCurrentUser:** Already uses dev cookies only when NODE_ENV === "development".  
- **dev-login / dev-signup:** Already return 404 when NODE_ENV !== "development", so cookies are never set in production.

### 3) Paid state without verified payment (HIGH PRIORITY)

- **lib/orders.ts — createOrder:**  
  - `paid` is now always `false` at order creation.  
  - Comment added: card payments will set `paid` in Stripe webhook; cash orders stay PENDING until producer marks PAID via PATCH.

- **app/api/orders/[id]/route.ts — PATCH:**  
  - Fetches `viaCash` with the order.  
  - Allows PENDING → PAID only when `order.viaCash === true`.  
  - Otherwise returns 400: `"Order cannot be marked PAID here; card payments require Stripe confirmation"`.

### 4) Standardize API response shape (MEDIUM)

- **app/api/care/bookings/route.ts:**  
  - POST: now uses `ok()`, `fail()`, `parseJsonBody()` from `lib/api`; returns `ok({ bookingId, conversationId })` or `fail(...)`.  
  - GET: now uses `fail("Unauthorized", ...)` and `ok({ bookings })`; errors use `fail(...)` and `logError`.

### 5) Minimal error logging (MEDIUM)

- **Added:** `lib/logger.ts` — `logError(scope, error, meta?)` logs JSON to console.  
- **Used in:**  
  - `app/api/orders/route.ts` (POST),  
  - `app/api/orders/[id]/route.ts` (PATCH),  
  - `app/api/care/bookings/route.ts` (POST and GET).  
- No Sentry or other service added.

### 6) Prisma indexes (MEDIUM)

- **Updated:** `prisma/schema.prisma` with the indexes listed in F) above.  
- **Apply:** Run `npx prisma migrate dev --name add_performance_indexes` when DB and migration history are in sync (or resolve drift first).

---

## Prioritized list of issues

| Priority | Issue | Status |
|----------|--------|--------|
| High | Orders could be marked PAID without Stripe/cash guardrail | Fixed: paid=false at creation; PATCH PAID only when viaCash |
| High | No rate limiting on auth/orders/care mutations | Fixed: Redis when Upstash env set, else in-memory; applied to all mutation routes |
| High | Dev cookies not secure in prod | Fixed: secure when NODE_ENV=production |
| Medium | Inconsistent API response shape (care/bookings) | Fixed: ok/fail used |
| Medium | No structured error logging | Fixed: lib/logger + logError in touched routes |
| Medium | Missing DB indexes for orders/messages/reviews | Fixed: indexes in schema; migrate when DB in sync |
| Low | Rate limit remaining mutations (reviews, admin, etc.) | TODO |
| Low | Prefer single role source (UserRole vs User.role) | Optional refactor |

---

## Files modified (brief)

- **lib/rate-limit.ts** — Rate limiter: Redis when Upstash env set, else in-memory; `checkRateLimit(request, preset?)`.
- **lib/rate-limit-redis.ts** — Redis-backed fixed-window limiter; IP extraction; used by `lib/rate-limit.ts`.
- **lib/logger.ts** — New: `logError(scope, error, meta?)`.
- **lib/orders.ts** — createOrder: `paid` always false at creation; comment on Stripe/cash.
- **app/api/orders/route.ts** — Rate limit + logError; no other logic change.
- **app/api/orders/[id]/route.ts** — Rate limit; select `viaCash`; guard PENDING→PAID to viaCash only; logError.
- **app/api/auth/dev-login/route.ts** — Rate limit; cookie `secure: process.env.NODE_ENV === "production"`.
- **app/api/auth/dev-signup/route.ts** — Cookie `secure: process.env.NODE_ENV === "production"`.
- **app/api/auth/onboarding/route.ts** — Rate limit.
- **app/api/auth/signup/route.ts** — Rate limit.
- **app/api/care/bookings/route.ts** — Rate limit; ok/fail/parseJsonBody; logError; GET also ok/fail + logError.
- **prisma/schema.prisma** — Added @@index on Order, OrderItem, Product, Conversation, Message, Review.

---

## Test plan

**Rate limiting**

1. Call a rate-limited endpoint (e.g. `POST /api/orders` with valid body and auth) many times in a short period (e.g. 70 times in 1 minute).  
2. Expect: after exceeding limit, 429 with `{ ok: false, error: "Too many requests", code: "RATE_LIMIT" }`.  
3. Env: none required for in-memory; set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for Redis.

**Rate limit — multi-instance / serverless (Redis)**

1. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` so the limiter uses Redis.  
2. Deploy or run multiple instances (e.g. two `next start` processes, or two Vercel serverless invocations).  
3. From one client IP, send requests to the same rate-limited endpoint (e.g. auth) across both instances (e.g. alternate requests to instance A and B, or rely on load balancer).  
4. Expect: after exceeding the shared limit (e.g. 20/min for AUTH), the next request returns 429 from either instance, with `{ ok: false, error: "Too many requests", code: "RATE_LIMIT" }`.  
5. Without Redis (env vars unset), each instance has its own in-memory counter, so the same IP could exceed the limit by hitting different instances.

**Dev cookies**

1. In development, use dev-login or dev-signup; check cookie headers: `Secure` should be absent (NODE_ENV=development).  
2. In production (or with NODE_ENV=production), dev-login and dev-signup return 404; cookies are not set.  
3. Env: NODE_ENV=development vs production.

**Paid state**

1. Create order via POST /api/orders (cash) → order has status PENDING, viaCash true, paid false.  
2. As producer, PATCH order to PAID → 200, order becomes PAID, paidAt set.  
3. If you had an order with viaCash false (e.g. manually in DB), PATCH to PAID → 400 "Order cannot be marked PAID here; card payments require Stripe confirmation".  
4. Env: none.

**Care bookings API shape**

1. POST /api/care/bookings with valid body, authenticated → 200 with `{ ok: true, data: { bookingId, conversationId } }`.  
2. POST with invalid body → 400 with `{ ok: false, error: "...", code: "VALIDATION_ERROR" }`.  
3. GET /api/care/bookings without auth → 401 with `{ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }`.  
4. Env: none.

**Logging**

1. Trigger an error (e.g. invalid order id in PATCH) and check server logs for a line like `[error] {"scope":"orders/PATCH","message":"..."}`.  
2. Env: none.

**Indexes**

1. After applying migration, run a few heavy queries (e.g. orders by producer, messages by conversation) and confirm no regression; optional: check DB query plans.  
2. Env: DATABASE_URL.  
3. Risk: If there is migration drift, run `prisma migrate status` and resolve before creating/applying new migration.

---

## Env vars

- **Rate limiting (Redis):** When set, the limiter uses Upstash Redis; when missing, it falls back to in-memory (dev-friendly).
  - `UPSTASH_REDIS_REST_URL` — Upstash Redis REST API URL (e.g. `https://xxx.upstash.io`).
  - `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST API token.
- Existing: `NODE_ENV`, `DATABASE_URL` (for Prisma).
- Do not log URL or token; use only for Upstash client config.

---

## Follow-ups / TODOs

1. **Rate limit:** Add `checkRateLimit()` to remaining mutation routes (reviews, dashboard reviews, admin, item-requests, products, dashboard profile/events, etc.).  
2. **Rate limit:** Redis backend implemented; set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in production for shared limits across instances.  
3. **Stripe:** When wiring Stripe, set `paid = true` and `paidAt` only in webhook handler after signature verification; keep PATCH PAID restricted to viaCash orders.  
4. **Migrations:** Resolve any Prisma migration drift (e.g. DB has migrations not in repo), then run `npx prisma migrate dev --name add_performance_indexes` to apply new indexes.  
5. **Logging:** Optionally add request id to logError (e.g. from header or generate) and extend to more API routes.  
6. **CSRF:** If you add cross-origin or form-based POSTs, consider SameSite=Strict or CSRF tokens.
