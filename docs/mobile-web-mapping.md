# File → file mapping (web → mobile)

Web API the mobile app calls. URL is the source of truth; deep links match these paths.

---

## Web API the mobile app will call

| Web route | Purpose |
|-----------|--------|
| `app/api/listings/route.ts` | **Market browse.** Mobile uses this for browse results. `GET /api/listings?zip=...&radius=...&q=...` |

**Future (you’ll likely add soon):**

| Web route | Purpose |
|-----------|--------|
| `app/api/orders/*` | Orders (list, create, status) |
| `app/api/messages/*` | Messages / threads |
| `app/api/products/*` | Products (producer catalog, CRUD) |
| `app/api/events/*` | Events / preorders |

No separate server for mobile: all requests go to the live domain (see Expo API pattern below).

---

## Shared types (mobile should reuse)

**Right now (web):**

- `types/index.ts` — User, Product, Order, Event, Review, Subscription, ItemRequest, LocationFilter, Role
- `types/listings.ts` — BrowseListing, ListingLabel, ListingsResponse
- `types/care.ts` — Care-specific types

**Later:** Move or copy into a shared package so both web and mobile import the same types:

```
packages/shared/src/types/
  index.ts
  listings.ts
  care.ts
```

Then:

- Web: `import { BrowseListing } from '@local-yield/shared/types'` (or similar)
- Mobile: same import from the shared package

No need to overthink paths; the win is one source of truth for types.

---

## Mobile screens ↔ web routes (deep link parity)

Mobile tabs and the web paths they map to:

| Mobile tab | Web path | Notes |
|------------|----------|--------|
| **Market** | `/market` or `/market/browse` | Prefer `/market` long-term; keep `/market/browse` for browse list. |
| | `/market/shop/[id]` | Producer storefront. |
| **Orders** | `/dashboard/orders` | |
| **Messages** | `/messages` | Add later. |
| **Profile** | `/dashboard` or `/profile` | Dashboard for producers; profile for buyers/settings. |
| **Care** (feature-flagged) | `/care/*` | `/care`, `/care/browse`, `/care/caregiver/[id]` when `NEXT_PUBLIC_ENABLE_CARE=true`. |

Important: don’t overthink the paths. The URL is the source of truth; mobile and web share the same routes for deep links.

See also: [docs/routes.md](routes.md) for the full route list.

---

## How Expo calls your APIs (concrete pattern)

In Expo, create:

**`apps/mobile/src/lib/api.ts`**

- Base URL points at your **live domain**: `https://thelocalyield.com`
- Every request is a normal HTTP call to that domain.

Example:

```ts
const API_BASE = "https://thelocalyield.com";

export async function getListings(params: { zip?: string; radius?: number; q?: string }) {
  const search = new URLSearchParams();
  if (params.zip) search.set("zip", params.zip);
  if (params.radius != null) search.set("radius", String(params.radius));
  if (params.q) search.set("q", params.q);
  const res = await fetch(`${API_BASE}/api/listings?${search.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch listings");
  return res.json();
}
```

So: **GET https://thelocalyield.com/api/listings?zip=...** — no separate server needed; the Next.js app serves the API.

For local dev, you can switch the base URL to `http://localhost:3000` (or use an env var) so the mobile app talks to your local web app.
