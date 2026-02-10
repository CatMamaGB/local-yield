# Product vision: Marketplace + Rover

One domain, two experiences (Market + Care) on a shared backbone. These pillars make the platform top-tier.

---

## A. Trust & kindness system (unique advantage)

- **Resolution window** — Buyer cannot publish a negative public review until a configurable window (e.g. 48–72h) after delivery/pickup. Gives producer time to fix/refund/replace.
- **Producer response** — Producers can respond to feedback with fix/refund/replace; response is visible alongside the review.
- **Short, structured public reviews** — No rant walls: rating (e.g. 1–5) + short optional comment. Keeps trust signal useful and scannable.
- **Admin moderation from day 1** — Moderation tools to hide abusive content, mark resolved, and handle escalations. Reviews can be flagged and hidden.

*Schema: `Order.resolutionWindowEndsAt`, `pickupCode`; `Review.rating`, `producerResponse`, `hiddenByAdmin` (see prisma/schema.prisma). After changing schema: run `npx prisma migrate dev` (or `npx prisma db push` in dev if you have drift).*

---

## B. Liquidity tools (keep local marketplace alive)

- **Request an item** — Buyers post “I’m looking for eggs, honey, …” with location. Producers in radius see demand and can list or message. Surfaces unmet demand.
- **Weekly box subscriptions** — Already in product: stable repeat revenue for producers, predictable supply for buyers. Core liquidity driver.
- **Demand visibility** — Producers see aggregated “wanted” items in their area (from item requests) to decide what to grow or stock.

*Schema: `ItemRequest` (requester, description, zip, radius, status).*

---

## C. Events + preorder (killer feature)

- **“Pick up at market booth Saturday”** — Events with location + date. Producers who already do farmers’ markets can list events and attach products.
- **Reserve now + pickup QR** — Preorder for event pickup; buyer gets a QR (or code) to show at the booth. Low-friction for producers and buyers.
- **Adoption** — Makes onboarding easy for producers who already sell at markets; they get a simple “reserve + bring to market” flow.

*Schema: `Event` + `EventProduct` already support preorder; add pickup code/QR when building checkout (e.g. on Order or EventOrder).*

---

## Summary

| Pillar | Key features |
|--------|----------------|
| **Trust** | Resolution window, producer response, structured reviews, admin moderation |
| **Liquidity** | Request an item, weekly boxes, demand visibility |
| **Events** | Event listings, preorder, reserve-now + pickup QR |

All of this shares: **Users**, **Location** (ZIP/radius), **Reviews/issue resolution**, and (future) **Messaging**.
