# Frontend API Contract & UX Upgrade Summary

## 1. Summary of Changes

- **Single API client** (`lib/client/api-client.ts`): All `/api` calls now use `apiGet`, `apiPost`, `apiPatch`, or `apiDelete`. The client enforces the contract: success returns `data`, errors throw `ApiError` with `message`, `code`, `status`, `requestId`. Rate limiting (429 / `RATE_LIMIT`) throws a friendly message.
- **Shared UI components** (`components/ui/`): `PageHeader`, `SectionCard`, `EmptyState`, `InlineAlert`, `LoadingSkeleton` for consistent layout, empty states, errors, and loading.
- **Contract alignment**: Every frontend call that previously assumed a direct response body now uses the client and expects `{ ok, data }` / `{ ok: false, error, code?, requestId? }`.
- **Error UX**: Inline errors use `InlineAlert`. For server errors (500 / INTERNAL_ERROR), `apiErrorMessage()` shows: "Something went wrong. If you contact support, share this ID: {requestId}". For RATE_LIMIT: "Too many requests. Please wait a moment and try again."
- **Loading & empty states**: Key screens use `LoadingSkeleton` while fetching and `EmptyState` when there is no data (e.g. no listings, no orders, no conversations).

---

## 2. Files Modified (by area)

### API client & error helper
- **Added:** `lib/client/api-client.ts` — `ApiError`, `apiGet`, `apiPost`, `apiPatch`, `apiDelete`, `apiErrorMessage`

### Shared UI
- **Added:** `components/ui/PageHeader.tsx`
- **Added:** `components/ui/SectionCard.tsx`
- **Added:** `components/ui/EmptyState.tsx`
- **Added:** `components/ui/InlineAlert.tsx`
- **Added:** `components/ui/LoadingSkeleton.tsx`

### Market
- `components/BrowseClient.tsx` — api-client, loading skeleton, empty state, InlineAlert for errors
- `app/market/browse/page.tsx` — PageHeader
- `app/market/checkout/CheckoutClient.tsx` — apiGet/apiPost, InlineAlert for errors and delivery warning

### Auth
- `components/AuthForm.tsx` — apiPost dev-login
- `components/SignupForm.tsx` — apiPost signup
- `components/Navbar.tsx` — apiPatch primary-mode
- `components/SignOutButton.tsx` — apiPost sign-out
- `app/auth/onboarding/OnboardingClient.tsx` — apiPost onboarding, InlineAlert for error

### Catalog & profile
- `components/ProductCatalogForm.tsx` — apiGet categories, apiPost custom-categories
- `components/ProducerProfileForm.tsx` — apiGet profile, apiPatch profile

### Dashboard
- `app/dashboard/events/EventsClient.tsx` — apiGet/apiPost/apiDelete, LoadingSkeleton, EmptyState, InlineAlert
- `app/dashboard/messages/DashboardMessagesClient.tsx` — apiGet conversations, LoadingSkeleton, EmptyState, InlineAlert
- `app/dashboard/messages/page.tsx` — PageHeader, server fetch parses ok/data
- `app/dashboard/products/ProductsClient.tsx` — apiGet/apiPost/apiPatch/apiDelete, LoadingSkeleton, EmptyState, InlineAlert; AddProductForm and EditProductForm use api-client
- `app/dashboard/orders/BuyerOrdersClient.tsx` — apiPost/apiPatch reviews, InlineAlert
- `app/dashboard/reviews/ProducerReviewsClient.tsx` — apiPost approve/flag/message, InlineAlert
- `app/dashboard/care-bookings/CareBookingsClient.tsx` — apiPatch/apiPost, EmptyState, InlineAlert
- `app/dashboard/customers/CustomersClient.tsx` — apiPatch customers/note

### Orders & reviews
- `components/MarkFulfilledButton.tsx` — apiPatch orders/[id], ApiError messaging

### Admin
- `app/admin/custom-categories/AdminCustomCategoriesClient.tsx` — apiPatch (approve, reject, edit)
- `app/admin/flagged-reviews/FlaggedReviewsClient.tsx` — apiPost dismiss/approve, apiPatch guidance
- `app/admin/reviews/AdminReviewsClient.tsx` — apiPost hide

### Care
- `app/care/browse/CareBrowseClient.tsx` — apiGet caregivers, InlineAlert, LoadingSkeleton, EmptyState
- `app/care/caregiver/[id]/BookingForm.tsx` — apiPost bookings, InlineAlert for error
- `app/dashboard/care-bookings/CareBookingsClient.tsx` — see Dashboard above

