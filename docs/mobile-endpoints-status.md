# Mobile Endpoints Status

**Last Updated:** 2026-02-19  
**Goal:** Track which endpoints are ready for mobile (401/403 + CORS).

---

## ✅ Completed (Ready for Mobile)

### Public Endpoints
- ✅ `GET /api/listings` - CORS ✅ | 401/403 N/A (public)

### Authenticated Endpoints
- ✅ `GET /api/products` - CORS ✅ | 401/403 ✅ | Helper ✅
- ✅ `POST /api/products` - CORS ✅ | 401/403 ✅ | Helper ✅
- ✅ `GET /api/dashboard/conversations` - CORS ✅ | 401/403 ✅ | Helper ✅
- ✅ `POST /api/dashboard/conversations/create` - CORS ✅ | 401/403 ✅ | Helper ✅
- ✅ `GET /api/dashboard/profile` - CORS ✅ | 401/403 ✅ | Helper ✅
- ✅ `PATCH /api/dashboard/profile` - CORS ✅ | 401/403 ✅ | Helper ✅
- ✅ `GET /api/dashboard/summary` - CORS ✅ | 401/403 ✅ (already correct)
- ✅ `GET /api/catalog/categories` - CORS ✅ | 401/403 ✅ | Helper ✅ (Note: Authenticated - returns producer's custom categories)

---

## ⏳ To Do (When Mobile Needs Them)

### High Priority (Phase 3)
- [ ] `GET /api/orders` - Add CORS + 401/403 + Helper
- [ ] `POST /api/orders` - Add CORS + 401/403 + Helper
- [ ] `PATCH /api/orders/[id]` - Add CORS + 401/403 + Helper
- [ ] `GET /api/dashboard/conversations/[id]` - Add CORS + 401/403 + Helper
- [ ] `POST /api/dashboard/conversations/[id]/messages` - Add CORS + 401/403 + Helper

### Medium Priority (Later)
- [ ] `GET /api/dashboard/orders` - Add CORS + 401/403 + Helper
- [ ] `GET /api/dashboard/reviews` - Add CORS + 401/403 + Helper
- [ ] `GET /api/dashboard/events` - Add CORS + 401/403 + Helper
- [ ] `POST /api/dashboard/events` - Add CORS + 401/403 + Helper

---

## Pattern to Follow

**For any protected route mobile will call:**

```typescript
import { addCorsHeaders, handleCorsPreflight } from "@/lib/api";
import { mapAuthErrorToResponse } from "@/lib/auth/error-handler";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  try {
    const user = await requireAuth(); // or requireProducerOrAdmin()
    // ... handler logic ...
    const response = ok(data, requestId);
    return addCorsHeaders(response, request);
  } catch (e) {
    logError("route/GET", e, { requestId });
    const errorResponse = mapAuthErrorToResponse(e, requestId);
    return addCorsHeaders(errorResponse, request);
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}
```

**Rules:**
- ✅ Bad/missing/expired token → 401 (handled by `mapAuthErrorToResponse`)
- ✅ Valid token but wrong capability → 403 (handled by `mapAuthErrorToResponse`)
- ✅ Always wrap response with `addCorsHeaders(response, request)`
- ✅ Always add `OPTIONS` handler for preflight

---

## Helper Function

**`lib/auth/error-handler.ts`** - `mapAuthErrorToResponse(error, requestId)`

- Maps `"Unauthorized"` → 401 + `UNAUTHORIZED`
- Maps `"Forbidden"` → 403 + `FORBIDDEN`
- Other errors → 500 + `INTERNAL_ERROR` (no stack traces)

**Usage:**
```typescript
try {
  const user = await requireProducerOrAdmin();
} catch (e) {
  return mapAuthErrorToResponse(e, requestId);
}
```

---

## Testing Checklist

For each endpoint you add CORS + 401/403 to:

- [ ] Test with valid Clerk JWT → expect 200
- [ ] Test with expired JWT → expect 401
- [ ] Test with invalid JWT → expect 401
- [ ] Test with no token → expect 401
- [ ] Test with buyer token on producer endpoint → expect 403
- [ ] Test OPTIONS preflight → expect 204 with CORS headers
- [ ] Test from different origin (Expo dev) → expect CORS headers present
