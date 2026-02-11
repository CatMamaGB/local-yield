# Phase 1: Shared Infrastructure & Strategy

One local platform, two surfaces (Market + Care). Build shared infrastructure once, then fully ship Market before polishing Care.

---

## ✅ P0 Launch Blockers (Implemented)

- **Real Auth (Clerk)**  
  - Sign up / log in at `/auth/signup` and `/auth/login` when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set.  
  - Session handling and protected routes (middleware) for `/dashboard/*`, `/api/dashboard/*`, `/api/products/*`, `/api/orders/*`, `/market/checkout/*`.  
  - User sync to DB on first sign-in (create `User` with `clerkId`, email, name; default zipCode `00000`, role BUYER).  
  - When Clerk is not configured, dev stub (cookie `__dev_user`) still works.

- **Schema (Order + Producer + Inventory)**  
  - `Order`: `status` (PENDING, PAID, FULFILLED, CANCELED, REFUNDED), `fulfillmentType` (PICKUP/DELIVERY), `deliveryFeeCents`, `totalCents`, `paidAt`, `fulfilledAt`, `stripeSessionId`; `productId` and `pickupDate` nullable.  
  - `OrderItem`: line items with `quantity`, `unitPriceCents` snapshot.  
  - `ProducerProfile`: `offersDelivery`, `deliveryFeeCents`, `pickupNotes`, `pickupZipCode`.  
  - `User.clerkId` for Clerk sync.  
  - `Product.quantityAvailable` (null = unlimited; 0 = sold out).

- **Product CRUD**  
  - `GET/POST /api/products` (list for producer, create).  
  - `GET/PATCH/DELETE /api/products/[id]` (ownership check).  
  - Dashboard Products page: list, add, edit, delete; title, price, description, category, image URL, delivery/pickup, quantity available.

- **Orders lib**  
  - `createOrder` supports single `productId` (totalCents derived from product) or multi-item `items[]`; creates `OrderItem`s; sets status PENDING, totalCents, deliveryFeeCents.  
  - `getOrdersForBuyer` / `getOrdersForProducer` include `orderItems`; sales summary and CSV use `orderItems` and `totalCents`.

- **Reviews**  
  - Self-review prevented in `createReview` (reviewerId !== revieweeId).

- **Navbar**  
  - Sign in / Sign up only when user is null; otherwise Dashboard / Admin by role.

---

## ✅ Phase 1: Shared Infrastructure (Done)

### 1. User model
- **One `User` table** with role flags: `isProducer`, `isBuyer`, `isCaregiver`, `isHomesteadOwner`.
- Same login, same account, no duplicates. Legacy `role` enum (BUYER/PRODUCER/ADMIN) kept for backward compatibility.
- Seed and auth stubs updated to set role flags.

### 2. Location + radius
- **`lib/geo.ts`**: `getDistanceBetweenZips`, `isWithinRadius`, `getZipCoordinates`, `haversineMiles`.
- **`filterByZipAndRadius<T>(userZip, radiusMiles, items)`**: shared discovery helper for any entity with `zipCode`. Use for Market listings and Caregiver proximity.

### 3. Messaging
- **Models**: `Conversation` (userAId, userBId, orderId?, careBookingId?), `Message` (conversationId, senderId, body).
- **`lib/messaging.ts`**: `getOrCreateConversation`, `getConversationById`, `listConversationsForUser`, `sendMessage`. Reusable for Buyer↔Producer and Owner↔Caregiver.

### 4. Stripe
- **`lib/stripe.ts`**: `isStripeConfigured()`, `createCheckoutSession`, `constructWebhookEvent`.
- **`CheckoutMetadata`**: `context` (market | care), `orderId`; extend later for split payouts / escrow (Care). No escrow overbuild yet.

### 5. Reviews
- **Generic model**: `reviewerId`, `revieweeId`, `type` (MARKET | CARE), `orderId?`, `careBookingId?`, `rating`, `comment`. `producerId` kept for backward compat.
- **`lib/reviews.ts`**: `createReview` accepts `revieweeId` and `type`; `getReviewsForReviewee(revieweeId, { type, resolved })` for Market and Care.

---

## Next: Fully finish MARKET

- Producer onboarding, product listing, cart + checkout, delivery toggle + fee, order dashboard, messaging.
- Polish and ship Market first; onboard producers.

---

## Then: Care MVP (built but hidden)

- Behind `NEXT_PUBLIC_ENABLE_CARE=true` (`lib/feature-flags.ts`: `isCareEnabled()`).
- Caregiver profile, homestead profile, booking flow, visit checklist, photo upload, payment, completion. No marketing or landing pages until Market has traction.

---

## Trap to avoid

- Don’t build advanced Care features, endless Care UI, or background checks/insurance systems before Market is the liquidity engine.
