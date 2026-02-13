# The Local Yield — Product Vision

One platform. Two experiences. One local economic backbone.

---

## Positioning

The Local Yield is **local economic infrastructure** for small producers and rural communities.

It is not simply a marketplace.  
It is not simply a care platform.

It is a **shared operating system** for people who grow food, raise animals, and support local economies.

The platform has two primary surfaces:

- **Market** — Local goods, subscriptions, events
- **Care** — Farm animal care and rural labor support

Both experiences run on the same trust architecture, location logic, messaging system, and producer growth tools.

The Local Yield is not a vertical feature app.  
It is a **foundation layer** for local commerce.

---

## Why This Exists

Small producers and homesteads operate in **fragmented systems**:

- Handshake agreements
- Text-message coordination
- Cash or manual payments
- Market-day-only sales
- No recurring revenue structure
- No demand forecasting
- No structured trust system

These systems work — until they don’t.

At the same time:

- **Buyers** want reliable local food without friction.
- **Rural families** need trusted livestock care.
- **Producers** need predictable income and growth tools.
- **Communities** need ways to exchange labor without chaos.

The Local Yield exists to **formalize local commerce without industrializing it**.

It strengthens what already works in rural culture — while removing the fragility.

---

## Core Principles

1. **Producers come first.**  
   If producers do not win, the ecosystem collapses.

2. **Trust is structured, not reactive.**  
   Trust must be engineered into the system.

3. **Liquidity is not accidental.**  
   It is designed.

4. **Growth tools must be lightweight.**  
   Infrastructure should empower, not overwhelm.

5. **Local culture is preserved.**  
   Technology supports relationships. It does not replace them.

---

## Pillar I — Trust Infrastructure

Trust is not a comment section. It is **system design**.

### Resolution-First Reviews

Negative reviews are gated by a **48–72 hour resolution window** after delivery or pickup.

Producers are given time to:

- Replace
- Refund
- Fix

This shifts the incentive from public punishment to private resolution.

### Structured Reviews

- 1–5 rating
- Short optional comment
- No unlimited rant threads

Reviews are readable, fair, and signal-driven.

### Producer Response

Producers can respond publicly to feedback. Context is visible alongside the rating.

### Admin Governance from Day One

- Flagging system
- Content hiding
- Escalation controls
- Admin action logs

This is not Yelp-style chaos. It is a **moderated trust network**.

**Schema alignment:**

- `Order.resolutionWindowEndsAt`
- `Order.pickupCode`
- `Review.rating`
- `Review.comment`
- `Review.producerResponse`
- `Review.hiddenByAdmin`
- `Review.flaggedForAdmin`
- `AdminActionLog`

---

## Pillar II — Liquidity Engine

Marketplaces fail when supply and demand cannot see each other.

The Local Yield **manufactures liquidity**.

### Request an Item

Buyers can post:

- “Looking for pasture-raised eggs.”
- “Need raw honey.”
- “Grass-fed beef quarter.”

Producers within radius see unmet demand.

Demand visibility reduces guesswork and increases production confidence.

### Weekly Box Subscriptions

Subscriptions provide:

- Recurring revenue
- Predictable harvest planning
- Flexible CSA alternative

This anchors producer stability.

### Demand Visibility in the Dashboard

Producers see:

- Repeat customers
- New customers this month
- 7-day and 30-day revenue
- Top-selling products
- Item requests near them

The dashboard is not order tracking.  
It is a **small business growth interface**.

**Schema alignment:**

- `ItemRequest`
- `Subscription`
- `lib/producer-metrics.ts`

---

## Pillar III — Events + Preorder

Farmers markets are the adoption wedge.

Producers can:

- Create event listings
- Attach products
- Allow preorder
- Generate pickup codes

Buyers reserve before market day and show a pickup code at the booth.

This removes friction without changing behavior.

It meets producers exactly where they already sell.

**Schema alignment:**

- `Event`
- `EventProduct`
- `Order.pickupCode`
- `Order.fulfillmentType`

---

## Pillar IV — Care (Rural Support Layer)

The Care experience is **not a gig app**.

It is structured rural support.

### Caregiver Profiles

- Experience
- Species comfort
- Task comfort
- Years of experience
- Intro media

Trust signals matter in livestock care.

### Care Service Listings

- Drop-in
- Overnight
- Farm sitting
- Boarding

Discovery is radius-based and role-aware.

### Booking + Messaging

- Request
- Accept / decline
- Status tracking
- Automatic conversation thread

Care is built for livestock owners, homesteads, rural families, and small farms.

It respects handshake culture while reducing ambiguity and liability.

**Schema alignment:**

- `CaregiverProfile`
- `CareServiceListing`
- `CareBooking`
- `Conversation`
- `Message`

---

## Shared Infrastructure

Both experiences run on a **unified backbone**:

- Single user account
- Role system
- ZIP + radius discovery
- Messaging
- Structured reviews
- Admin governance
- Feature flags
- Shared payment architecture

One login. One trust system. Two experiences.

---

## Producer Growth Infrastructure

The Local Yield will be known for helping small producers grow.

The producer dashboard becomes a **lightweight operating system**:

- Revenue tracking
- Sales history
- Repeat customer signals
- Subscription visibility
- Demand insights
- Active listings
- Customer notes
- Growth metrics

Not a bloated CRM.  
Not fifteen disconnected SaaS tools.

Just the **essential infrastructure** to grow a local business.

---

## What The Local Yield Is Becoming

- A farmers market that never closes
- A CSA without rigidity
- A rural labor exchange
- A structured trust network
- A producer operating system
- A local commerce layer

It is **infrastructure for people building local economies**.

---

## What It Is Not

- Etsy
- Faire
- Yelp
- Rover

It overlaps with them functionally — but it is built for small producers, homesteads, and rural communities.

---

## Schema Reference

See:

- `prisma/schema.prisma`
- `lib/orders.ts`
- `lib/reviews.ts`
- `lib/producer-metrics.ts`
- `lib/care.ts`
