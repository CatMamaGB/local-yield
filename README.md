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

### Staging gate (Basic Auth)

For **staging**, you can gate the app with HTTP Basic Auth. When `APP_GATE_ENABLED=true`, the proxy (see `proxy.ts`) prompts for Basic Auth using `APP_GATE_USER` and `APP_GATE_PASS`. Use only on Preview/Staging. **Never enable `APP_GATE_ENABLED` on production** unless you intend a staging-only gate.

## Tech stack

- **Frontend:** Next.js 16 (App Router) + Tailwind CSS + TypeScript
- **Backend / DB:** Node.js + PostgreSQL + Prisma ORM
- **Auth:** Clerk in production (when configured); dev role-picker with cookie-based session when not. Deterministic UI: never both at once. See [docs/auth-flows.md](docs/auth-flows.md).
- **Payments:** Stripe Checkout (local pickup option)
- **File uploads:** Cloudinary (to be wired)
- **Location:** ZIP code radius-based matching
- **State Management:** React hooks + server actions
- **Rate Limiting:** Upstash Redis for API rate limiting
- **Logging:** Request ID tracking and structured logging utilities

**Security:** Dependency advisories are tracked and documented. Production deps are kept free of high/critical issues; dev-only moderate findings are accepted with a documented decision. See **[docs/security-audit.md](docs/security-audit.md)**. Run `npm run audit:ci` in CI to fail only on high/critical.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` to your PostgreSQL connection string
   - Optionally add Stripe keys when you integrate payments
   - For rate limiting: Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (optional, falls back to in-memory rate limiting)
   - For staging: See “Staging gate (Basic Auth)” above. Set `APP_GATE_ENABLED=true`, `APP_GATE_USER`, and `APP_GATE_PASS` if needed.

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
   
   **Auth UI (deterministic):** If Clerk env vars are set (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`), login/signup show Clerk. Otherwise they show the **dev role-picker**. Never both. Optional: in dev only, use `?auth=dev` (e.g. `/auth/login?auth=dev`) to force the dev UI when Clerk is configured.
   
   **Dev login (development only):** Visit `/auth/login` → choose role (BUYER/PRODUCER/ADMIN) → Sign in. The form POSTs to `/api/auth/dev-login`, which upserts by stub email (works with seed users), sets `__dev_user_id` and `__dev_user` cookies, and redirects to onboarding or a safe `?next=` path. Signup: `/auth/signup` → full form → POST `/api/auth/signup` or dev-signup depending on config.
   
   **Production (Clerk):** Users sign in at `/auth/login` and sign up at `/auth/signup`; after auth, complete onboarding at `/auth/onboarding`. Safe `?next=` is honored. Users with multiple roles can switch primary mode in the navbar.
   
   **Manual test checklist:** See [docs/auth-flows.md §9](docs/auth-flows.md) for the full checklist (dev login, session persistence, error UX, debug route).

## Mobile app and web parity

- **Web API for mobile:** Mobile uses the same domain (e.g. `https://thelocalyield.com`). Main API: `GET /api/listings?zip=...` for Market browse; future: `/api/orders`, `/api/messages`, `/api/products`, `/api/events`.
- **Shared types:** `types/index.ts`, `types/listings.ts`, `types/care.ts`. Later move to `packages/shared/src/types/*` so web + mobile import the same types.
- **Deep link parity:** Mobile tabs map to web routes (Market → `/market`, `/market/shop/[id]`; Orders → `/dashboard/orders`; Messages → `/messages`; Profile → `/dashboard` or `/profile`; Care → `/care/*`). Care is always available alongside Market. URL is the source of truth.
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

## Codebase quality

