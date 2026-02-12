# Prisma/Auth/Navbar Fixes - Complete

## Summary

Fixed TypeScript/Prisma sync issues, corrected auth routes to use Prisma enums, fixed routing, and improved dashboard navigation with context-aware UI.

---

## STEP 1 ✅ — Prisma Sync

### Actions Taken:
1. **Migration status check:**
   ```bash
   npx prisma migrate status
   ```
   - Found and removed broken migration folder: `20260212040000_add_user_identity_platform_use`
   - Database schema confirmed up to date (10 migrations applied)

2. **Prisma client regeneration:**
   ```bash
   npx prisma generate
   rm -rf node_modules/.prisma && npx prisma generate
   ```
   - Successfully regenerated with all enums: `Role`, `PrimaryMode`, `PlatformUse`
   - All relations confirmed: `userRoles`, `producerProfile`, `caregiverProfile`, `careSeekerProfile`

### Result:
✅ No TypeScript errors for Prisma types
✅ `Role`, `PrimaryMode`, `PlatformUse` enums properly exported from `@prisma/client`

---

## STEP 2 ✅ — Fix Auth Routes (Use Prisma Enums)

### Problem:
Auth routes were using string literals (`"BUYER"`, `"SELL"`) instead of Prisma enum values.

### Files Fixed:

**1. `app/api/auth/dev-signup/route.ts`**
- ✅ Import: `PrimaryMode` from `@prisma/client`
- ✅ SIGNUP_TO_PRISMA_ROLE uses `Role.BUYER`, `Role.PRODUCER`, etc.
- ✅ `primaryRole` = `Role.PRODUCER` or `Role.BUYER` (not strings)
- ✅ `primaryMode` = `PrimaryMode.SELL`, `PrimaryMode.CARE`, or `PrimaryMode.MARKET`
- ✅ `derivePlatformUse` parameter typed as `PrimaryMode` (not string union)
- ✅ Phone: `"000-000-0000"` (not empty string)
- ✅ Nested create: `userRoles`, `producerProfile`, `caregiverProfile`, `careSeekerProfile`

**2. `app/api/auth/signup/route.ts`**
- ✅ Import: `PrimaryMode` from `@prisma/client`
- ✅ SIGNUP_TO_PRISMA_ROLE uses enum values
- ✅ `primaryRole` = `Role.PRODUCER` or `Role.BUYER`
- ✅ Converts string `data.primaryMode` to `PrimaryMode` enum before DB write
- ✅ `derivePlatformUse` uses `PrimaryMode` enum comparisons

**3. `app/api/auth/dev-login/route.ts`**
- ✅ Import: `PrimaryMode` from `@prisma/client`
- ✅ DEV_TO_PRISMA_ROLE uses `Role.BUYER`, `Role.PRODUCER`, `Role.ADMIN`
- ✅ `primaryMode` = `PrimaryMode.MARKET` or `PrimaryMode.SELL`

**4. `app/api/auth/onboarding/route.ts`**
- ✅ Import: `PrimaryMode` from `@prisma/client`
- ✅ SIGNUP_TO_PRISMA_ROLE uses enum values
- ✅ `updateData.primaryMode` typed as `PrimaryMode`
- ✅ Converts string to enum before DB write
- ✅ `updateData.role` = `Role.PRODUCER` or `Role.BUYER`

**5. `lib/auth.ts`**
- ✅ Import: `Role as PrismaRole` from `@prisma/client`
- ✅ New user creation uses `PrismaRole.BUYER`
- ✅ userRole creation uses `PrismaRole.BUYER`

### Validation:
- ✅ All routes properly validate required fields: name, email, phone, zipCode, roles, primaryMode
- ✅ `platformUse` is derived server-side (never sent from client)
- ✅ Multi-role support: creates `user_roles` rows + role-specific profiles
- ✅ Admin role cannot be set via public signup

---

## STEP 3 ✅ — Fix Market/Care Routing

### File: `app/page.tsx`

**Fixed:**
- ✅ Market card now links to `/market/browse` (was `/market`)
- ✅ Care card links to `/care` (correct)
- ✅ Added `isCareEnabled()` check:
  - When enabled: clickable Care card → `/care`
  - When disabled: grayed-out "Coming Soon" card (no route to market)

---

## STEP 4 ✅ — Navbar + Dashboard Improvements

### A) Context-Aware Navbar (`components/Navbar.tsx`)

**Improvements:**
- ✅ Detects route context: `/dashboard`, `/market`, `/care`
- ✅ **In Dashboard mode:**
  - Shows: Orders, Messages, Products, Reviews
  - Hides: Browse, Cart, About
- ✅ **In Market mode:**
  - Shows: Browse, Cart, About
  - Hides: Dashboard-specific links
- ✅ Cart only renders in market routes
- ✅ Mode switcher works for multi-role users

### B) Alert Badges

