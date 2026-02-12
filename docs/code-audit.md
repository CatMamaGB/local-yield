# Code Audit Report - The Local Yield
**Date:** February 11, 2026  
**Scope:** High-level audit of all files and their interactions

---

## Executive Summary

This audit identifies critical issues, inconsistencies, and potential bugs across the codebase. The main concerns are:
1. **Critical:** Onboarding API doesn't persist ZIP code to database
2. **Critical:** Missing error handling in order creation flow
3. **High:** Type safety and validation gaps
4. **Medium:** Inconsistent data flow patterns
5. **Low:** Missing edge case handling

---

## File-by-File Analysis

### 🔴 Critical Issues

#### 1. `/app/api/auth/onboarding/route.ts`
**Issue:** ZIP code is saved to cookie but NOT persisted to database
- The route sets `__dev_zip` cookie but never updates `User.zipCode` in Prisma
- `OnboardingClient.tsx` expects ZIP to be saved to DB
- `lib/auth.ts` `getCurrentUser()` reads ZIP from cookie in dev mode, but this won't work for Clerk users
- **Impact:** ZIP code is lost on cookie expiration or when switching auth methods

**Fix Required:**
```typescript
// After setting cookie, also update DB:
await prisma.user.update({
  where: { id: user.id },
  data: { zipCode: zip }
});
```

#### 2. `/app/api/orders/route.ts`
**Issue:** Missing try-catch around database operations
- `prisma.user.findFirst()` and `createOrder()` can throw
- Unhandled errors will crash the route handler
- **Impact:** 500 errors without proper error messages

**Fix Required:** Wrap in try-catch and return appropriate error responses

#### 3. `/lib/orders.ts` - `createOrder()`
**Issue:** Multiple validation gaps
- No validation that products exist before creating order items
- No validation that `buyerId` and `producerId` are valid users
- If `items` array is empty but provided, order is created with no items
- `totalCents` calculation doesn't validate against provided `totalCents` if both are set
- **Impact:** Invalid orders can be created, data integrity issues

**Fix Required:** Add validation checks before order creation

---

### 🟡 High Priority Issues

#### 4. `/lib/orders.ts` - `createOrder()` - Resolution Window Logic
**Issue:** `resolutionWindowEndsAt` is only set if `pickupDate` is provided
- Orders without `pickupDate` have `null` resolution window
- `lib/reviews.ts` `canPublishNegativePublicReview()` returns `true` if `resolutionWindowEndsAt` is null
- **Impact:** Orders without pickup dates bypass resolution window protection

**Fix Required:** Decide on default behavior (set default pickup date or require it)

#### 5. `/app/api/orders/[id]/route.ts` - Status Transitions
**Issue:** No validation of valid status transitions
- Can transition from any status to any status (e.g., CANCELED → FULFILLED)
- No business logic validation
- **Impact:** Invalid order states, potential data corruption

**Fix Required:** Add status transition validation

#### 6. `/app/market/checkout/CheckoutClient.tsx`
**Issue:** Delivery fee fetch has no error handling
- `fetch('/api/shop/${singleProducerId}/delivery')` can fail silently
- If fetch fails, `deliveryFeeCents` stays at 0, which may be incorrect
- **Impact:** Users may see wrong delivery fees

**Fix Required:** Add error handling and fallback behavior

#### 7. `/lib/auth.ts` - `syncClerkUserToDb()`
**Issue:** ZIP code not synced from Clerk user
- New Clerk users get `DEFAULT_ZIP = "00000"`
- No mechanism to update ZIP from Clerk profile
- **Impact:** Clerk users may have incorrect location data

**Fix Required:** Check if Clerk user has location data and sync it

---

### 🟢 Medium Priority Issues

#### 8. `/contexts/CartContext.tsx`
**Issue:** No validation that producer exists
- Cart allows adding items with any `producerId`
- No API call to validate producer before adding to cart
- **Impact:** Cart can contain invalid producer IDs, causing errors at checkout

**Fix Required:** Validate producer exists (or handle gracefully at checkout)