The repo is structured for production: App Router by feature, domain-oriented `lib/` modules, shared `types/`, and consistent API/client patterns. For a **structure and cleanliness audit** (what’s in good shape, dead code removed, and optional improvements), see **[docs/project-structure-audit.md](docs/project-structure-audit.md)**.

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
    /caregiver/[id]   — Caregiver profile with booking form
    /post-job         — Post help-exchange job
  /care-safety        — Care safety information
  /community-guidelines — Community guidelines
  /seller-guidelines  — Seller guidelines
  /privacy            — Privacy policy
  /terms              — Terms of service
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
    /orders/[id]      — Order detail and conversation
    /profile          — User profile management
    /reviews          — Review management
    /products         — Product catalog management
    /customers        — Customer management with notes
    /care-bookings    — Care booking management
    /care-bookings/[id] — Care booking detail and messages
    /revenue          — Revenue tracking and metrics
    /notifications    — User notifications
    /job-postings     — Help exchange job postings (caregiver)
    /my-bids          — My bids (help exchange)
    /cases            — Resolution center / cases
  /admin
    layout.tsx        — Admin layout with navigation
    page.tsx          — Admin dashboard
    /analytics        — Admin analytics
    /bookings         — Care bookings oversight
    /forbidden        — 403 for non-admins
    /help-exchange    — Help exchange postings
    /reports          — Reports management
    /reviews          — Review moderation
    /flagged-reviews  — Flagged reviews queue
    /custom-categories — Custom category management
    /users            — User management
    /listings         — Listing management
  /api
    /auth             — Auth endpoints (login, signup, onboarding, sign-out, primary-mode, dev-login, dev-signup)
    /admin            — Admin APIs (reviews, custom categories, users, listings, action logs)
    /account          — Account management APIs
    /care             — Care APIs (caregivers, bookings, conversations)
    /catalog          — Catalog & category APIs
    /dashboard        — Dashboard APIs (events, reviews, summary, conversations, customers, profile)
    /orders           — Order APIs with review endpoints
    /products         — Product management APIs
    /reviews          — Public review APIs
    /shop             — Shop/delivery APIs
    /item-requests    — Item request APIs
    /listings         — Listing APIs
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
  AccountForm.tsx       — Account management form
  FAQAccordion.tsx      — FAQ accordion component
  Footer.tsx            — Site footer
  HomeFAQ.tsx           — Homepage FAQ section
  LocationInput.tsx     — Location/ZIP input component
  RequestItemForm.tsx   — Item request form
  /dashboard            — Dashboard-specific components (MetricCard, GrowthSignalCard, etc.)
  /ui                   — Reusable UI components (Button, Badge, FormField, LoadingSkeleton, etc.)
/lib
  api.ts              — API client wrapper
  auth.ts             — Authentication utilities
  authz.ts            — Authorization checks
  care.ts             — Care platform utilities
  catalog-categories.ts — Category management
  dashboard-alerts.ts — Dashboard alerts
  logger.ts           — Structured logging with request IDs
  nav-config.ts       — Navigation configuration
  nav-routes.ts       — Route definitions and helpers
  orders.ts           — Order utilities
  producer-metrics.ts — Producer analytics and metrics
  rate-limit.ts       — Rate limiting utilities
  rate-limit-redis.ts — Redis-based rate limiting
  redirects.ts        — Redirect helpers
  request-id.ts       — Request ID generation
  reviews.ts          — Review utilities
  validators.ts       — Input validation
  /client              — Client-side API utilities
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
- Browse caregivers by location and availability
- Care provider profiles with qualifications and experience
- Caregiver booking system with request/accept workflow
- Booking management dashboard for caregivers
- Automatic conversation threads for bookings
- Care safety guidelines and community standards

### Authentication & Roles
- Signup with role selection (buyer, producer, caregiver)
- Role-specific onboarding flows
- Primary mode switching for users with multiple roles
- Session-based authentication with secure sign-out

### Dashboard
- **Analytics**: Sales, revenue, and order metrics with growth signals
- **Orders**: Buyer order history and producer order management
- **Events**: Create and manage events with pickup details
- **Messages**: Internal messaging system for orders and bookings
- **Reviews**: Review management and response system
- **Profile**: User profile and producer business page setup
- **Products**: Product catalog management with custom categories
- **Customers**: Customer management with notes and history
- **Care Bookings**: Care booking management for caregivers
- **Revenue**: Revenue tracking and financial metrics

