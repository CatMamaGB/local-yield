# Verification pass report (no UI refactor)

**Date:** 2025-02-12  
**Scope:** API client usage, ok/data contract, shared UI consistency, loading/empty/error states.

---

## 1) Direct fetch to `/api/` not using `lib/client/api-client.ts`

### ⚠️ Remaining mismatches

| File | Line(s) | Notes |
|------|--------|--------|
| `app/admin/custom-categories/AdminCustomCategoriesClient.tsx` | **96** | `handleReject` uses raw `fetch()` for PATCH to `/api/admin/custom-categories/${id}`. Approve and Edit use `apiPatch`; only Reject uses direct fetch. |
| `app/dashboard/messages/page.tsx` | **12** | Server-side `getConversations()` uses raw `fetch(\`${base}/api/dashboard/conversations\`)`. Return value is never used (client fetches in `DashboardMessagesClient`), so this is dead code. |

**Verified:** All other client-side API calls use `apiGet` / `apiPost` / `apiPatch` / `apiDelete` from `@/lib/client/api-client`. No other direct `fetch("/api/...")` in app or components.

---

## 2) Code assuming API returns raw arrays/objects (no ok/data)

### ✅ Verified

- **Client code:** All call sites that use `lib/client/api-client.ts` receive unwrapped `data` (api-client returns `json.data` on success). No client code assumes raw arrays/objects.
- **Server-side:** `app/dashboard/messages/page.tsx` explicitly checks `json?.ok === true && json?.data` and uses `json.data.conversations` (correct contract).
- **Admin custom categories `handleReject`:** On error it reads `data.error`. API uses `fail(error, ...)` which returns `{ ok: false, error, ... }`, so `data.error` is correct. Success path does not read response body.

**Conclusion:** No remaining code assumes success responses are raw arrays/objects. Error path in Admin custom categories assumes `{ error }`, which matches the API contract.

---

## 3) Shared UI components on key screens

### ✅ Verified

| Screen | PageHeader | EmptyState | LoadingSkeleton | InlineAlert |
|--------|------------|------------|-----------------|-------------|
| **Market browse** | ✅ `page.tsx` | ✅ `BrowseClient` | ✅ `BrowseClient` | ✅ `BrowseClient` |
| **Checkout** | ❌ raw `<h1>` | N/A (inline empty cart text) | N/A | ✅ `CheckoutClient` |
| **Dashboard Events** | ❌ raw `<h1>` + `<p>` | ✅ `EventsClient` | ✅ `EventsClient` | ✅ `EventsClient` |
| **Dashboard Messages** | ✅ `page.tsx` | ✅ `DashboardMessagesClient` | ✅ `DashboardMessagesClient` | ✅ `DashboardMessagesClient` |
| **Dashboard Products** | ❌ raw `<h1>` | ✅ `ProductsClient` | ✅ `ProductsClient` | ✅ `ProductsClient` |
| **Care bookings** | ❌ raw `<h1>` + `<p>` | ✅ `CareBookingsClient` | N/A (server-rendered list) | ✅ `CareBookingsClient` |
| **Care browse** | ❌ `Link` + `<h1>` | ✅ `CareBrowseClient` | ✅ `CareBrowseClient` | ✅ `CareBrowseClient` |

**Inconsistencies (no refactor requested; for awareness):**

- **PageHeader** not used on: Checkout page, Dashboard Events, Dashboard Products, Dashboard Care bookings, Care browse. These use raw `<h1>` / `<p>` instead.
- **EmptyState** not used for: Checkout empty cart (inline text), Dashboard Orders buyer empty (inline `<p>`), ProducerReviewsClient empty (inline `<p>`). Functionally fine; just not the shared component.

---

## 4) Pages lacking loading, empty, or error states (prioritized, max 10)

Smallest fix per item:

