# Feature Checklist — Gap Analysis

Comparison of the product requirements master list against the current codebase.  
**Legend:** ✅ Done · 🟡 Partial · ❌ Missing

---

## 🧱 SHARED PLATFORM FEATURES

### 🔐 Accounts & Roles

| Requirement | Status | Notes |
|-------------|--------|--------|
| User registration (email/password + OAuth optional) | ❌ | Auth pages are "Coming Soon" placeholders; no Clerk/Supabase yet |
| Role flags: Buyer, Producer, Caregiver, Homestead Owner | ✅ | `User.isProducer`, `isBuyer`, `isCaregiver`, `isHomesteadOwner` in schema + auth |
| Multi-role support (one account can be multiple) | ✅ | Same User table; flags allow multiple roles |
| Profile editing | ❌ | No profile edit page or API |
| Profile photo upload | ❌ | `User.avatarUrl` exists but no upload flow |
| Location (zip + radius logic) | ✅ | `User.zipCode`; `lib/geo.ts` + `filterByZipAndRadius` |
| Account settings | ❌ | No settings page |
| Region restriction (local-only enforcement) | 🟡 | Radius filtering exists; no explicit "region restriction" config |

### 📍 Location & Region

| Requirement | Status | Notes |
|-------------|--------|--------|
| Zip code storage | ✅ | `User.zipCode`; ItemRequest.zipCode |
| Radius-based search filtering | ✅ | Listings API + `filterByZipAndRadius`; "within X miles" in browse |
| "Within X miles" logic | ✅ | `getDistanceBetweenZips`, `isWithinRadius` in `lib/geo.ts` |
| Map view | ❌ | No map component or integration |

### 💬 Messaging

| Requirement | Status | Notes |
|-------------|--------|--------|
| 1:1 conversations | ✅ | `Conversation` + `Message` models; `lib/messaging.ts` (getOrCreate, send, list) |
| Threads per Order | ✅ | `Conversation.orderId`; lib supports it |
| Threads per Booking | ✅ | `Conversation.careBookingId`; lib supports it |
| Attach images | ❌ | Message has `body` only; no attachment field or API |
| Read receipts | ❌ | Not implemented |
| Notifications (email + in-app) | ❌ | No notification system or table |

### 💳 Payments (Stripe)

| Requirement | Status | Notes |
|-------------|--------|--------|
| One-time payments | 🟡 | Structure in place; `createCheckoutSession` is stub (returns null) |
| Delivery fee support | ❌ | No delivery fee on Order or Product |
| Service fee logic | ❌ | Not implemented |
| Payouts to Producers / Caregivers | ❌ | Stub only; no Stripe Connect or transfer logic |
| Refund support (basic) | ❌ | Not implemented |
| Payment history view | ❌ | No payment/payout history UI or table |
| CheckoutMetadata (context, orderId) | ✅ | Ready for market/care routing |

### ⭐ Reviews & Ratings

| Requirement | Status | Notes |
|-------------|--------|--------|
| Generic review model | ✅ | `reviewerId`, `revieweeId`, `type` (MARKET/CARE), `orderId?`, `careBookingId?` |
| Rating 1–5 | ✅ | `Review.rating` |
| Written feedback | ✅ | `Review.comment` |
| Review type (market / care) | ✅ | `ReviewType` enum |
| Prevent self-review | ❌ | No check in `createReview` (reviewerId !== revieweeId) |
| Display on profile | 🟡 | `getReviewsForProducer` / `getReviewsForReviewee` exist; profile display not wired |
| Resolution window (negative reviews) | ✅ | `canPublishNegativePublicReview`; 48h post-pickup |
| Producer response / admin hide | ✅ | In schema + lib |

### 🔔 Notifications

| Requirement | Status | Notes |
|-------------|--------|--------|
| Order received, Booking requested, etc. | ❌ | No notification model or sending (email/in-app) |

### 📂 Media Uploads

| Requirement | Status | Notes |
|-------------|--------|--------|
| Profile photos | ❌ | `avatarUrl` on User; no upload API or UI |
| Product images | 🟡 | `Product.imageUrl` / `stockImage` in schema; no upload flow (CatalogSelector says "optional photo upload later") |
| Visit photos (Care) | ❌ | Care not built |
| ID verification image (future) | ❌ | — |

---

## 🛒 MARKET FEATURES

### 👩‍🌾 Producer

| Requirement | Status | Notes |
|-------------|--------|--------|
| Farm/Maker name, description | 🟡 | User has `name`, `bio`; no dedicated "farm name" or producer profile page |
| Pickup address (public or masked) | ❌ | No address field; only zipCode |
| Delivery toggle | ✅ | `Product.delivery` |
| Delivery fee field | ❌ | No delivery fee on Product or Order |
| Pickup instructions | ❌ | No field |
| Add / Edit / Delete product | ❌ | Dashboard products page is placeholder "TODO: list + add/edit" |
| Title, description, price, photo | ✅ | Product schema has these; no CRUD API/UI |
| Quantity available | ❌ | No quantity or stock field on Product |
| Mark sold out | ❌ | No soldOut or availability field |
| Delivery eligible toggle | ✅ | `Product.delivery` |
| View orders | ✅ | Dashboard orders with buyer/producer split |
| Filter by Pending / Fulfilled | ❌ | No status on Order; no filter UI |
| Mark fulfilled | ❌ | No fulfillment status or action |
| Order details view | 🟡 | List with product, pickup code; no dedicated detail page |
| Sales summary (daily/weekly/monthly) | ✅ | `lib/sales-summary.ts` + dashboard/records |
| Download sales CSV | ✅ | `getSalesSummaryCsv` in sales-summary |
| Financial view (total, card vs cash, delivery fees, payout history) | 🟡 | Card/cash in sales summary; no delivery fees or payout history |

