# Phase 1: Frontend API Contract Mismatches

All API routes return:
- **Success:** `{ ok: true, data: ... }`
- **Error:** `{ ok: false, error: string, code?: string, requestId?: string }`

Frontend code that treats the response body as the **direct data** (old behavior) is a **mismatch**. Below: every call site and whether it expects direct data or already uses `ok`/`data`.

## Mismatches (expect direct data; API returns `{ ok, data }`)

| File | Endpoint | Issue |
|------|----------|--------|
| `components/BrowseClient.tsx` | GET /api/listings | Uses `res.json()` as `ListingsResponse`; should use `json.data`. |
| `app/market/checkout/CheckoutClient.tsx` | GET /api/shop/[id]/delivery | Uses `data.offersDelivery` from full body; API returns `{ ok, data: { offersDelivery, deliveryFeeCents } }`. |
| `components/AuthForm.tsx` | POST /api/auth/dev-login | Uses `data.redirect`; if API returns `{ ok, data: { redirect } }`, must use `data.data?.redirect`. |
| `components/SignupForm.tsx` | POST /api/auth/signup | Uses `data.error`, `data.redirect`; success redirect may be in `data.data?.redirect`. |
| `components/ProductCatalogForm.tsx` | GET /api/catalog/categories | Uses `data.customCategories`; API returns `{ ok, data }` with categories in `data`. |
| `components/ProductCatalogForm.tsx` | POST /api/catalog/custom-categories | Uses `data.customCategory`; API returns `{ ok, data: { customCategory } }`. |
| `components/ProducerProfileForm.tsx` | GET /api/dashboard/profile | Uses `res` (full body) as profile; API returns `{ ok, data: { user, producerProfile } }`. |
| `components/DemandNearYou.tsx` | GET /api/item-requests | Uses `data.requests`; API returns `{ ok, data: { requests } }`. |
| `app/dashboard/events/EventsClient.tsx` | GET /api/dashboard/events | Uses `data.events`, `data.error`; API returns `{ ok, data: { events } }`. |
| `app/dashboard/events/EventsClient.tsx` | POST /api/dashboard/events | Uses `data.error`; success body is `{ ok, data }`. |
| `app/dashboard/messages/DashboardMessagesClient.tsx` | GET /api/dashboard/conversations | Uses `data.conversations`; API returns `{ ok, data: { conversations } }`. |
| `app/dashboard/messages/page.tsx` | GET /api/dashboard/conversations (server) | Uses `data.conversations`; API returns `{ ok, data: { conversations } }`. |
| `app/dashboard/products/ProductsClient.tsx` | GET /api/products | Uses `data.products`; API returns `{ ok, data: { products } }`. |
| `app/dashboard/products/ProductsClient.tsx` | GET /api/products/[id] (EditProductForm) | Uses `data.product`; API returns `{ ok, data: { product } }`. |
| `app/dashboard/orders/BuyerOrdersClient.tsx` | POST /api/reviews | Uses `data.review`; API returns `{ ok, data: { review } }`. |
| `app/dashboard/orders/BuyerOrdersClient.tsx` | PATCH /api/reviews/[id] | Checks `data.error`; success payload in `data`. |
| `app/auth/onboarding/OnboardingClient.tsx` | POST /api/auth/onboarding | Uses `data.redirect`; API returns `{ ok, data }`, redirect in `data.redirect`. |
| `app/dashboard/reviews/ProducerReviewsClient.tsx` | POST /api/dashboard/reviews/[id]/message | Uses `data.conversationId`; API returns `{ ok, data: { conversationId } }`. |
| `app/care/browse/CareBrowseClient.tsx` | GET /api/care/caregivers | Uses `data.caregivers`; API returns `{ ok, data: { caregivers } }`. |
| `app/care/caregiver/[id]/BookingForm.tsx` | POST /api/care/bookings | Uses `data.conversationId`; API returns `{ ok, data: { conversationId } }`. |
| `app/dashboard/care-bookings/CareBookingsClient.tsx` | PATCH /api/care/bookings/[id] | Checks `data.error`; success is `{ ok, data }`. |
| `app/dashboard/care-bookings/CareBookingsClient.tsx` | POST /api/care/bookings/[id]/conversation | Uses `data.conversationId`; API returns `{ ok, data: { conversationId } }`. |

## No body parsing / error-only (OK as-is but should use api-client for consistency)

| File | Endpoint | Note |
|------|----------|------|
| `components/Navbar.tsx` | PATCH /api/auth/primary-mode | No response body used; best-effort. Use api-client for 429/error handling. |
| `components/SignOutButton.tsx` | POST /api/auth/sign-out | Only checks `res.ok`. Use api-client for consistency. |
| `components/RequestItemForm.tsx` | POST /api/item-requests | Uses `data.error` on failure; success does not use body. api-client will normalize. |
| `components/MarkFulfilledButton.tsx` | PATCH /api/orders/[id] | Uses `data.error` on failure. api-client will throw ApiError. |
| `app/admin/custom-categories/AdminCustomCategoriesClient.tsx` | PATCH /api/admin/custom-categories/[id] | Uses `data.error` on failure. |
| `app/admin/flagged-reviews/FlaggedReviewsClient.tsx` | POST dismiss/approve, PATCH guidance | Uses `data.error` on failure. |
| `app/admin/reviews/AdminReviewsClient.tsx` | POST /api/admin/reviews/[id]/hide | Uses `data.error` on failure. |
| `app/dashboard/customers/CustomersClient.tsx` | PATCH /api/dashboard/customers/note | Only checks `res.ok`. |

## Already handles ok/data (partial)

| File | Endpoint | Note |
|------|----------|------|
| `app/market/checkout/CheckoutClient.tsx` | POST /api/orders | Already checks `data.ok` and `data.data?.orderId`; can switch to api-client and use returned data. |
