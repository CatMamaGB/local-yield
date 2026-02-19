# 10-minute QA checklist (runnable)

**Base URL:** http://localhost:3000  
**Prereq:** Log in as needed (buyer, producer, admin) — use `/auth/login` or dev login.

---

## 1. Market browse
- [ ] Open **http://localhost:3000/market/browse**
- [ ] See "Browse local goods" + PageHeader; location/search UI
- [ ] Enter a ZIP (e.g. 90210), set radius — see listings or "No listings match"
- [ ] Clear ZIP or use no results — see **EmptyState** "No listings match"
- [ ] (Optional) DevTools → Network → Offline, submit — see **error** InlineAlert

---

## 2. Checkout
- [ ] Open **http://localhost:3000/market/checkout** with **empty cart**
- [ ] See "Your cart is empty" + link to View cart
- [ ] Add item to cart from browse, go to checkout — see form, fulfillment, Place order
- [ ] Place order (success) — redirect/confirmation
- [ ] (Optional) With delivery selected, if shop has no delivery — see **warning** for delivery fee

---

## 3. Dashboard Events
- [ ] Log in as **producer**, open **http://localhost:3000/dashboard/events**
- [ ] Initial load: see **LoadingSkeleton** then content
- [ ] If no events: see **EmptyState**
- [ ] Click "Add event" — form; submit valid event — list updates
- [ ] Delete an event — confirm, list updates
- [ ] (Optional) Trigger error (e.g. invalid date) — see **InlineAlert** error

---

## 4. Dashboard Messages
- [ ] Log in as producer or buyer, open **http://localhost:3000/dashboard/messages**
- [ ] See **PageHeader** "Messages" + subtitle
- [ ] Initial load: see **LoadingSkeleton** then list or empty
- [ ] If no conversations: see **EmptyState** "No conversations yet"
- [ ] (Optional) Simulate API failure — see **InlineAlert** error

---

## 5. Dashboard Products
- [ ] Log in as **producer**, open **http://localhost:3000/dashboard/products**
- [ ] Initial load: **LoadingSkeleton** then list
- [ ] If no products: **EmptyState** "No products yet"
- [ ] Add product, edit, delete — success
- [ ] (Optional) Error on load — **InlineAlert** error

---

## 6. Care bookings
- [ ] Log in (seeker or caregiver), open **http://localhost:3000/dashboard/care-bookings**
- [ ] If no bookings: **EmptyState** "No bookings yet" + "Browse caregivers"
- [ ] With bookings: accept/decline/cancel — **InlineAlert** on action error

---

## 7. Care browse
- [ ] Open **http://localhost:3000/care/browse**
- [ ] Enter invalid ZIP (e.g. "12") — validation message
- [ ] Enter valid ZIP (e.g. 90210) — caregivers or empty state
- [ ] API error — **InlineAlert**

---

## 8. Admin custom categories (Reject)
- [ ] Log in as **admin**, open **http://localhost:3000/admin/custom-categories**
- [ ] Pick a **pending** custom category, click **Reject**
- [ ] Confirm dialog — category rejected, list refreshes
- [ ] (Optional) Reject again or force error — **alert** with sane message (apiErrorMessage)

---

## 9. Dashboard orders (buyer)
- [ ] Log in as **buyer**, open **http://localhost:3000/dashboard/orders**
- [ ] No orders: see inline "No orders yet" + Browse link
- [ ] With orders: leave review or update review — success; trigger error — see error handling

---

## 10. Producer reviews
- [ ] Log in as **producer**, open **http://localhost:3000/dashboard/reviews**
- [ ] No pending reviews: see inline "No pending reviews" text
- [ ] With pending: Approve / Flag / Message — confirm **error** handling (InlineAlert)

---

**Done:** Tick each box as you go. Focus on loading → empty → error and key actions.