### 🛍 Buyer

| Requirement | Status | Notes |
|-------------|--------|--------|
| Browse producers / products | ✅ | `/market/browse` + listings API with zip/radius |
| Search by keyword | ✅ | `q` param in listings API |
| Filter by distance, category, delivery | ✅ | Distance + label (nearby/fartherOut); category in data; delivery on product |
| Producer profile view | 🟡 | `/market/shop/[id]` exists but placeholder; doesn't load producer/products from DB |
| Add to cart | ❌ | No cart model or UI |
| Edit cart | ❌ | — |
| Checkout | ❌ | No checkout flow; `initiateCheckout` is stub |
| Choose Pickup / Delivery | 🟡 | Product has delivery/pickup booleans; no per-order choice in flow |
| Order confirmation | ❌ | No checkout → no confirmation |
| Order history | ✅ | Dashboard orders for buyer |
| Reorder button | ❌ | — |
| Favorite producer / product | ❌ | No favorites model or UI |
| Repeat purchase | 🟡 | Order history exists; no "reorder" or favorites |

---

## 🐐 CARE FEATURES

| Area | Status | Notes |
|------|--------|--------|
| Homestead profile (property, species, care notes, etc.) | ❌ | No Homestead model or tables |
| Caregiver profile (bio, experience, rate, availability, radius) | ❌ | No Caregiver/ServiceListing model; `/care/caregiver/[id]` placeholder |
| Booking flow (search, filter, dates, visit type, price, confirm) | ❌ | No CareBooking or booking API |
| Booking management (upcoming, cancel, message, review) | ❌ | — |
| Visit execution (start, checklist, notes, photos, complete, notify) | ❌ | No Visit/Checklist model or flow |
| Care feature flag | ✅ | `isCareEnabled()` in `lib/feature-flags.ts`; Care pages redirect when off |

**Schema:** Orders and Bookings are separate (Order exists; CareBooking not yet in schema). Messaging and Reviews are generic and support Care when you add the Care models.

---

## 🔒 TRUST & SAFETY

| Requirement | Status | Notes |
|-------------|--------|--------|
| Email verification | ❌ | Not implemented |
| Identity / background check (future) | ❌ | — |
| Cancellation policy | ❌ | — |
| Refund flow | ❌ | — |
| Dispute resolution | ❌ | — |
| Flag user / report abuse | ❌ | — |
| Terms + waiver acceptance | ❌ | — |

---

## 📊 ADMIN / OPS

| Requirement | Status | Notes |
|-------------|--------|--------|
| View all users | ❌ | Admin users page is placeholder "TODO: protect + data" |
| Suspend user | ❌ | No suspend flag or action |
| View orders | ❌ | No admin orders view |
| View bookings | ❌ | Care not built |
| Refund payment | ❌ | — |
| Manually adjust payout | ❌ | — |
| View disputes | ❌ | — |
| Review reports/flags | ❌ | — |
| Region management | ❌ | — |
| Feature flag management (hide Care) | 🟡 | Care hidden via env `NEXT_PUBLIC_ENABLE_CARE`; no admin UI to toggle |
| Admin: hide review | ✅ | POST `/api/admin/reviews/[id]/hide` + Admin reviews page |

---

## 🔥 High-Risk / Critical (from your list)

| Item | Status | Notes |
|------|--------|--------|
| Delivery fee calculation logic | ❌ | No delivery fee field or logic |
| Payout timing logic | ❌ | No payouts implemented |
| Visit completion logic | ❌ | No Care visit flow |
| Radius filtering accuracy | ✅ | ZIP-based distance in geo.ts; used in listings |
| Role-based UI (don't show wrong dashboard) | 🟡 | Dashboard uses `requireProducerOrAdmin` and role; no explicit "buyer vs producer" nav split everywhere |

---

## ✅ Architecture Verification (Practical Advice)

| Check | Status |
|-------|--------|
| User schema supports multi-role | ✅ Yes — role flags on User |
| Orders and Bookings are separate models | ✅ Orders exist; Bookings will be separate (CareBooking when added) |
| Messaging is generic | ✅ Conversation + Message with orderId? / careBookingId? |
| Reviews are generic | ✅ reviewerId, revieweeId, type (MARKET/CARE), orderId? / careBookingId? |
| Stripe supports both product + service flows | 🟡 Metadata (context, orderId) ready; no live Stripe or service flow yet |

**Verdict:** Shared infrastructure (User, Location, Messaging, Reviews, Stripe shape) is aligned with "one platform, two surfaces." Gaps are mostly: **real auth**, **Market flows (cart, checkout, delivery fee, product CRUD)**, **Care models and flows**, **notifications**, **media upload**, **admin data and actions**, and **trust & safety**.

---

## 🎯 Minimum Viable Combined Platform (from your list)

| Layer | Essential | Status |
|-------|-----------|--------|
| **Shared** | Auth, roles, Stripe, messaging, notifications | Auth stub only; Stripe stub; messaging DB + lib, no API/UI; notifications missing |
| **Market** | Profiles, products, cart, checkout, order dashboard | Profiles/products partial; no cart/checkout; order dashboard exists |
| **Care** | Profiles, booking, checklist, photo report, payment | Not built (beyond feature flag and placeholders) |

---

*Generated from codebase audit. Use this to prioritize: finish Market (auth, cart, checkout, delivery fee, product CRUD), then Care backend, then notifications and trust & safety.*