1. **Care bookings page** (`app/dashboard/care-bookings/page.tsx`) — No error state if `getBookingsForUser(user.id)` throws. **Fix:** Wrap in try/catch; on error show `<InlineAlert variant="error">` and optional retry or redirect to dashboard.
2. **Dashboard orders page** (`app/dashboard/orders/page.tsx`) — No error state if `getOrdersForBuyer` / `getOrdersForProducer` or `getReviewByOrderForBuyer` throw. **Fix:** Try/catch around data fetches; show InlineAlert or redirect.
3. **Dashboard messages page** (`app/dashboard/messages/page.tsx`) — Dead server fetch: `getConversations()` is called but its result is unused (client fetches). **Fix:** Remove `getConversations` and its call to avoid confusion and duplicate request contract.
4. **ProducerReviewsClient** (`app/dashboard/reviews/ProducerReviewsClient.tsx`) — Empty state is plain `<p>`. **Fix:** Use `<EmptyState title="No pending reviews" body="…" />` for consistency.
5. **Dashboard orders (buyer)** (`app/dashboard/orders/page.tsx`) — Empty orders is inline `<p>`. **Fix:** Use `<EmptyState title="No orders yet" action={{ label: "Browse", href: "/market/browse" }} />`.
6. **Dashboard Events page** (`app/dashboard/events/page.tsx`) — No PageHeader. **Fix:** Replace `<h1>` + `<p>` with `<PageHeader title="Events" subtitle="…" />` (if UI consistency is desired later).
7. **Dashboard Products page** (`app/dashboard/products/page.tsx`) — No PageHeader. **Fix:** Same as Events (PageHeader) when doing UI pass.
8. **Dashboard Care bookings page** — No PageHeader; no loading state (server-rendered). **Fix:** PageHeader for consistency; loading only if page is ever made client-heavy.
9. **Checkout page** (`app/market/checkout/page.tsx`) — No PageHeader. **Fix:** Use PageHeader when doing layout pass.
10. **Care browse page** (`app/care/browse/page.tsx`) — No PageHeader. **Fix:** Use PageHeader for consistency.

Items 1–5 are loading/empty/error; 6–10 are mostly layout/consistency (PageHeader). No UI refactor was done per instructions.

---

## Summary

### ✅ Verified areas

- **API client:** All client-side API usage goes through `lib/client/api-client.ts` except the two call sites above.
- **ok/data contract:** No code assumes raw success payloads; error path in Admin custom categories matches `fail()` shape.
- **Key screens:** Market browse, Dashboard Messages, Dashboard Events client, Dashboard Products client, Dashboard Care bookings client, Care browse client all use `EmptyState` / `LoadingSkeleton` / `InlineAlert` where they do client fetching. Checkout has error and empty-cart handling.

### ⚠️ Remaining mismatches (with file paths)

- **Direct fetch:**  
  - `app/admin/custom-categories/AdminCustomCategoriesClient.tsx` (line 96)  
  - `app/dashboard/messages/page.tsx` (line 12, dead code)
- **PageHeader:** Checkout, Dashboard Events, Products, Care bookings, Care browse use raw headings (noted for future consistency).

### 🧪 10-minute manual QA checklist

- [ ] **Market browse** — Set ZIP, see listings; clear ZIP/radius, see empty state; simulate API failure (e.g. offline), see error.
- [ ] **Checkout** — Empty cart shows “Your cart is empty”; with cart, place order (success + error path); delivery option load error shows warning.
- [ ] **Dashboard Events** — Load shows skeleton; empty shows empty state; add/delete event; trigger error (e.g. invalid date).
- [ ] **Dashboard Messages** — Load shows skeleton; empty shows “No conversations yet”; error shows InlineAlert.
- [ ] **Dashboard Products** — Load skeleton; empty state “No products yet”; add/edit/delete; error on failed load.
- [ ] **Care bookings** — Empty shows “No bookings yet” + “Browse caregivers”; accept/decline/cancel; error on action shows InlineAlert.
- [ ] **Care browse** — Enter ZIP, see caregivers or empty; invalid ZIP shows validation message; API error shows InlineAlert.
- [ ] **Admin custom categories** — Reject uses direct fetch: reject a category and confirm it still works and error message is sane.
- [ ] **Dashboard orders (buyer)** — No orders shows inline message; with orders, leave/update review and see success/error.
- [ ] **Producer reviews** — No pending reviews shows inline text; approve/flag/message and confirm error handling.

---

*Verification only; no UI refactoring was performed.*
