# The Local Yield

**Multi-platform marketplace connecting local producers with buyers and care providers with families.**  
Web + installable app (PWA). This repo is the **Next.js web app**.

## Branch strategy

- **master** — production-ready code; deploy to production.
- **develop** — integration branch for testing; deploy to a staging URL (e.g. Vercel preview or dedicated staging env) if desired.

Workflow: do feature work in short-lived branches (e.g. `feature/pwa-manifest`, `feature/about-page`), merge into `develop` for testing, then merge `develop` into `master` when validated.

## Launch protection (public site vs dev)

The **home page** (`/`) and **About** (`/about`) do not use auth and are safe to launch as the public website. Dev tools and admin features appear only when:

- `NODE_ENV === "development"` (local), or
- `NEXT_PUBLIC_ENABLE_DEV_TOOLS=true` (e.g. on a staging deployment).

**NEXT_PUBLIC_ENABLE_DEV_TOOLS must never be set on production.** In Vercel, set env vars per environment (Production vs Preview) so production does not inherit staging variables. Only add `NEXT_PUBLIC_ENABLE_DEV_TOOLS=true` to Preview/Staging; leave it unset for Production.

## Tech stack

- **Frontend:** Next.js 16 (App Router) + Tailwind CSS + TypeScript
- **Backend / DB:** Node.js + PostgreSQL + Prisma ORM
- **Auth:** Custom auth system with session management, role-based access, and primary mode switching
- **Payments:** Stripe Checkout (local pickup option)
- **File uploads:** Cloudinary (to be wired)
- **Location:** ZIP code radius-based matching
- **State Management:** React hooks + server actions

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

5. **Local testing & auth**  
   Seed test users for development:
   ```bash
   npx prisma db seed
   ```
   This creates test users: `buyer@test.localyield.example`, `producer@test.localyield.example`, `admin@test.localyield.example`.
   
   **Dev login (development only):**
   - Visit `/api/auth/dev-login` to sign in as any seeded user
   - Visit `/api/auth/dev-signup` to create a new test user with role selection
   
   **Production auth flow:**
   - Users sign up at `/sign-up` with role selection (buyer/producer/caregiver)
   - Complete onboarding at `/auth/onboarding` with role-specific setup
   - Users with multiple roles can switch their primary mode in the navbar

## Mobile app and web parity

- **Web API for mobile:** Mobile uses the same domain (e.g. `https://thelocalyield.com`). Main API: `GET /api/listings?zip=...` for Market browse; future: `/api/orders`, `/api/messages`, `/api/products`, `/api/events`.
- **Shared types:** `types/index.ts`, `types/listings.ts`, `types/care.ts`. Later move to `packages/shared/src/types/*` so web + mobile import the same types.
- **Deep link parity:** Mobile tabs map to web routes (Market → `/market`, `/market/shop/[id]`; Orders → `/dashboard/orders`; Messages → `/messages`; Profile → `/dashboard` or `/profile`; Care → `/care/*` when feature-flagged). URL is the source of truth.
- **Expo API pattern:** In Expo, `apps/mobile/src/lib/api.ts` with base URL `https://thelocalyield.com`; every request is e.g. `GET https://thelocalyield.com/api/listings?zip=...`. No separate server.

Full details: [docs/mobile-web-mapping.md](docs/mobile-web-mapping.md).

## Database schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: Users with roles, authentication, and profile data
- **UserRole**: Multi-role support (BUYER, PRODUCER, CAREGIVER, ADMIN)
- **CareProfile**: Caregiver qualifications and availability
- **ProducerProfile**: Business information and settings
- **Product**: Marketplace items with categories and inventory
- **Order**: Order management with status tracking
- **OrderItem**: Line items for orders
- **Event**: Producer events with pickup details
- **Review**: Order-based reviews with flagging and moderation
- **AdminActionLog**: Audit trail for admin actions
- **CustomCategory**: Producer-specific product categories

**Migrations**: 7 recent migrations added support for:
- Custom categories and catalog management
- Review moderation with admin guidance
- Producer business pages and event hours
- Primary mode and multi-role user support
- User identity and platform usage tracking

## Project structure (web)

