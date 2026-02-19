# Navigation Architecture: Relationships & Flow

How all nav-related components interact and when each appears. **Strict rule:** Navbar = brand + global actions only; all section links (dashboard, admin) live in sub-navs. Sub-nav content is **config-driven** from `lib/nav-config.ts`.

---

## 1. Rules (single source of truth)

- **Navbar** = brand + global actions only: logo, primary links (Browse, Care, About, Cart) on public routes, **Account** dropdown when logged in. **Switch mode** (Market | Sell | Care) appears **only inside the Account menu** when `isMultiMode` (2+ capabilities beyond Buyer). Account menu: Switch mode (if multi-mode), Profile, Admin (if admin), Sign out.
- **DashboardNav** = all producer/seller dashboard navigation. Two-tier layout (primary tabs + secondary row). Shown only on `/dashboard/*` when `getUserCapabilities(user).canSell`.
- **BuyerDashboardNav** = buyer dashboard navigation. Single “Menu” trigger with mega dropdown. Shown only on `/dashboard/*` when `!canSell`.
- **AdminNav** = all admin navigation. “← Dashboard” + “Sections” dropdown (mega menu). Shown only on `/admin/*`. Admin layout **enforces auth**: non-admins are redirected before the shell renders.
- **App area** = `/dashboard/*` or `/admin/*`. In app area, Navbar shows **minimal**: logo + Account (Switch mode inside when isMultiMode). No market nav (Browse/Care/About/Cart).
- **Chrome hide** = routes in `HIDE_CHROME_ROUTES` (`/auth`, `/invite`, `/reset-password`) get no Navbar and no Footer.
- **Role/capabilities** = `getUserCapabilities(user)` from `lib/authz` everywhere (Navbar, dashboard layout). Returns `{ canSell, canBuy, canAdmin, canOfferHelp, canHireHelp, canCare, isMultiMode }`. Multi-mode = 2+ of (Sell, Offer help, Hire help).

---

## 2. Component hierarchy (who renders whom)

```
app/layout.tsx (root)
├── NavbarWrapper(user)
│   └── Navbar(user)          ← only when !shouldHideChrome(pathname)
├── <div className="flex-1">
│   └── {children}
│       ├── /dashboard/*  →  app/dashboard/layout.tsx:
│       │   ├── getCurrentUser(); redirect /auth/login if !user
│       │   ├── DashboardNav(...)     ← when getUserCapabilities(user).canSell
│       │   OR BuyerDashboardNav()   ← when !canSell
│       │   └── <main>{children}</main>
│       └── /admin/*     →  app/admin/layout.tsx:
│           ├── getCurrentUser(); if !canAdmin show 403 view (middleware returns 403 in dev)
│           ├── AdminNav()
│           └── <main>{children}</main>
└── FooterWrapper()
    └── Footer()             ← only when !shouldHideChrome(pathname)
```

| Component             | Rendered by      | Condition |
|-----------------------|------------------|-----------|
| **NavbarWrapper**     | Root layout      | Always; returns null when `shouldHideChrome(pathname)` |
| **Navbar**            | NavbarWrapper    | When chrome not hidden |
| **FooterWrapper**     | Root layout      | Always; returns null when `shouldHideChrome(pathname)` |
| **Footer**            | FooterWrapper    | When chrome not hidden |
| **DashboardNav**      | Dashboard layout | When `getUserCapabilities(user).canSell` |
| **BuyerDashboardNav** | Dashboard layout | When `!canSell` |
| **AdminNav**          | Admin layout     | On every `/admin/*` (after auth redirect) |

---

## 3. Config-driven sub-nav: lib/nav-config.ts

All dashboard and admin sub-nav **content** is defined in `lib/nav-config.ts`. Components import **NAV** and render from `NAV.dashboard` | `NAV.admin` | `NAV.buyer`. Each entry has a **variant** and **sections**.

### Unified export

```ts
NAV.dashboard  → { variant: "tabs", sections: DASHBOARD_NAV_CONFIG }
NAV.admin      → { variant: "mega", sections: ADMIN_MEGA_NAV }
NAV.buyer      → { variant: "mega", sections: BUYER_MEGA_NAV }
```

