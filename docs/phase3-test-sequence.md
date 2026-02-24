# Phase 3 Test Sequence - Exact Steps

**Goal:** Verify mobile app can call API endpoints correctly.

---

## Prerequisites

- ✅ Expo app created
- ✅ Clerk Expo SDK installed
- ✅ Sign-in screen implemented
- ✅ API client created (uses `getToken()`)

---

## Test Sequence

### Test 1: Public Endpoint (No Token)

**In Expo app:**

```typescript
import { apiGet } from './src/lib/api';

// No token needed for public endpoint
const listings = await apiGet(
  '/api/listings?zip=90210&radius=25',
  async () => null // No token
);

console.log('Listings:', listings);
```

**Expected:**
- ✅ Status: 200
- ✅ Data: `{ ok: true, data: { listings: [...], ... } }`
- ✅ No CORS error in console
- ✅ Response includes CORS headers

**If fails:**
- Check CORS headers in network tab
- Verify origin is allowed
- Check OPTIONS preflight returns 204

---

### Test 2: Protected Endpoint (With Valid Token)

**In Expo app:**

```typescript
import { useAuth } from '@clerk/clerk-expo';
import { apiGet } from './src/lib/api';

const { getToken } = useAuth();

// With valid token
const products = await apiGet('/api/products', getToken);

console.log('Products:', products);
```

**Expected (if user is producer/admin):**
- ✅ Status: 200
- ✅ Data: `{ ok: true, data: { products: [...] } }`

**Expected (if user is buyer without producer capability):**
- ✅ Status: 403
- ✅ Error: `{ ok: false, error: "Forbidden", code: "FORBIDDEN" }`

**Expected (if token missing/invalid/expired):**
- ✅ Status: 401
- ✅ Error: `{ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }`

---

### Test 3: Force Invalid Token

**In Expo app:**

```typescript
import { apiGet, ApiError } from './src/lib/api';

// Send fake token
const fakeToken = async () => 'nope';

try {
  await apiGet('/api/products', fakeToken);
} catch (err) {
  if (err instanceof ApiError) {
    console.log('Status:', err.status); // Should be 401
    console.log('Code:', err.code); // Should be UNAUTHORIZED
    console.log('Message:', err.message);
  }
}
```

**Expected:**
- ✅ Status: 401 (never 500)
- ✅ Code: `UNAUTHORIZED`
- ✅ Error message: "Unauthorized" or similar
- ✅ Request ID present (for debugging)

---

## Debugging Checklist

### If Test 1 Fails (CORS Error)

**Check:**
1. Origin matches `ALLOWED_ORIGINS` in `lib/cors.ts`
2. `EXPO_PUBLIC_MOBILE_URL` is set (if using custom URL)
3. OPTIONS handler returns 204 with CORS headers

**Debug:**
```bash
# Test OPTIONS preflight
curl -X OPTIONS https://your-api.com/api/listings \
  -H "Origin: http://localhost:8081" \
  -v

# Should see:
# Access-Control-Allow-Origin: http://localhost:8081
# Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

### If Test 2 Returns 401 (Should Be 200)

**Check:**
1. Token is being sent: Check network tab → Request Headers → `Authorization: Bearer <token>`
2. Token is valid: Not expired, correct format
3. Clerk is configured: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` set

**Debug:**
```typescript
// Log token (first 20 chars)
const token = await getToken();
console.log('Token:', token?.substring(0, 20) + '...');

// Check token format
console.log('Token length:', token?.length);
// Clerk JWTs are typically 200+ characters
```

### If Test 2 Returns 500 (Should Be 401/403)

**Check:**
1. Server logs (Vercel Dashboard → Logs)
2. Request ID in error response
3. `mapAuthErrorToResponse()` is being used in catch block

**Debug:**
```typescript
try {
  await apiGet('/api/products', getToken);
} catch (err) {
  if (err instanceof ApiError) {
    console.log('Request ID:', err.requestId);
    // Use this to find error in Vercel logs
  }
}
```

### If Test 3 Returns 500 (Should Be 401)

**Check:**
1. `mapAuthErrorToResponse()` handles all errors
2. Token verification doesn't throw unhandled errors
3. Server logs show the actual error

**Fix:**
- Ensure all catch blocks use `mapAuthErrorToResponse()`
- Check `lib/auth/server.ts` token verification doesn't throw

---

## What to Provide When Asking for Help

If tests fail, provide:

1. **Request:**
   ```
   URL: GET /api/products
   Headers: Authorization: Bearer <token>
   Origin: http://localhost:8081
   ```

2. **Response:**
   ```
   Status: 401
   Body: { ok: false, error: "Unauthorized", code: "UNAUTHORIZED", requestId: "abc123" }
   ```

3. **Server Log:**
   ```
   [requestId: abc123] Error: Unauthorized at requireAuth()
   ```

This helps debug quickly without widening CORS or loosening auth.

---

## Success Criteria

All tests pass when:

- ✅ Public endpoint returns 200 with CORS headers
- ✅ Protected endpoint returns 200 with valid token (if authorized)
- ✅ Protected endpoint returns 403 with valid token (if wrong role)
- ✅ Protected endpoint returns 401 with invalid/missing token
- ✅ Invalid token never returns 500
- ✅ All errors include requestId for debugging