```
/app
  layout.tsx, page.tsx (landing)
  /market
    /browse           — Browse marketplace
    /checkout         — Checkout flow
    /shop/[id]        — Shop details
  /care
    /browse           — Browse caregivers
    /caregiver/[id]   — Caregiver profile
  /auth
    /login            — Login page
    /onboarding       — Role-specific onboarding
  /dashboard
    layout.tsx        — Dashboard layout with navigation
    page.tsx          — Dashboard home with analytics
    /analytics        — Analytics dashboard
    /events           — Events management
    /messages         — Messaging system
    /orders           — Order management (buyer & producer views)
    /profile          — User profile management
    /reviews          — Review management
  /admin
    /reviews          — Review moderation
    /flagged-reviews  — Flagged reviews queue
    /custom-categories — Custom category management
  /api
    /auth             — Auth endpoints (login, signup, onboarding, sign-out, primary-mode)
    /admin            — Admin APIs (reviews, custom categories)
    /catalog          — Catalog & category APIs
    /dashboard        — Dashboard APIs (events, reviews, summary, conversations)
    /orders           — Order APIs with review endpoints
    /reviews          — Public review APIs
/components
  AddToCartButton.tsx
  AuthForm.tsx
  Navbar.tsx            — Main navigation with role-based UI
  ProducerHeader.tsx    — Producer profile header
  ProducerProfileForm.tsx — Producer setup form
  ProductCatalogForm.tsx — Product catalog editor
  RoleSelection.tsx     — Role selection component
  SignupForm.tsx        — Signup form with roles
  DashboardNav.tsx      — Dashboard navigation
/lib
  api.ts              — API client wrapper
  auth.ts             — Authentication utilities
  authz.ts            — Authorization checks
  catalog-categories.ts — Category management
  dashboard-alerts.ts — Dashboard alerts
  orders.ts           — Order utilities
  redirects.ts        — Redirect helpers
  reviews.ts          — Review utilities
  validators.ts       — Input validation
/docs
  auth-flows.md       — Authentication flow documentation
  code-audit.md       — Code audit reports
  dashboard-ux-improvements.md
  high-level-audit.md
  prisma-auth-navbar-fixes.md
/prisma
  schema.prisma       — Database schema
  /migrations         — Database migrations
  seed.ts             — Seed data for development
```

## Core features

### Marketplace
- Browse goods by location (ZIP + radius)
- Producer shops with custom catalogs and categories
- Delivery/pickup per listing; weekly veggie box subscriptions
- Shopping cart and checkout flow
- Events/preorders with pickup locations and RSVP

### Care Platform
- Browse caregivers by location
- Care provider profiles with qualifications
- Caregiver booking and scheduling

### Authentication & Roles
- Signup with role selection (buyer, producer, caregiver)
- Role-specific onboarding flows
- Primary mode switching for users with multiple roles
- Session-based authentication with secure sign-out

### Dashboard
- **Analytics**: Sales, revenue, and order metrics
- **Orders**: Buyer order history and producer order management
- **Events**: Create and manage events with pickup details
- **Messages**: Internal messaging system for orders
- **Reviews**: Review management and response system
- **Profile**: User profile and producer business page setup

### Admin Moderation
- Review flagging system with admin guidance
- Flagged review queue with approve/dismiss actions
- Custom category management for producer catalogs
- Admin action logging for transparency
- Review status tracking (pending, approved, rejected, flagged)

### Reviews & Trust
- Order-based review system
- Producer response to reviews
- Review flagging for moderation
- Complaint-resolve workflow

## Recent updates

- ✅ Custom auth system with signup, login, and onboarding
- ✅ Role-based access control (buyer, producer, caregiver, admin)
- ✅ Primary mode switching for multi-role users
- ✅ Admin moderation system for reviews and content
- ✅ Enhanced dashboard with analytics and messaging
- ✅ Review system with flagging and moderation
- ✅ Custom category management
- ✅ Care platform with provider profiles
- ✅ Order management and tracking
- ✅ Event management system

## Next steps

- [ ] Stripe integration (one-time + subscriptions)
- [ ] Location radius filter refinement (ZIP-based search)
- [ ] Cloudinary image upload integration
- [ ] Real-time messaging with WebSockets
- [ ] Weekly box subscription automation (recurring orders)
- [ ] Mobile app development (Expo/React Native)
- [ ] Email notifications for orders and messages
- [ ] SMS notifications for pickups
- [ ] Advanced analytics and reporting

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npx prisma generate` — generate Prisma client
- `npx prisma migrate dev` — create/apply migrations
- `npx prisma db seed` — seed development data

## Documentation

Detailed documentation is available in the `/docs` folder:

- **[auth-flows.md](docs/auth-flows.md)** — Authentication and authorization flows
- **[code-audit.md](docs/code-audit.md)** — Code quality audit and recommendations
- **[dashboard-ux-improvements.md](docs/dashboard-ux-improvements.md)** — Dashboard UX enhancements
- **[high-level-audit.md](docs/high-level-audit.md)** — High-level architecture review
- **[prisma-auth-navbar-fixes.md](docs/prisma-auth-navbar-fixes.md)** — Database and auth implementation notes
- **[mobile-web-mapping.md](docs/mobile-web-mapping.md)** — Mobile-web integration guide

## Development notes

- **Dev environment only**: Use `/api/auth/dev-login` and `/api/auth/dev-signup` for quick testing
- **Session management**: Sessions are stored in the database with secure HTTP-only cookies
- **Role switching**: Users with multiple roles can switch their primary mode in the navbar
- **Admin access**: Admin features require the ADMIN role in the database
- **Feature flags**: Care platform and other features can be toggled via environment variables
