# The Local Yield

**Phase 1: Marketplace for local goods (no shipping).**  
Web + installable app (PWA). This repo is the **Next.js web app**.

## Branch strategy

- **master** — production-ready code; deploy to production.
- **develop** — integration branch for testing; deploy to a staging URL (e.g. Vercel preview or dedicated staging env) if desired.

Workflow: do feature work in short-lived branches (e.g. `feature/pwa-manifest`, `feature/about-page`), merge into `develop` for testing, then merge `develop` into `master` when validated.

## Launch protection (public site vs dev)

The **home page** (`/`) and **About** (`/about`) do not use auth and are safe to launch as the public website. The dev role switcher (Buyer/Producer/Admin) appears only when:

- `NODE_ENV === "development"` (local), or
- `NEXT_PUBLIC_ENABLE_DEV_TOOLS=true` (e.g. on a staging deployment).

**NEXT_PUBLIC_ENABLE_DEV_TOOLS must never be set on production.** In Vercel, set env vars per environment (Production vs Preview) so production does not inherit staging variables. Only add `NEXT_PUBLIC_ENABLE_DEV_TOOLS=true` to Preview/Staging; leave it unset for Production.

**Future (optional):** To make `/` and `/about` maximally static/fast, consider a "public layout" pattern: route group `(public)/layout.tsx` without user fetching for those pages, and `(app)/layout.tsx` with user fetching for dashboard/browse/etc. Not required now; root layout + getCurrentUser() is fine as long as getCurrentUser() returns null for logged-out users and never throws.

## Tech stack

- **Frontend:** Next.js (App Router) + Tailwind CSS
- **Backend / DB:** Node.js + PostgreSQL + Prisma ORM
- **Auth:** Clerk or Supabase Auth (to be wired)
- **Payments:** Stripe Checkout (local pickup option)
- **File uploads:** Cloudinary (to be wired)
- **Location:** ZIP code radius-based matching

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` to your PostgreSQL connection string
   - Optionally add Stripe and auth keys when you integrate them

3. **Database (Prisma 7)**
   - Prisma config lives in `prisma.config.ts`; the schema is in `prisma/schema.prisma`
   - Generate the client: `npx prisma generate`
   - Create the DB and run migrations: `npx prisma migrate dev`

4. **Run the app**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

5. **Local testing (optional)**  
   To seed test users for when real auth is wired, run:
   ```bash
   npx prisma db seed
   ```
   This creates/updates: `buyer@test.localyield.example`, `producer@test.localyield.example`, `admin@test.localyield.example`. Use only in development/staging.  
   Until auth is integrated, use the dev-only role switcher in the navbar (development mode) to test as Buyer, Producer, or Admin.

## Mobile app and web parity

- **Web API for mobile:** Mobile uses the same domain (e.g. `https://thelocalyield.com`). Main API: `GET /api/listings?zip=...` for Market browse; future: `/api/orders`, `/api/messages`, `/api/products`, `/api/events`.
- **Shared types:** `types/index.ts`, `types/listings.ts`, `types/care.ts`. Later move to `packages/shared/src/types/*` so web + mobile import the same types.
- **Deep link parity:** Mobile tabs map to web routes (Market → `/market`, `/market/shop/[id]`; Orders → `/dashboard/orders`; Messages → `/messages`; Profile → `/dashboard` or `/profile`; Care → `/care/*` when feature-flagged). URL is the source of truth.
- **Expo API pattern:** In Expo, `apps/mobile/src/lib/api.ts` with base URL `https://thelocalyield.com`; every request is e.g. `GET https://thelocalyield.com/api/listings?zip=...`. No separate server.

Full details: [docs/mobile-web-mapping.md](docs/mobile-web-mapping.md).

## Project structure (web)

```
/app
  layout.tsx, page.tsx (landing)
  /market, /market/browse, /market/shop/[id] — Market
  /care, /care/browse, /care/caregiver/[id]  — Care (feature-flagged)
  /auth/login, signup
  /dashboard      — producer: products, orders, subscriptions, events
  /admin/users, /admin/listings
  /api/listings   — used by mobile for Market browse
/components       — Navbar, ProductCard, WeeklyBox, DeliveryBadge, EventCard,
                   MessageThread, CatalogSelector, LocationInput
/lib              — prisma, auth, stripe, utils, reviews
/types            — User, Product, Order, Event, Review, listings, care
prisma/schema.prisma — Prisma models
```

## Core features (Phase 1)

- Browse goods by location (ZIP + radius)
- Producer vs buyer roles; producer shops and catalog
- Delivery/pickup per listing; weekly veggie box subscriptions
- Events/preorders with pickup locations and RSVP
- Internal review and complaint–resolve flow
- Order tracking and messaging; cash and Stripe

## Next steps (from your spec)

- [ ] Auth flow (Clerk or Supabase)
- [ ] Location radius filter (ZIP-based)
- [ ] Stock image + uploader fallback (Cloudinary)
- [ ] Weekly box subscription model (recurring orders)
- [ ] Stripe integration (one-time + subscriptions)
- [ ] Admin dashboard: user/shop moderation

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npx prisma generate` — generate Prisma client
- `npx prisma migrate dev` — create/apply migrations
