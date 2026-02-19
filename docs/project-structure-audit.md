# Project Structure & Cleanliness Audit

**Last updated:** 2026-02-18  
**Goal:** Keep the codebase clean, consistent, and “high level” (production-grade structure and conventions).

---

## 1. What’s Already in Good Shape

### Top-level layout
- **Clear separation:** `app/` (routes + API), `components/`, `lib/`, `types/`, `contexts/`, `prisma/`, `docs/`, `scripts/` — no random folders at root.
- **Config at root:** `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `prisma.config.ts`, `proxy.ts` — all expected and purposeful.
- **Docs:** `README.md` and `docs/` (PROJECT-SUMMARY, routes, auth-flows, etc.) give a single source of truth.

### App Router
- **Route structure** follows Next.js App Router: `app/market/`, `app/care/`, `app/dashboard/`, `app/admin/`, `app/auth/` with consistent nesting.
- **API routes** under `app/api/` mirror domains (auth, account, care, dashboard, admin, orders, reviews, etc.).
- **Layouts** used where needed (`auth`, `dashboard`, `admin`, `market`, `care`).

### Lib
- **Domain subdirs:** `lib/auth/`, `lib/authz/`, `lib/client/`, `lib/geo/`, `lib/care/`, `lib/market/`, `lib/orders/`, `lib/reviews/`, `lib/messaging/`, `lib/search/`, `lib/telemetry/`, `lib/notify/` — good separation by concern.
- **Thin re-exports:** `lib/auth.ts` → `lib/auth/server.ts` keeps a single entry point for server-only auth.
- **Shared helpers:** `lib/api.ts` (ok/fail/parseJsonBody/withRequestId), `lib/validators.ts`, `lib/prisma.ts` — used consistently.

### Components
- **`components/ui/`** — reusable primitives (Button, Badge, FormField, EmptyState, InlineAlert, LoadingSkeleton, etc.).
- **`components/dashboard/`** — dashboard-specific (MetricCard, GrowthSignalCard).
- **`components/market/`** — Market hub, browse, cart, checkout, shop (BrowseClient, ListingRow, MarketHomeSearchCard, AddToCartButton, CartLink, CartItemRow, FulfillmentSelector, ProducerHeader, ProducerProductGrid, RequestItemForm, DemandNearYou, DeliveryBadge).
- **Client components** colocated with pages where it makes sense (e.g. `*Client.tsx` next to `page.tsx`).

### Types
- **`types/`** — `index.ts`, `listings.ts`, `care.ts`; shared types in one place.
- **Prisma** as source of truth for DB shapes; `types/` for API and UI contracts.

### Tooling & hygiene
- **.gitattributes** — LF normalization; no CRLF/LF noise.
- **.gitignore** — `nul`, env files, node_modules, .next, etc.
- **Scripts** — `test:caregivers`, `test:help-exchange`, `test:booking-idempotency`, `audit:api-contracts`.

---

## 2. Issues and Recommendations

### 2.1 Removed (2026-02-18)

- **RolePicker.tsx**, **WeeklyBox.tsx**, **ProductCard.tsx**, **EventCard.tsx**, **CatalogSelector.tsx** — unused; removed.

**Optional:** `lib/client/market.ts` — `searchListings()` is unused (BrowseClient uses `apiGet` directly). Either delete the file or have BrowseClient use `searchListings()` for a single client API surface.

### 2.2 Root-level clutter

| Item | Status / action |
|------|-----------------|
| `nul` (file at repo root) | **Already in .gitignore.** Safe to delete from disk: `del nul` (Windows) or `rm -f nul` so it doesn’t show in editors. |

### 2.3 Lib: dual entry points (acceptable but document)

- **`lib/care.ts`** — main care logic (list caregivers, bookings, etc.); used by API routes and server code.
- **`lib/care/`** — types, labels, search params, categories, telemetry.

Both are used; no duplication of logic. Optional: add a short comment at the top of `lib/care.ts` that it’s the main server module and that `lib/care/*` holds shared types and helpers.

### 2.4 Components: flat vs grouped

- **Current:** Many shared components live flat in `components/` (40+ files); only `ui/` and `dashboard/` are grouped.
- **Suggestion (optional):** For a “high level” feel, consider grouping by domain without overdoing it, e.g.:
  - `components/auth/` — AuthForm, SignupForm, RoleSelection, AuthPageHeader (if you want a single auth surface).
  - `components/market/` — BrowseClient, ListingRow, MarketHomeSearchCard, AddToCartButton, CartLink, CartItemRow, FulfillmentSelector, etc.
  - `components/care/` — CareSearchCard, and any care-only UI.

Only do this if you’re refactoring anyway; the current flat structure is still manageable and consistent.

### 2.5 Naming and patterns

- **Consistent:** `*Client.tsx` for client components next to server pages; API routes use `route.ts`; lib modules use clear names.
- **Optional:** Standardize on one pattern for “page + client” (e.g. always `PageClient.tsx` or always `FeatureClient.tsx`) and document it in README or docs.

### 2.6 Documentation

- **README** — Setup, scripts, project structure, docs list are clear.
- **docs/PROJECT-SUMMARY.md** — Routes, APIs, file structure, “not used” list; keep it updated when you remove dead code or add features.
- Keep PROJECT-SUMMARY “Files / Modules Not Used” in sync with this audit (removed list vs optional items).

---

## 3. Quick wins

- [x] `.gitattributes` for LF.
- [x] `core.autocrlf=false` (or follow .gitattributes) to avoid CRLF warnings.
- [x] `nul` in `.gitignore`.
- [x] Removed unused components: RolePicker, WeeklyBox, ProductCard, EventCard, CatalogSelector (see 2.1).
- [ ] (Optional) Remove or use `searchListings()` in `lib/client/market.ts`.

---

## 4. Verdict

- **Overall:** The repo is in good shape: clear app/api structure, domain-oriented lib, shared types, and docs. It’s at a “high level” for structure and conventions.
- **Done:** Unused components removed (2.1). Optional next: standardize on `lib/client/*` for client API calls (market.ts), group Market components into `components/market/`, and keep PROJECT-SUMMARY and this audit in sync.