### Admin Moderation
- Comprehensive admin dashboard with navigation
- Review flagging system with admin guidance
- Flagged review queue with approve/dismiss actions
- Custom category management for producer catalogs
- User management and listing oversight
- Admin action logging for transparency and audit trails
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
- ✅ Comprehensive admin UI: users, listings, reviews, flagged-reviews, custom-categories, bookings, help-exchange, reports, analytics
- ✅ Admin moderation system for reviews and content
- ✅ Enhanced dashboard: analytics, messaging, revenue, orders (with detail/conversation), care-bookings (with detail), notifications, job-postings, my-bids, cases
- ✅ Review system with flagging and moderation
- ✅ Custom category management for producer catalogs
- ✅ Care platform with provider profiles and booking system
- ✅ Care booking workflow with conversation threads
- ✅ Help exchange: post jobs, browse, bids; admin oversight
- ✅ Order management, order detail pages, and order conversations
- ✅ Event management system
- ✅ Rate limiting with Redis support
- ✅ Structured logging with request ID tracking
- ✅ Reusable UI component library
- ✅ Navigation configuration system
- ✅ Producer metrics and analytics
- ✅ Customer management with notes
- ✅ Legal pages (terms, privacy, community guidelines)

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
- `npm run test:caregivers` — test care caregivers API
- `npm run test:help-exchange` — test help-exchange API
- `npm run test:booking-idempotency` — test booking idempotency
- `npm run audit:api-contracts` — audit API contracts
- `npm run audit:ci` — fail only on high/critical advisories (use in CI)
- `npx prisma generate` — generate Prisma client
- `npx prisma migrate dev` — create/apply migrations
- `npx prisma db seed` — seed development data

## Documentation

Detailed documentation is available in the `/docs` folder:

- **[PROJECT-SUMMARY.md](docs/PROJECT-SUMMARY.md)** — Full project summary: routes, APIs, file structure, health
- **[project-structure-audit.md](docs/project-structure-audit.md)** — Codebase cleanliness and organization (what’s in good shape, dead code, optional improvements)
- **[product-vision.md](docs/product-vision.md)** — Product vision and core principles
- **[auth-flows.md](docs/auth-flows.md)** — Authentication and authorization flows
- **[nav-architecture.md](docs/nav-architecture.md)** — Navigation architecture and routing
- **[routes.md](docs/routes.md)** — Route definitions and API endpoints
- **[high-level-audit.md](docs/high-level-audit.md)** — High-level architecture review
- **[admin-ui-review.md](docs/admin-ui-review.md)** — Admin UI implementation review
- **[frontend-api-ux-upgrade-summary.md](docs/frontend-api-ux-upgrade-summary.md)** — Frontend/API UX improvements
- **[prisma-drift-resolution.md](docs/prisma-drift-resolution.md)** — Database schema alignment notes
- **[production-hardening-audit.md](docs/production-hardening-audit.md)** — Production readiness audit
- **[ui-understanding.md](docs/ui-understanding.md)** — UI component system documentation
- **[warm-farmhouse-ui-audit.md](docs/warm-farmhouse-ui-audit.md)** — UI design system audit
- **[api-contract-mismatches.md](docs/api-contract-mismatches.md)** — API contract documentation
- **[verification-pass-report.md](docs/verification-pass-report.md)** — Verification and testing report
- **[qa-checklist-10min.md](docs/qa-checklist-10min.md)** — Quick QA checklist
- **[feature-checklist-gap-analysis.md](docs/feature-checklist-gap-analysis.md)** — Feature gap analysis
- **[mobile-web-mapping.md](docs/mobile-web-mapping.md)** — Mobile-web integration guide

## Development notes

- **Dev auth**: Use `/auth/login` (or `/auth/login?auth=dev` when Clerk is set) for the dev role-picker; form POSTs to `/api/auth/dev-login`. Signup at `/auth/signup`. All auth errors show InlineAlert with message and request ID (see `lib/client/error-format.ts`).
- **Debug route**: `GET /api/auth/debug` returns current user and dev cookies only when `NODE_ENV !== "production"` and `DEV_DEBUG=true`; otherwise 404.
- **Session management**: Sessions are stored in the database with secure HTTP-only cookies
- **Role switching**: Users with multiple roles can switch their primary mode in the navbar
- **Admin access**: Admin features require the ADMIN role in the database
- **Rate limiting**: API endpoints use rate limiting (Redis-backed when configured, in-memory fallback)
- **Logging**: Request IDs are automatically generated and logged for tracing
- **Navigation**: Navigation structure is configured in `lib/nav-config.ts` and `lib/nav-routes.ts`
- **UI Components**: Reusable UI components are in `components/ui/` following a consistent design system