- **variant** `"tabs"` = two-tier row layout (primary + secondary).
- **variant** `"mega"` = dropdown with sections (heading, description, icon, links).

### Types and helpers

- **MatchMode** = `"exact" | "prefix"`. Per-link active logic: exact = pathname === href; prefix = pathname === href \|\| pathname.startsWith(href + "/").
- **isActiveHref(pathname, href, match = "prefix")** — single helper for all navs. Links can set `match: "exact"` (e.g. buyer “Dashboard”).
- **NavItem** (producer): href, label, badge?, match?, external?, disabled?, when?(ctx).
- **MegaNavLink**: href, label, match?, external?, disabled?.
- **MegaNavSection**: id (stable key), heading, description, icon, links.
- **getBadgeCount(badge, counts)** for producer badges (orders, messages, reviews).

### Producer (tabs)

- **Primary row:** Revenue, Customers, Sales Analytics, Orders, Messages (badges on Orders, Messages).
- **Secondary row:** Profile, Products, Events, Reviews, Records; Care bookings and Subscriptions when `when(ctx)` is true.

### Admin (mega)

- Sections: **Moderation** (Reviews, Flagged reviews), **Users & Listings** (Users, Listings), **Catalog** (Custom categories). Each section has stable `id`, heading, description, icon.

### Buyer (mega)

- Sections: **Account** (Dashboard with `match: "exact"`, Profile), **Orders** (Order history). Same section shape; “Menu” trigger opens the dropdown. Dropdown is **controlled** (close on route change, click outside, Escape, or link click).

---

## 4. Route-based flow

### HIDE_CHROME_ROUTES (`/auth`, `/invite`, `/reset-password`)

- `shouldHideChrome(pathname)` → true. NavbarWrapper and FooterWrapper return null. Only page content.

### Public routes (`/`, `/market/*`, `/care/*`, `/about`, …)

- Chrome visible. Navbar: logo, mode switcher (if multi-mode), **market nav** (Browse, Care, About, Cart when applicable), account (Sign in/up or Dashboard, Admin?, Sign out). No sub-nav.

### App area: `/dashboard/*`

- `isAppArea(pathname)` → true. Navbar minimal (logo, mode switcher, account).
- Dashboard layout: **DashboardNav** (tabs: primary + secondary rows) or **BuyerDashboardNav** (Menu → mega dropdown), from `NAV.dashboard` / `NAV.buyer`.

**Visual stack:**

```
[ Navbar: logo, mode switcher, Dashboard, Admin?, Sign out ]
[ DashboardNav (tabs) OR BuyerDashboardNav (Menu → mega)   ]
[ Page content                                              ]
[ Footer                                                    ]
```

### App area: `/admin/*`

- Navbar minimal. Admin layout enforces auth (redirect if !user or !canAdmin), then renders **AdminNav** (“← Dashboard” + “Sections” mega dropdown from `NAV.admin`).

**Visual stack:**

```
[ Navbar: logo, mode switcher, Dashboard, Admin, Sign out ]
[ AdminNav (← Dashboard, Sections → mega)                   ]
[ Page content                                               ]
[ Footer                                                     ]
```

---

## 5. What each nav shows (from config)

### Navbar (main header)

- **Always (when visible):** Logo; Account dropdown (when logged in) with Switch mode inside only when isMultiMode.
- **When public:** Browse, Care, About, Cart (when buyer), account (Sign in, Sign up or Account dropdown, Sign out).
- **When app area:** Only logo + Account (Switch mode inside when isMultiMode).

### DashboardNav (producer)

- **Primary row:** Revenue, Customers, Sales Analytics, Orders, Messages (badges).
- **Secondary row:** Profile, Products, Events, Reviews, Records; Care bookings (when user has care capability), Subscriptions. Supports `external` and `disabled` per item.

### BuyerDashboardNav (buyer)

- **Menu** opens mega dropdown: **Account** (Dashboard exact, Profile), **Orders** (Order history). Controlled open state; supports external/disabled links.

### AdminNav (admin)

- **← Dashboard** link + **Sections** dropdown: **Moderation**, **Users & Listings**, **Catalog** with icons and descriptions. Supports external/disabled links.

---

## 6. Centralized logic

### lib/authz.ts — `getUserCapabilities(user)`

