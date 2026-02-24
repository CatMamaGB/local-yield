# Production Safety Review - Token Auth & CORS

**Date:** 2026-02-19  
**Status:** ✅ Fixed | ⚠️ Needs Testing

---

## 1. Token Auth Production Safety ✅ FIXED

### Issues Found & Fixed

#### ❌ **BEFORE (UNSAFE):**
- Tokens were unsigned strings: `clerk:${user.id}`, `dev:${user.id}`
- No signature verification
- No expiration handling
- Anyone could forge tokens

#### ✅ **AFTER (SAFE):**

**For Clerk (Production):**
- Mobile apps use `Clerk.getToken()` → get signed JWT
- API verifies JWT using `clerkClient().authenticateRequest()`
- Clerk handles: signature verification, expiration, revocation
- **No custom token issuance needed** - Clerk owns the token lifecycle

**For Dev Mode:**
- Simple `dev:${userId}` tokens (development only)
- Only work when `NODE_ENV === "development"`
- Never used in production

### Token Endpoint: `/api/auth/token`

**✅ Production-Safe:**
- ✅ Only issues tokens for authenticated users (checks `getCurrentUser()`)
- ✅ For Clerk: Returns auth status, doesn't issue tokens (mobile uses Clerk.getToken())
- ✅ For Dev: Returns `dev:${userId}` token (development only)
- ✅ Response format: `{ ok: true, data: { ... } }` or `{ ok: false, error, code, requestId }`
- ✅ CORS headers included

**Token Verification in `lib/auth/server.ts`:**
- ✅ Verifies Clerk JWT signature via `authenticateRequest()`
- ✅ Checks expiration (handled by Clerk)
- ✅ Loads user from DB using token subject (userId)
- ✅ **CRITICAL:** Always reloads from DB after token verification
- ✅ DB is source of truth for capabilities (token may say "producer" but DB wins)

### How It Works

**Mobile App Flow (Clerk):**
1. User logs in via Clerk SDK
2. Mobile calls `Clerk.getToken()` → gets signed JWT
3. Mobile stores JWT securely (Keychain/Keystore)
4. Mobile sends `Authorization: Bearer <jwt>` in API requests
5. API verifies JWT signature + expiration via Clerk
6. API loads user from DB (ensures capabilities are current)

**Dev Mode Flow:**
1. User logs in via dev-login
2. Mobile calls `POST /api/auth/token` → gets `dev:${userId}`
3. Mobile sends `Authorization: Bearer dev:${userId}` in API requests
4. API checks format + loads user from DB (development only)

---

## 2. CORS Rollout Strategy

### Current Status
- ✅ CORS helpers created (`lib/cors.ts`)
- ✅ Token endpoint has CORS
- ✅ `/api/listings` has CORS (example)
- ⚠️ Other routes need CORS added strategically

### Rollout Plan

#### Phase 1: Public/Read-Only Endpoints (Do First)
These are safe to add CORS to immediately:

```typescript
// Add CORS to these routes:
- GET /api/listings ✅ (already done)
- GET /api/market/shop/[id]
- GET /api/catalog/categories
- GET /api/catalog/custom-categories
- GET /api/care/caregivers
- GET /api/care/caregivers/[id]
- GET /api/reviews/[id] (public reviews)
```

**Pattern:**
```typescript
export async function GET(request: NextRequest) {
  // ... handler logic ...
  const response = ok(data, requestId);
  return addCorsHeaders(response, request);
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}
```

#### Phase 2: Authenticated Endpoints (After Phase 1)
Add CORS to routes mobile app will call:

```typescript
// Authenticated endpoints:
- POST /api/auth/token ✅ (already done)
- GET /api/orders
- POST /api/orders
- PATCH /api/orders/[id]
- GET /api/dashboard/conversations
- POST /api/dashboard/conversations/create
- GET /api/products
- POST /api/products
- PATCH /api/products/[id]
- DELETE /api/products/[id]
```

**Rule:** Only add CORS to routes your mobile app actually calls.

### CORS Configuration

**Current Allowed Origins:**
- `NEXT_PUBLIC_WEB_URL` (production web)
- `EXPO_PUBLIC_MOBILE_URL` (mobile app URL - set when ready)
- `http://localhost:3000` (dev web)
- `http://localhost:8081` (Expo default)
- `http://localhost:19006` (Expo web)

**For Production:**
- Add your Expo app URL to `EXPO_PUBLIC_MOBILE_URL`
- Remove localhost origins (or keep only for staging)

**Security:**
- ✅ Only allows specific origins (no wildcards in production)
- ✅ Credentials allowed (for cookies if needed)
- ✅ Preflight handled correctly

