# CORS Rollout Checklist

**Goal:** Add CORS to API routes that mobile app will call, in order of priority.

---

## Phase 1: Public/Read-Only Endpoints ✅

Add CORS to these first (safe, no auth required):

- [x] `GET /api/listings` ✅ (already done)
- [ ] `GET /api/market/shop/[id]` (if exists)
- [ ] `GET /api/catalog/categories`
- [ ] `GET /api/catalog/custom-categories`
- [ ] `GET /api/care/caregivers`
- [ ] `GET /api/care/caregivers/[id]`
- [ ] `GET /api/reviews/[id]` (public reviews)
- [ ] `GET /api/item-requests` (public)

**Pattern to follow:**
```typescript
import { addCorsHeaders, handleCorsPreflight } from "@/lib/api";

export async function GET(request: NextRequest) {
  // ... existing handler logic ...
  const response = ok(data, requestId);
  return addCorsHeaders(response, request);
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request) || new Response(null, { status: 403 });
}
```

---

## Phase 2: Authenticated Endpoints

Add CORS to routes mobile app will call (requires auth):

- [x] `POST /api/auth/token` ✅ (already done)
- [ ] `GET /api/orders`
- [ ] `POST /api/orders`
- [ ] `PATCH /api/orders/[id]`
- [ ] `GET /api/dashboard/conversations`
- [ ] `POST /api/dashboard/conversations/create`
- [ ] `GET /api/dashboard/conversations/[id]`
- [ ] `POST /api/dashboard/conversations/[id]/messages`
- [ ] `GET /api/products`
- [ ] `POST /api/products`
- [ ] `PATCH /api/products/[id]`
- [ ] `DELETE /api/products/[id]`
- [ ] `GET /api/dashboard/profile`
- [ ] `PATCH /api/dashboard/profile`
- [ ] `GET /api/dashboard/summary`
- [ ] `GET /api/account`
- [ ] `PATCH /api/account`

**Note:** Only add CORS to routes your mobile app actually calls. Don't add blindly.

---

## Testing Each Route

For each route you add CORS to:

1. **Test from browser console (different origin):**
   ```javascript
   fetch('http://localhost:3000/api/listings?zip=90210', {
     headers: { 'Origin': 'http://localhost:8081' }
   })
   .then(r => r.json())
   .then(console.log)
   ```

2. **Check CORS headers in response:**
   - `Access-Control-Allow-Origin` should match your origin
   - `Access-Control-Allow-Methods` should include your method
   - `Access-Control-Allow-Headers` should include `Authorization`

3. **Test OPTIONS preflight:**
   ```javascript
   fetch('http://localhost:3000/api/listings', {
     method: 'OPTIONS',
     headers: { 'Origin': 'http://localhost:8081' }
   })
   .then(r => console.log(r.status)) // Should be 204
   ```

---

## Environment Variables

Set these when ready for mobile:

```bash
# .env.local or Vercel env vars
NEXT_PUBLIC_WEB_URL=https://thelocalyield.com
EXPO_PUBLIC_MOBILE_URL=https://your-expo-app-url.com
```

**For Development:**
- Localhost origins are already allowed
- No env vars needed for local testing

**For Production:**
- Set `EXPO_PUBLIC_MOBILE_URL` to your Expo app URL
- Remove localhost origins (or keep only for staging)