- **canSell**, **canAdmin**, **canCare**, **isMultiMode**. Used by Navbar and dashboard layout (which sub-nav to show).

### lib/nav-routes.ts

- **HIDE_CHROME_ROUTES**, **shouldHideChrome(pathname)**, **isAppArea(pathname)**, **getNavContext(pathname, user)**. Used by NavbarWrapper, FooterWrapper, Navbar.

### lib/nav-config.ts

- **NAV** (dashboard / admin / buyer), **isActiveHref**, **getBadgeCount**, types (NavItem, MegaNavLink, MegaNavSection, MatchMode). Single place to add/remove/reorder sub-nav items and sections; variant drives render style.

### Dashboard layout

- `showProducerTabs = getUserCapabilities(user).canSell`; passes badge counts and showCareBookings/showSubscriptions to DashboardNav.

### Admin layout

- Enforces auth: getCurrentUser(), then redirect if !user (→ /auth/login) or !canAdmin (→ /dashboard). AdminNav only renders after that.

---

## 7. Redirects & lastActiveMode

Post-login and post-onboarding redirects use **lastActiveMode** so multi-mode users land where they left off. The value is persisted in the **`__last_active_mode`** cookie:

- **Set on route entry:** Each mode root layout sets the cookie when the user visits that area: `app/market/layout.tsx` → `MARKET`, `app/care/layout.tsx` → `CARE`, `app/dashboard/layout.tsx` → `SELL`.
- **Set on explicit switch:** When the user chooses Account → Switch mode, `PATCH /api/auth/primary-mode` updates the cookie.

Redirect priority (see `lib/redirects.ts`): **next=** (validated safe path) → cart checkout → lastActiveMode → `/market/browse`. **Navbar** “Browse” goes to **`/market`** (hub); **`/market/browse`** is the listings page and a valid post-login default.

**next= open-redirect protection:** All `next=` / `requestedUrl` values are validated via `sanitizeNextPath()` / `isSafeRedirect()`: must be a relative path starting with `/`, not `//`, no protocol (http/https), and **not** under `/auth/*` (avoids redirect loops). Only `/market`, `/dashboard`, `/care`, `/admin` (and their subpaths) are allowed.

**Admin deep link:** Unauthenticated visit to `/admin/*` redirects to `/auth/login?next=/admin`. After login, admins land on `/admin`; non-admins land on `/admin` and see 403 (no next= is stripped for non-admins; they simply see the forbidden view and can use “Back to dashboard”). Onboarding has “Back” and “Save & finish later” (uses `GET /api/auth/post-login-redirect`) so users can bail out without completing.

---

## 8. Mode switcher mapping

- **Market** → `/market/*`
- **Sell** → `/dashboard/*`
- **Care** → `/care/*` (and /dashboard/care-bookings when care role)

Sub-navs hold all section links; Navbar does not.

---

## 9. File reference

| Component / logic     | File                               | Used in                    |
|-----------------------|------------------------------------|----------------------------|
| Navbar                | `components/Navbar.tsx`             | NavbarWrapper              |
| NavbarWrapper         | `components/NavbarWrapper.tsx`     | `app/layout.tsx`           |
| FooterWrapper         | `components/FooterWrapper.tsx`     | `app/layout.tsx`           |
| Footer                | `components/Footer.tsx`             | FooterWrapper              |
| DashboardNav          | `app/dashboard/DashboardNav.tsx`   | `app/dashboard/layout.tsx` |
| BuyerDashboardNav     | `app/dashboard/BuyerDashboardNav.tsx` | `app/dashboard/layout.tsx` |
| AdminNav              | `app/admin/AdminNav.tsx`           | `app/admin/layout.tsx`     |
| **NAV, isActiveHref** | `lib/nav-config.ts`                | DashboardNav, AdminNav, BuyerDashboardNav |
| getUserCapabilities   | `lib/authz.ts`                     | Navbar, dashboard layout, admin layout   |
| shouldHideChrome, isAppArea | `lib/nav-routes.ts`          | NavbarWrapper, FooterWrapper, Navbar      |

Sub-navs do not import each other; they are rendered by their layouts only. They share config and helpers from `lib/nav-config.ts`.
