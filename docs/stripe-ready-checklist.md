# Stripe integration — readiness checklist

Use this checklist when wiring Stripe for card payments. Do **not** rely on client or any non-webhook path to confirm payment.

## Before you implement

- [ ] **Env:** Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in production (and use test keys in staging).
- [ ] **PATCH guard:** Leave `PATCH /api/orders/[id]` **PENDING → PAID** restricted to `order.viaCash === true` only. Card orders must become PAID only via webhook.
- [ ] **Create order:** Keep `createOrder()` setting `paid: false` at creation for card orders; credit-only orders can stay `paid: true` at creation.

## Implementation steps

1. **Checkout session**
   - Implement `createCheckoutSession()` in `lib/stripe.ts` (or equivalent) with `metadata.orderId` (and optionally `metadata.context: "market"`).
   - Add `POST /api/checkout/session` (or similar) that builds the session and returns the Stripe Checkout URL. Do **not** create the order here for card — create order after payment succeeds.

2. **Order creation for card**
   - Option A: Create order when user clicks “Pay” (status PENDING, `viaCash: false`), then create Checkout Session with `metadata.orderId`; webhook marks it PAID.
   - Option B: Create order in webhook when `payment_intent.succeeded` (or `checkout.session.completed`) fires, using metadata. Prefer one source of truth (either order created before checkout with idempotency, or order created in webhook).

3. **Webhook**
   - Add `POST /api/webhooks/stripe` (or under a route you protect by Stripe signature).
   - Use `constructWebhookEvent(payload, signature)` (implement in `lib/stripe.ts`) to verify signature with `STRIPE_WEBHOOK_SECRET`.
   - On `payment_intent.succeeded` (or `checkout.session.completed`), resolve `orderId` from event metadata, then:
     - Update order: `paid: true`, `paidAt: new Date()`, `status: "PAID"`.
     - Do **not** trust client for this; only webhook + verified signature.

4. **Idempotency**
   - Keep using `idempotencyKey` on order creation so duplicate client retries don’t create duplicate orders.

5. **Refunds**
   - Use Stripe Refunds API when admin resolves a dispute with refund; update `stripeRefundedCents` (and any related fields) so UI and reporting stay correct.

## After implementation

- [ ] **Test:** Create a card order → pay via Checkout → confirm webhook runs and order becomes PAID.
- [ ] **Test:** Attempt to mark a card order PAID via PATCH → must return 400 (existing guard).
- [ ] **Test:** Cash orders still become PAID via PATCH only (no webhook needed).

## Pagination / list endpoints (reference)

List endpoints that are bounded (for scale and abuse control):

- **Orders:** `getOrdersForBuyer`, `getOrdersForProducer`, `getPaidOrdersForProducer` — use `OrdersListOptions` (`limit` / `skip`); default page size 100, max 200.
- **Item requests:** `listItemRequestsByRadius`, `listItemRequestsByRequester` — capped at 100.
- **Feed:** `getFeed` — events/postings/products each capped via `MAX_EVENTS`, `MAX_POSTINGS`, `MAX_PRODUCTS`.
- **Admin/dashboard lists:** Most use `take`/`skip` or a cap; add pagination to any new list endpoint.

Not legal or tax advice. Ensure compliance with Stripe’s terms and your jurisdiction.
