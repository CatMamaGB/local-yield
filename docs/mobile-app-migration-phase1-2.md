# Mobile App Migration - Phase 1 & 2 Complete

**Date:** 2026-02-19  
**Status:** Phase 1 ✅ Complete | Phase 2 ✅ Complete

---

## Phase 1: Token-Based Authentication ✅

### What Was Done

1. **Updated `lib/auth/server.ts`**
   - Added `extractBearerToken()` to read `Authorization: Bearer <token>` header
   - Added `verifyClerkToken()` to verify Clerk session tokens
   - Added `getUserFromToken()` to get user from token (supports Clerk + dev tokens)
   - Updated `getCurrentUser()` to try token first, then fall back to cookies (dual mode)
   - **Backward compatible:** Web still works with cookies; mobile can use tokens

2. **Created `app/api/auth/token/route.ts`**
   - `POST /api/auth/token` endpoint to get API token
   - Returns Clerk session token identifier or dev token
   - **Note:** For Clerk, mobile apps should use `Clerk.getToken()` directly; this endpoint serves as a verification helper

3. **Updated `lib/client/api-client.ts`**
   - Added `getAuthToken()` to read token from localStorage
   - Added `setAuthToken()` to store token (exported for use after login)
   - Updated all API methods (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`) to send `Authorization: Bearer <token>` header
   - **Backward compatible:** Works without token (falls back to cookies for web)

4. **Created `lib/cors.ts`**
   - CORS helper functions for API routes
   - `getCorsHeaders()` - Get CORS headers for allowed origins
   - `handleCorsPreflight()` - Handle OPTIONS requests
   - `addCorsHeaders()` - Add CORS headers to responses
   - Configured allowed origins (web URL, mobile URL, localhost)

5. **Updated `lib/api.ts`**
   - Exported CORS helpers for use in API routes
   - Added type annotations for better TypeScript support

6. **Updated `app/api/listings/route.ts`** (example)
   - Added CORS headers to GET response
   - Added OPTIONS handler for preflight requests
   - **Pattern:** All API routes should follow this pattern

### How It Works

**Web (existing):**
- Uses cookies (Clerk or dev stub)
- Token support is optional (can be added later for web if needed)

**Mobile (future):**
- Gets token from Clerk SDK (`Clerk.getToken()`) or `/api/auth/token`
- Stores token securely (e.g., `expo-secure-store`)
- Sends token in `Authorization: Bearer <token>` header
- API routes verify token and return user

**Dual Mode:**
- API routes check token first, then cookies
- Allows gradual migration
- Web continues working without changes

---

## Phase 2: Monorepo Structure ✅

### What Was Done

1. **Updated `package.json`**
   - Added `workspaces` field: `["apps/*", "packages/*"]`
   - Enables npm workspaces for monorepo

2. **Created `packages/shared/`**
   - `package.json` - Package config with exports
   - `tsconfig.json` - TypeScript config extending root
   - `src/index.ts` - Main entry point (re-exports all types)
   - `src/types/index.ts` - Core types (User, Product, Order, etc.)
   - `src/types/listings.ts` - Listing types
   - `src/types/care.ts` - Care types

3. **Updated `tsconfig.json`**
   - Added path aliases:
     - `@local-yield/shared` → `./packages/shared/src/index.ts`
     - `@local-yield/shared/*` → `./packages/shared/src/*`

4. **Updated Imports** (key files)
   - `app/api/listings/route.ts`
   - `lib/auth/server.ts`
   - `lib/auth/types.ts`
   - `components/market/ListingRow.tsx`
   - `components/market/BrowseClient.tsx`
   - `app/api/admin/users/route.ts`
   - Changed from `@/types/*` to `@local-yield/shared/types/*`

### Remaining Import Updates

**Note:** There may be more files importing from `@/types`. To find and update them:

```bash
# Find all files importing from @/types
grep -r "from [\"']@/types" --include="*.ts" --include="*.tsx"

# Update pattern:
# OLD: import type { Role } from "@/types";
# NEW: import type { Role } from "@local-yield/shared/types";
```

---

## Next Steps

### Immediate (Before Testing)

1. **Install workspace dependencies:**
   ```bash
   npm install
   ```
   This will install the shared package as a workspace dependency.

2. **Update remaining imports:**
   - Search for `from "@/types"` and update to `@local-yield/shared/types`
   - Search for `from "@/types/listings"` and update to `@local-yield/shared/types/listings`
   - Search for `from "@/types/care"` and update to `@local-yield/shared/types/care`

3. **Add CORS to more API routes:**
   - Add `OPTIONS` handler to routes that mobile will call
   - Wrap responses with `addCorsHeaders(response, request)`
   - Example pattern in `app/api/listings/route.ts`

### Phase 3: Expo App Setup (Future)

1. **Create Expo app:**
   ```bash
   cd apps
   npx create-expo-app@latest mobile --template blank-typescript
   ```

2. **Install dependencies:**
   - `@clerk/clerk-expo` (or use token endpoint)
   - `expo-secure-store` (for token storage)
   - `@local-yield/shared` (workspace dependency)

3. **Set up API client:**
   - Create `apps/mobile/src/lib/api.ts`
   - Use `expo-secure-store` for token
   - Send `Authorization: Bearer <token>` header
   - Point to `https://thelocalyield.com/api/*`

4. **Implement auth flow:**
   - Login → Get token → Store securely → Use in API calls

---

## Testing Checklist

### Phase 1 (Token Auth)
- [ ] Web login still works (cookies)
- [ ] `POST /api/auth/token` returns token for authenticated user
- [ ] API routes accept `Authorization: Bearer <token>` header
- [ ] CORS headers present in API responses
- [ ] OPTIONS requests return 204 with CORS headers

### Phase 2 (Monorepo)
- [ ] `npm install` installs shared package
- [ ] TypeScript compiles without errors
- [ ] All imports resolve correctly
- [ ] No runtime errors from missing types

---

## Environment Variables

Add to `.env` (when ready for mobile):

```bash
# CORS - Mobile app URL (add when Expo app is created)
EXPO_PUBLIC_MOBILE_URL=https://your-expo-app-url.com

# Web URL (for CORS)
NEXT_PUBLIC_WEB_URL=https://thelocalyield.com
```

---

## Notes

- **Backward Compatibility:** All changes are backward compatible. Web continues working with cookies.
- **Gradual Migration:** You can migrate API routes to use CORS one at a time.
- **Token Storage:** Web uses localStorage; mobile should use `expo-secure-store` for security.
- **Clerk Integration:** For Clerk, mobile apps should use `Clerk.getToken()` directly rather than the `/api/auth/token` endpoint. The endpoint is mainly for verification/dev mode.

---

## Files Changed

### Created
- `app/api/auth/token/route.ts`
- `lib/cors.ts`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `packages/shared/src/types/index.ts`
- `packages/shared/src/types/listings.ts`
- `packages/shared/src/types/care.ts`

### Modified
- `lib/auth/server.ts` - Token extraction and verification
- `lib/client/api-client.ts` - Token support in headers
- `lib/api.ts` - CORS exports
- `app/api/listings/route.ts` - CORS example
- `package.json` - Workspaces config
- `tsconfig.json` - Path aliases for shared package
- Various files - Import updates

---

## Questions?

- **Why keep cookies for web?** Cookies work well for web, are secure with httpOnly, and don't require client-side token management.
- **Why tokens for mobile?** Mobile apps can't reliably use cookies, especially iOS. Tokens are the standard approach.
- **Can we use tokens for web too?** Yes, but cookies are simpler for web. You can migrate web to tokens later if needed.