### Other
- `components/DemandNearYou.tsx` — apiGet item-requests
- `components/RequestItemForm.tsx` — apiPost item-requests, InlineAlert success/error

### Docs
- **Added:** `docs/api-contract-mismatches.md` — Phase 1 list of mismatches
- **Added:** `docs/frontend-api-ux-upgrade-summary.md` — this file

---

## 3. Manual Test Checklist

- [ ] **Market browse**
  - Go to `/market/browse`. Enter ZIP and radius. Confirm listings load.
  - Confirm loading skeleton appears while fetching.
  - With no ZIP or no results, confirm empty state: "No listings match" with suggestion to change ZIP/radius/search.
  - Simulate error (e.g. block network): confirm InlineAlert shows error (and requestId if 500).

- [ ] **Cart & checkout**
  - Add items to cart, go to checkout. Confirm delivery options load when producer offers delivery.
  - Submit order: confirm success redirect to order confirmation.
  - Simulate API error on POST /api/orders (e.g. 500): confirm InlineAlert shows error and, for 500, requestId text: "If you contact support, share this ID: ...".
  - Confirm submit button is disabled with "Placing order…" while submitting.
  - If rate limited (429): confirm message "Too many requests. Please wait a moment and try again."

- [ ] **Rate limiting**
  - Trigger 429 (e.g. many rapid requests where rate limit is enabled): confirm friendly RATE_LIMIT message and no stack trace.

- [ ] **Server error + requestId**
  - Force a 500 from an API route (e.g. throw in route) and trigger that route from the UI. Confirm error message includes requestId: "Something went wrong. If you contact support, share this ID: {requestId}".

- [ ] **Dashboard**
  - As producer: open `/dashboard`. Confirm summary and metrics render; no regressions.
  - Open `/dashboard/orders`, `/dashboard/products`, `/dashboard/messages`, `/dashboard/reviews`. Confirm lists load; empty states when no data; errors use InlineAlert.
  - Open `/dashboard/events`: confirm loading skeleton, then list or empty state; add/delete event works.

- [ ] **Auth**
  - Dev login, signup, onboarding: confirm redirects and that errors show via InlineAlert where used.
  - Sign out: confirm redirect after apiPost sign-out.

- [ ] **Care (if enabled)**
  - Care browse: enter ZIP, confirm loading then results or empty state; errors show InlineAlert.
  - Request booking: confirm success redirect to messages; on error, InlineAlert shows.
  - Dashboard care bookings: confirm list or empty state; status update and "Message" use api-client.

- [ ] **Admin**
  - Custom categories: approve/reject/edit with api-client; errors surface via alert.
  - Flagged reviews: dismiss/approve/guidance with api-client.
  - Reviews: hide action with api-client.

---

## 4. UI Areas Not Touched (and why)

- **Shop page (`/market/shop/[id]`)**: Not changed; product grid and producer header are server-rendered or use existing components. Can be upgraded later with SectionCard and EmptyState for "no products" if desired.
- **Cart page (`/market/cart`)**: Cart display and CartPageClient were not modified; only checkout uses the new client and InlineAlert. Cart page could be updated to use api-client if it ever calls /api.
- **Dashboard summary (home)**: Already uses server data and MetricCard/GrowthSignalCard; no client fetch. No change.
- **Producer orders page (dashboard/orders as producer)**: Order list is server-rendered; MarkFulfilledButton was updated. Full orders page could use PageHeader and EmptyState in a follow-up.
- **Admin custom categories list**: Fetched server-side; only PATCH actions were switched to api-client. List UI unchanged.
- **Individual product/shop pages**: No client /api calls in scope; visuals unchanged.

---

## 5. Quick Reference

- **Use the client for all /api calls:**  
  `import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/client/api-client";`
- **Handle errors:**  
  `catch (err) { const msg = err instanceof ApiError ? apiErrorMessage(err) : (err instanceof Error ? err.message : "Something went wrong"); setError(msg); }`
- **Show errors in UI:**  
  `{error && <InlineAlert variant="error">{error}</InlineAlert>}`
- **Loading:**  
  `{loading && <LoadingSkeleton rows={5} />}`
- **Empty:**  
  `{items.length === 0 && <EmptyState title="..." body="..." action={{ label: "...", href: "..." }} />}`