#### 9. `/lib/orders.ts` - `createOrder()` - Product Price Mismatch
**Issue:** Price snapshot vs. current price inconsistency
- `CheckoutClient` sends `unitPriceCents` from cart (snapshot)
- `createOrder` can derive price from product if `productId` is used
- If both are provided and differ, which takes precedence?
- **Impact:** Price confusion, potential pricing errors

**Fix Required:** Clarify price source priority in documentation/code

#### 10. `/app/api/dashboard/profile/route.ts`
**Issue:** ZIP code validation inconsistency
- Line 70: Only updates ZIP if regex matches `^\d{5}$`
- But doesn't return error if invalid ZIP provided
- Silent failure may confuse users
- **Impact:** User may think ZIP was updated when it wasn't

**Fix Required:** Return error or warning if ZIP validation fails

#### 11. `/lib/reviews.ts` - `createReview()`
**Issue:** `producerId` fallback logic
- Line 52: `producerId = input.producerId ?? input.revieweeId`
- For MARKET reviews, this works, but for CARE reviews, `revieweeId` might not be a producer
- **Impact:** CARE reviews may have incorrect `producerId`

**Fix Required:** Only set `producerId` for MARKET reviews, or make it nullable for CARE

---

### 🔵 Low Priority / Code Quality Issues

#### 12. `/components/AuthForm.tsx` - Role Handling
**Issue:** Line 86: Admin role is filtered out in sign-up
- `RolePicker` doesn't include ADMIN, but code sets role to "BUYER" if ADMIN selected
- This seems intentional but could be clearer
- **Impact:** Confusing UX if someone tries to sign up as admin

**Fix Required:** Document why ADMIN can't sign up, or handle explicitly

#### 13. `/lib/orders.ts` - `initiateCheckout()`
**Issue:** Stub function returns `null` redirectUrl
- Comment says "Phase 1: Stub" but function signature suggests it should return redirect
- **Impact:** Card payments won't work (expected, but should be documented)

**Fix Required:** Document that card payments are not implemented

#### 14. `/app/api/orders/route.ts` - Quantity Clamping
**Issue:** Line 45: `Math.max(1, Math.min(999, i.quantity))` silently clamps quantities
- No error if user tries to order 0 or >999
- **Impact:** User may not realize quantity was changed

**Fix Required:** Return error for invalid quantities instead of clamping

#### 15. `/lib/auth.ts` - Stub User IDs
**Issue:** Hardcoded stub user IDs (`stub-buyer-1`, etc.)
- These IDs may not exist in database
- If code tries to create orders with these IDs, it will fail
- **Impact:** Dev mode may not work if DB doesn't have stub users

**Fix Required:** Ensure stub users exist in DB or create them on first use

---

## Data Flow Issues

### Order Creation Flow
```
CheckoutClient → POST /api/orders → createOrder() → Prisma
```

**Issues:**
1. No validation that cart items still exist/are available
2. No inventory check (`quantityAvailable`)
3. No rollback if order creation partially fails
4. Cart is cleared before confirming order was created successfully (line 75 in CheckoutClient)

**Recommendation:** Add transaction support or at least validate before clearing cart

### Authentication Flow
```
AuthForm → POST /api/auth/dev-login → Sets cookie → Onboarding → POST /api/auth/onboarding → Sets cookie (but not DB)
```

**Issues:**
1. ZIP code not persisted to DB in onboarding
2. Clerk users sync to DB but ZIP defaults to "00000"
3. Dev stub users have hardcoded ZIP "90210"

**Recommendation:** Unify ZIP code persistence across all auth methods

### Review Creation Flow
```
Review Form → createReview() → Checks resolution window → Creates review
```

**Issues:**
1. Resolution window check only works if order has `pickupDate`
2. No validation that order exists before checking resolution window
3. `producerId` logic may be incorrect for CARE reviews

---

## Type Safety Issues

### 1. Missing Type Guards
- `body.items` in `/app/api/orders/route.ts` is cast without validation
- `body.role` in `/app/api/auth/dev-login/route.ts` is checked but type isn't narrowed

### 2. Nullable Types Not Handled
- `productId` in Order can be null, but code assumes it exists in some places
- `pickupDate` is nullable but resolution window logic requires it

