# The Local Yield

**Phase 1: Marketplace for local goods (no shipping).**  
Web + Mobile (React Native via Expo). This repo is the **Next.js web app**.

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

## Project structure (web)

```
/app
  layout.tsx, page.tsx (landing)
  /browse          — location-filtered shopping
  /shop/[producerId] — public shop page
  /auth/login, signup
  /dashboard      — producer: products, orders, subscriptions, events
  /admin/users, /admin/listings
/components       — Navbar, ProductCard, WeeklyBox, DeliveryBadge, EventCard,
                   MessageThread, CatalogSelector, LocationInput
/lib              — prisma, auth, stripe, utils, reviews
/types            — User, Product, Order, Event, Review, etc.
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