**New file:** `lib/dashboard-alerts.ts`
- ✅ `getProducerAlertCounts(userId)`:
  - `pendingOrdersCount`: PENDING or PAID orders
  - `pendingReviewsCount`: private reviews awaiting approval
  - `unreadMessagesCount`: Currently 0 (TODO for future)

**New API:** `app/api/dashboard/summary/route.ts`
- ✅ GET endpoint returns alert counts for current user
- ✅ Auth required, producer/admin only

**Updated:** `app/dashboard/DashboardNav.tsx`
- ✅ Accepts props: `pendingOrdersCount`, `pendingReviewsCount`, `unreadMessagesCount`
- ✅ Shows badges on:
  - Orders tab (pending orders)
  - Reviews link (pending reviews)
  - Messages tab (unread messages - currently 0)
- ✅ Badge styling: orange accent, "99+" for > 99

**Updated:** `app/dashboard/layout.tsx`
- ✅ Fetches `getProducerAlertCounts()` on server
- ✅ Passes counts to `DashboardNav`

### C) Dashboard Home Improvements (`app/dashboard/page.tsx`)

**New sections:**
1. ✅ **Alerts Row** (top):
   - "Orders needing action"
   - "Reviews to approve"
   - "New messages"
   - Shows "All caught up" when counts = 0

2. ✅ **Summary Stats:**
   - Total Orders
   - Pending Orders
   - Pending Reviews

3. ✅ **Quick Actions:**
   - Add Product
   - Add Event
   - Update Profile
   - View Storefront

4. ✅ **Recent Orders Preview:**
   - Latest 5 orders with status badges
   - Links to full orders list

5. ✅ **Admin shortcuts** (if admin)

**Removed:**
- ❌ Duplicate nav cards (Profile, Products, Orders, etc.)

---

## STEP 5 ✅ — Reviews Page Copy Improvements

### File: `app/dashboard/reviews/page.tsx`

**Added "How reviews work" section:**

1. **✓ Approve**
   - Publishes immediately to storefront
   - Visible to all buyers

2. **💬 Message**
   - Opens private conversation
   - Review stays private during resolution
   - Can approve after resolution

3. **⚠ Flag**
   - Sends to admin for evaluation
   - Stays private until admin reviews
   - Use for unfair/off-topic reviews

**Added "What buyers see" callout:**
- Explains visibility states: Pending, Published, Under review

**Kept "Our balanced approach" section:**
- Explains fairness and transparency

---

## Files Changed

### Auth/Prisma Fixes:
1. ✅ `app/api/auth/dev-signup/route.ts`
2. ✅ `app/api/auth/signup/route.ts`
3. ✅ `app/api/auth/dev-login/route.ts`
4. ✅ `app/api/auth/onboarding/route.ts`
5. ✅ `lib/auth.ts`

### Routing:
6. ✅ `app/page.tsx`

### Navigation & Dashboard:
7. ✅ `components/Navbar.tsx`
8. ✅ `app/dashboard/DashboardNav.tsx`
9. ✅ `app/dashboard/layout.tsx`
10. ✅ `app/dashboard/page.tsx`
11. ✅ `app/dashboard/reviews/page.tsx`

### New Files:
12. ✅ `lib/dashboard-alerts.ts`
13. ✅ `app/api/dashboard/summary/route.ts`
14. ✅ `docs/dashboard-ux-improvements.md`
15. ✅ `docs/prisma-auth-navbar-fixes.md`

---

## Build Status
✅ **`npm run build`** passes successfully
✅ No TypeScript errors
✅ All Prisma types properly imported and used

---

## Testing Checklist

### Auth:
- [ ] Dev signup creates user with phone, zipCode, roles, primaryMode, platformUse
- [ ] Real signup validates all required fields
- [ ] Both routes redirect to `/auth/onboarding`
- [ ] User profiles created for selected roles

### Routing:
- [ ] Home page Market card → `/market/browse`
- [ ] Home page Care card → `/care` (or "Coming soon" if disabled)

### Navbar Context:
- [ ] In `/dashboard`: Shows Orders/Messages/Products/Reviews, NO Cart/Browse
- [ ] In `/market`: Shows Browse/Cart/About, NO Dashboard links
- [ ] Multi-role users see Mode Switcher
- [ ] Cart only visible in market routes

### Dashboard:
- [ ] Alert cards show when counts > 0
- [ ] "All caught up" shows when no alerts
- [ ] Badge counts on Orders/Reviews/Messages tabs
- [ ] Summary stats display correctly
- [ ] Quick actions work
- [ ] Recent orders preview shows latest 5
- [ ] Reviews page has clear "How reviews work" section

---

## Next Steps

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Restart TypeScript server in VS Code:**
   - Press `Ctrl+Shift+P`
   - Type "TypeScript: Restart TS Server"

3. **Test the flows:**
   - Sign up as buyer → should see market nav
   - Sign up as producer → should see dashboard nav with badges
   - Navigate between market/dashboard → nav should switch contexts
   - Check alert counts on dashboard home

4. **Future improvements:**
   - Implement unread message tracking (currently returns 0)
   - Add real-time badge updates (polling or websockets)