### 3. Optional vs Nullable Confusion
- `notes` is `string | null` in schema but `string | undefined` in some functions
- Inconsistent handling of optional fields

---

## Security Concerns

### 1. Authorization Gaps
- `/app/api/orders/[id]/route.ts` checks `producerId` match but doesn't verify user owns the order
- Admin can modify any order, but should this be logged?

### 2. Input Validation
- ZIP codes are validated with regex but not checked against valid ZIP list
- Product prices can be negative (no validation in schema or code)
- Quantity can be negative (clamped but not rejected)

### 3. Error Messages
- Some error messages may leak information (e.g., "Producer not found" vs "Invalid request")
- Consider generic error messages for production

---

## Inconsistencies Between Files

### 1. ZIP Code Handling
- **Dev mode:** Stored in cookie (`__dev_zip`)
- **Clerk mode:** Stored in DB (`User.zipCode`)
- **Onboarding:** Sets cookie but not DB
- **Recommendation:** Always persist to DB, use cookie only for session

### 2. Error Response Format
- Some routes return `{ error: string }`
- Others return `{ ok: true }` or `{ ok: false, error: string }`
- **Recommendation:** Standardize error response format

### 3. Fulfillment Type Defaults
- `createOrder()` defaults to "PICKUP"
- `CheckoutClient` defaults to "PICKUP"
- But no validation that producer offers the selected fulfillment type
- **Recommendation:** Validate fulfillment type against producer profile

---

## Missing Features / Incomplete Implementations

### 1. Stripe Integration
- `initiateCheckout()` is a stub
- No webhook handler for payment confirmation
- `stripeSessionId` field exists but is never set

### 2. Inventory Management
- `quantityAvailable` exists in schema but isn't checked during order creation
- No mechanism to decrement inventory when order is fulfilled

### 3. Order Cancellation
- Status can be set to CANCELED but no business logic around it
- No refund handling for paid orders

### 4. Event Orders
- `eventId` field exists in `CreateOrderInput` but isn't used
- No event order creation flow

---

## Recommendations Summary

### Immediate Fixes (Critical)
1. ✅ Fix onboarding ZIP code persistence
2. ✅ Add error handling to order creation API
3. ✅ Add validation to `createOrder()` function
4. ✅ Fix resolution window logic for orders without pickup dates

### Short-term Fixes (High Priority)
5. ✅ Add status transition validation
6. ✅ Add error handling to delivery fee fetch
7. ✅ Sync ZIP code from Clerk user profile
8. ✅ Validate products exist before creating orders

### Medium-term Improvements
9. ✅ Standardize error response format
10. ✅ Add transaction support for order creation
11. ✅ Add inventory checks
12. ✅ Improve type safety with proper guards

### Long-term Enhancements
13. ✅ Implement Stripe payment flow
14. ✅ Add order cancellation/refund logic
15. ✅ Implement event order flow
16. ✅ Add comprehensive logging/audit trail

---

## Testing Recommendations

### Unit Tests Needed
- `createOrder()` with various input combinations
- `canPublishNegativePublicReview()` edge cases
- Status transition validation
- ZIP code validation and persistence

### Integration Tests Needed
- Full order creation flow (cart → checkout → order)
- Authentication flow (signup → onboarding → dashboard)
- Review creation with resolution window
- Producer profile updates

### E2E Tests Needed
- Complete purchase flow
- Multi-item cart checkout
- Delivery vs pickup selection
- Order status updates

---

## Conclusion

The codebase is generally well-structured but has several critical issues that need immediate attention, particularly around:
1. **Data persistence** (ZIP code not saved to DB)
2. **Error handling** (missing try-catch blocks)
3. **Validation** (missing checks before database operations)

Most issues are fixable with focused refactoring. The architecture is sound, but implementation details need tightening.

**Priority Order:**
1. Fix onboarding ZIP persistence (blocks user onboarding)
2. Add error handling to order API (prevents crashes)
3. Add validation to order creation (prevents invalid data)
4. Fix resolution window logic (affects review system)
5. Add status transition validation (prevents invalid states)