---

## 3. Types Migration Completion Plan

### Current Status
- ✅ Shared package created (`packages/shared`)
- ✅ Types moved to `packages/shared/src/types`
- ✅ Key files updated to use `@local-yield/shared/types`
- ⚠️ Some files still use `@/types` (need to find and update)

### Completion Steps

#### Step 1: Freeze `types/` Directory
**Action:** Add a comment to `types/index.ts`:
```typescript
/**
 * @deprecated Use @local-yield/shared/types instead
 * This directory is kept for backward compatibility only.
 * All new types should go in packages/shared/src/types
 */
```

#### Step 2: Find All Remaining Imports
```bash
# Find all files importing from @/types
grep -r "from [\"']@/types" --include="*.ts" --include="*.tsx"

# Find all files importing from types/
grep -r "from [\"']types/" --include="*.ts" --include="*.tsx"
```

#### Step 3: Update Imports Systematically
**Pattern:**
```typescript
// OLD:
import type { Role } from "@/types";
import type { BrowseListing } from "@/types/listings";

// NEW:
import type { Role } from "@local-yield/shared/types";
import type { BrowseListing } from "@local-yield/shared/types/listings";
```

**Files to Update (found via grep):**
- [ ] Search and update all remaining files
- [ ] Verify TypeScript compiles without errors
- [ ] Test that runtime works correctly

#### Step 4: Add Lint Rule (Optional)
Add to `.eslintrc` or similar:
```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "@/types",
            "message": "Use @local-yield/shared/types instead"
          }
        ]
      }
    ]
  }
}
```

#### Step 5: Delete `types/` (After Stable)
Once all imports updated and tested:
- Delete `types/` directory
- Update any remaining references

---

## 4. Testing Checklist

### Web (Should Still Work)
- [ ] Login/signup still works
- [ ] Onboarding redirect still correct
- [ ] Cookie auth still works everywhere
- [ ] Dashboard loads correctly
- [ ] API calls work without tokens

### Token Auth
- [ ] `POST /api/auth/token` returns 401 when not logged in
- [ ] `POST /api/auth/token` returns auth status when logged in
- [ ] Clerk JWT works on protected endpoint (e.g., `/api/products`)
- [ ] Expired Clerk JWT returns 401 cleanly
- [ ] Dev token works in development mode
- [ ] Dev token rejected in production mode

### CORS
- [ ] `/api/listings` works from different origin (dev)
- [ ] `/api/auth/token` works from different origin (dev)
- [ ] OPTIONS preflight returns 204 with CORS headers
- [ ] Invalid origin returns 403

### Types Migration
- [ ] TypeScript compiles without errors
- [ ] No runtime errors from missing types
- [ ] All imports resolve correctly

---

## 5. Clerk Token Decision ✅

### Decision: Use Clerk Tokens Directly

**Answer:** Mobile apps use Clerk tokens directly, not wrapped tokens.

**Why:**
1. **Clerk owns token lifecycle:**
   - Token issuance (signed JWTs)
   - Token refresh (automatic)
   - Token revocation (when user logs out)
   - Expiration handling

2. **No custom infrastructure needed:**
   - No token database
   - No refresh token logic
   - No revocation tracking
   - No signature management

3. **Security:**
   - Clerk JWTs are cryptographically signed
   - Clerk handles key rotation
   - Clerk validates expiration
   - Clerk validates authorized parties (CSRF protection)

**What This Means:**
- ✅ Mobile apps call `Clerk.getToken()` → get Clerk JWT
- ✅ Mobile sends Clerk JWT in `Authorization: Bearer <jwt>` header
- ✅ API verifies Clerk JWT using `clerkClient().authenticateRequest()`
- ✅ `/api/auth/token` endpoint is mainly for dev mode / auth verification
- ❌ We don't issue our own tokens (for Clerk)

**Dev Mode Exception:**
- Dev mode uses simple `dev:${userId}` tokens
- Only works when `NODE_ENV === "development"`
- Never used in production

---

## Next Steps

1. **Test token auth** (see checklist above)
2. **Add CORS to more routes** (follow rollout strategy)
3. **Complete types migration** (find and update all imports)
4. **Document mobile app integration** (how to use Clerk.getToken())

---

## Files Changed

### Fixed
- `lib/auth/server.ts` - Proper Clerk JWT verification
- `app/api/auth/token/route.ts` - Clarified Clerk vs dev tokens

### Created
- `docs/production-safety-review.md` (this file)
- `docs/token-auth-production-fix.md`
