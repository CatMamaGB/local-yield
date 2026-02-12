# Dashboard UX Improvements

## Summary

Improved Producer Dashboard UX with context-aware navigation, alert badges, better layout, and clearer review management instructions.

## Changes Made

### A) Context-Aware Navigation (`components/Navbar.tsx`)

**Problem:** Global navbar showed market links (Browse, Cart, About) even inside dashboard context.

**Solution:**
- Navbar now detects route context (`/dashboard`, `/market`, `/care`)
- In dashboard mode:
  - Hides: Browse, Cart, About
  - Shows: Dashboard-specific links (Orders, Messages, Products, Reviews)
- In market mode:
  - Shows: Browse, Cart, About
  - Hides dashboard-specific links
- Cart only renders in market mode/routes
- Mode switcher still works for multi-role users

### B) Dashboard Alert Counts & Badges

**New file:** `lib/dashboard-alerts.ts`
- `getProducerAlertCounts(userId)` returns:
  - `pendingOrdersCount`: Orders with status PENDING or PAID
  - `pendingReviewsCount`: Private reviews awaiting approval
  - `unreadMessagesCount`: Currently 0 (TODO - not yet implemented)

**Updated:** `app/dashboard/DashboardNav.tsx`
- Now accepts props: `pendingOrdersCount`, `pendingReviewsCount`, `unreadMessagesCount`
- Displays badges on:
  - Orders tab (pending orders count)
  - Messages tab (unread messages count)
  - Reviews link (pending reviews count)
- Badge styling: orange accent background, shows "99+" for counts over 99

**Updated:** `app/dashboard/layout.tsx`
- Fetches alert counts with `getProducerAlertCounts()`
- Passes counts to `DashboardNav` component

### C) Improved Dashboard Home Layout (`app/dashboard/page.tsx`)

**Alerts Row (top of page):**
- Shows alert cards only when counts > 0:
  - "Orders needing action" → links to `/dashboard/orders`
  - "Reviews to approve" → links to `/dashboard/reviews`
  - "New messages" → links to `/dashboard/messages`
- When no alerts: shows "All caught up" message

**Summary Stats:**
- Total Orders count
- Pending Orders count
- Pending Reviews count

**Quick Actions:**
- Add Product
- Add Event
- Update Profile
- View Storefront

**Recent Orders Preview:**
- Shows latest 5 orders with status badges
- Links to full orders page
- Falls back to ExampleOrderPreview when no orders

**Admin Links:**
- Shows admin shortcuts for admin users

**Layout improvements:**
- Removed duplicate nav cards (Profile, Products, Orders, etc.)
- More meaningful content with actual data
- Better information hierarchy

### D) Reviews Page Copy Improvements (`app/dashboard/reviews/page.tsx`)

**Added "How reviews work" section** with visual cards:

1. **Approve (✓)**
   - Publishes immediately
   - Appears on storefront and buyer's order page

2. **Message (💬)**
   - Opens private conversation
   - Review stays private during resolution
   - Can approve after resolution

3. **Flag (⚠)**
   - Sends to admin for evaluation
   - Stays private until admin reviews
   - Use for unfair/off-topic reviews

**Added "What buyers see" callout:**
- Explains buyer visibility: Pending, Published, or Under review

**Kept "Our balanced approach" section:**
- Explains fairness for both producers and buyers
- Clarifies when reviews go public

## Files Changed

1. `lib/dashboard-alerts.ts` (new)
2. `components/Navbar.tsx`
3. `app/dashboard/DashboardNav.tsx`
4. `app/dashboard/layout.tsx`
5. `app/dashboard/page.tsx`
6. `app/dashboard/reviews/page.tsx`

## Testing Checklist

- [ ] Navigate to `/dashboard` as producer - should see dashboard links in navbar, not market links
- [ ] Navigate to `/market` as producer - should see Browse, Cart, About in navbar
- [ ] Check badge counts appear on Orders, Messages, Reviews tabs
- [ ] Verify alert cards show on dashboard home when there are pending items
- [ ] Verify "All caught up" shows when no pending items
- [ ] Check summary stats display correctly
- [ ] Test quick action links work
- [ ] Verify recent orders preview shows latest 5 orders
- [ ] Check reviews page shows "How reviews work" section clearly
- [ ] Verify cart icon doesn't show in dashboard context

## Future Improvements

- Implement unread message tracking (currently returns 0)
- Add "Upcoming Events" preview section on dashboard home
- Consider adding revenue summary to dashboard stats
- Add search/filter to recent orders preview
