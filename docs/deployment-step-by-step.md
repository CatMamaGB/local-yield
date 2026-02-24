# Deployment Step-by-Step Guide

**Current Status:** ✅ Code complete, ready to deploy  
**Next:** Test locally → Deploy to Vercel → Build Expo app

---

## ✅ Pre-Deployment Checklist

Before pushing code:

- [x] Token auth implemented (Clerk JWT)
- [x] CORS on mobile endpoints
- [x] 401/403 error handling
- [x] Shared types package
- [x] `/api/auth/token` guarded (404 in production)
- [x] Helper function created (`mapAuthErrorToResponse`)
- [ ] **Test locally** (see Step 1 below)
- [ ] **Fix any linting errors**
- [ ] **Verify TypeScript compiles**

---

## Step 1: Test Locally (Do This First)

### 1.1 Start Dev Server

```bash
npm run dev
```

### 1.2 Test Public Endpoint

```bash
curl http://localhost:3000/api/listings?zip=90210&radius=25
```

**Expected:** 200 with listings data

### 1.3 Test Protected Endpoint (With Dev Token)

1. **Login via web:** Go to `http://localhost:3000/auth/login`
2. **Get dev token:** Check browser console or use:
   ```bash
   curl -X POST http://localhost:3000/api/auth/token \
     -H "Cookie: __dev_user_id=your-user-id"
   ```
3. **Test with token:**
   ```bash
   curl http://localhost:3000/api/products \
     -H "Authorization: Bearer dev:your-user-id"
   ```

**Expected:** 200 if producer, 403 if buyer

### 1.4 Test CORS

```bash
curl -X OPTIONS http://localhost:3000/api/listings \
  -H "Origin: http://localhost:8081" \
  -v
```

**Expected:** 204 with CORS headers:
- `Access-Control-Allow-Origin: http://localhost:8081`
- `Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`

### 1.5 Test Invalid Token

```bash
curl http://localhost:3000/api/products \
  -H "Authorization: Bearer nope"
```

**Expected:** 401 (never 500)

### 1.6 Check Linting & Build

```bash
npm run lint
npm run build
```

**Fix any errors before proceeding.**

---

## Step 2: Commit & Push Code

### 2.1 Review Changes

```bash
git status
git diff
# Review all changes carefully
```

### 2.2 Stage Changes

```bash
git add .
```

### 2.3 Commit

```bash
git commit -m "feat: Add token auth, CORS, and shared types for mobile app

- Add token-based auth support (Clerk JWT + dev tokens)
- Add CORS to mobile endpoints (listings, products, dashboard/*, catalog/categories)
- Create shared types package (@local-yield/shared)
- Add auth error handler (401/403 mapping)
- Guard /api/auth/token (404 in production)
- Update 8 endpoints with consistent error handling"
```

### 2.4 Push to Branch

```bash
# Push to develop branch
git push origin develop

# Or push to main if that's your workflow
git push origin main
```

---

## Step 3: Deploy to Vercel

### 3.1 Connect Repository (If First Time)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. **Import Git Repository** → Select your repo
4. **Framework Preset:** Next.js (auto-detected)
5. **Root Directory:** `./` (or leave default)
6. **Build Command:** `npm run build` (default)
7. **Output Directory:** `.next` (default)
8. **Install Command:** `npm install` (default)

### 3.2 Configure Environment Variables

**Go to:** Project Settings → Environment Variables

**Add these for Production:**

```
DATABASE_URL=your-production-postgres-connection-string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_WEB_URL=https://thelocalyield.com
BLOB_READ_WRITE_TOKEN=vercel_blob_token (if using Vercel Blob)
UPSTASH_REDIS_REST_URL=your-redis-url (if using Redis)
UPSTASH_REDIS_REST_TOKEN=your-redis-token (if using Redis)
```

**Add these for Preview (Staging):**

```
# Same as Production, plus:
APP_GATE_ENABLED=true
APP_GATE_USER=your-username
APP_GATE_PASS=your-password
EXPO_PUBLIC_MOBILE_URL=https://your-expo-app-url.com (when ready)
```

**Add these for Development:**

```
# Same as Preview, plus any dev-only vars
NODE_ENV=development
```

**Important:** Set each variable for the correct environment (Production / Preview / Development).

### 3.3 Deploy

**Option A: Auto-Deploy (Recommended)**
- Vercel auto-deploys when you push to connected branch
- Go to Vercel Dashboard → Deployments → Wait for build

**Option B: Manual Deploy**
1. Go to Vercel Dashboard
2. Click **"Deploy"** → **"Deploy Latest Commit"**
3. Select branch: `develop` (or `main`)
4. Wait for build to complete

### 3.4 Verify Deployment

**Test production endpoints:**

```bash
# Replace with your Vercel URL
YOUR_VERCEL_URL=https://your-app.vercel.app

# Public endpoint
curl $YOUR_VERCEL_URL/api/listings?zip=90210&radius=25

# Protected endpoint (should return 401)
curl $YOUR_VERCEL_URL/api/products

# Token endpoint (should return 404 in production)
curl -X POST $YOUR_VERCEL_URL/api/auth/token
# Expected: 404 Not Found
```

**Check Vercel Logs:**
- Go to Vercel Dashboard → Your Project → Logs
- Verify no errors during build
- Check runtime logs for any issues

---

## Step 4: Set Up Expo App (Phase 3)

### 4.1 Create Expo App

```bash
# In project root
mkdir -p apps
cd apps

# Create Expo app
npx create-expo-app@latest mobile --template blank-typescript

cd mobile
```

### 4.2 Install Dependencies

```bash
# Clerk Expo SDK
npx expo install @clerk/clerk-expo

# Secure storage for tokens
npx expo install expo-secure-store

# Optional: Navigation
npx expo install expo-router
```

### 4.3 Configure Environment

**Create `apps/mobile/.env`:**

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... (or pk_test_... for dev)
EXPO_PUBLIC_API_URL=https://your-vercel-url.vercel.app
```

**Note:** Use your Vercel Preview URL for testing, Production URL for release.

### 4.4 Set Up Clerk

**Create `apps/mobile/lib/auth.ts`:**

```typescript
import * as SecureStore from 'expo-secure-store';
import { TokenCache } from '@clerk/clerk-expo/dist/cache';

export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Handle error
    }
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Handle error
    }
  },
};
```

**Update `apps/mobile/App.tsx`:**

```typescript
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from './lib/auth';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {/* Your app screens */}
    </ClerkProvider>
  );
}
```

### 4.5 Create API Client

**Create `apps/mobile/src/lib/api.ts`:**

```typescript
// Copy from docs/next-steps-guide.md Step 4.4
// Or see: apps/mobile/src/lib/api.ts (create this file)
```

**Key points:**
- Uses `getToken()` from Clerk
- Sends `Authorization: Bearer <token>` header
- Handles API error format: `{ ok: true, data }` / `{ ok: false, error, code, requestId }`

### 4.6 Create Sign-In Screen

**Create `apps/mobile/src/screens/SignIn.tsx`:**

```typescript
// Copy from docs/next-steps-guide.md Step 4.5
// Or see: apps/mobile/src/screens/SignIn.tsx (create this file)
```

---

## Step 5: Test Phase 3 Sequence

### 5.1 Start Expo

```bash
cd apps/mobile
npx expo start
```

**Scan QR code with Expo Go app** (iOS/Android)

### 5.2 Test Sequence

**Follow exact test sequence in `docs/phase3-test-sequence.md`:**

1. **Public endpoint (no token):**
   ```typescript
   const listings = await apiGet('/api/listings?zip=90210&radius=25', async () => null);
   // Expected: 200, no CORS error
   ```

2. **Protected endpoint (with token):**
   ```typescript
   const { getToken } = useAuth();
   const products = await apiGet('/api/products', getToken);
   // Expected: 200 if producer, 403 if buyer, 401 if invalid token
   ```

3. **Force invalid token:**
   ```typescript
   await apiGet('/api/products', async () => 'nope');
   // Expected: 401 (never 500)
   ```

---

## Step 6: Production Checklist

Before going live:

- [ ] All environment variables set in Vercel (Production)
- [ ] Database migrations run on production DB
- [ ] Clerk configured for production domain
- [ ] CORS origins updated (remove localhost, add production URLs)
- [ ] `/api/auth/token` returns 404 in production (tested)
- [ ] Expo app builds successfully (`npx expo build`)
- [ ] Test sign-in flow works
- [ ] Test API calls work from Expo app
- [ ] Test error handling (401, 403, 500)
- [ ] Test CORS from mobile app
- [ ] Test on both iOS and Android

---

## Troubleshooting

### Issue: CORS Error

**Check:**
- Origin matches `ALLOWED_ORIGINS` in `lib/cors.ts`
- `EXPO_PUBLIC_MOBILE_URL` is set correctly
- OPTIONS handler returns 204

**Fix:**
- Add origin to `ALLOWED_ORIGINS`
- Check network tab for actual origin being sent

### Issue: 401 When Should Be 200

**Check:**
- Token is being sent (check network tab)
- Token is valid (not expired)
- Clerk is configured correctly

**Fix:**
- Verify `getToken()` returns valid token
- Check token format (should be JWT, 200+ chars)
- Verify Clerk keys are correct

### Issue: 500 Instead of 401/403

**Check:**
- Server logs (Vercel Dashboard → Logs)
- Request ID in error response
- `mapAuthErrorToResponse()` is used in catch block

**Fix:**
- Add `mapAuthErrorToResponse()` to catch block
- Check `lib/auth/server.ts` doesn't throw unhandled errors

---

## Quick Reference

### Local Development
```bash
npm run dev          # Start Next.js dev server
cd apps/mobile
npx expo start       # Start Expo dev server
```

### Deploy to Vercel
```bash
git push origin develop  # Auto-deploys
# Or manually deploy from Vercel Dashboard
```

### Test Endpoints
```bash
# Public
curl https://your-app.vercel.app/api/listings?zip=90210

# Protected (needs token)
curl https://your-app.vercel.app/api/products \
  -H "Authorization: Bearer <token>"
```

### Build Expo App
```bash
cd apps/mobile
npx expo build:android  # For Android
npx expo build:ios      # For iOS
```

---

## Documentation Reference

- `docs/next-steps-guide.md` - Detailed setup guide
- `docs/phase3-test-sequence.md` - Exact test steps
- `docs/mobile-endpoints-status.md` - Endpoint status
- `docs/phase3-ready-checklist.md` - Complete checklist
- `docs/final-review-summary.md` - Summary of changes

---

## Support

**When asking for help, provide:**

1. **Request:**
   - URL: `GET /api/products`
   - Headers: `Authorization: Bearer <token>`
   - Origin: `http://localhost:8081`

2. **Response:**
   - Status: `401`
   - Body: `{ ok: false, error: "Unauthorized", code: "UNAUTHORIZED", requestId: "abc123" }`

3. **Server Log:**
   - Request ID: `abc123`
   - Error message from Vercel logs

This helps debug quickly without widening CORS or loosening auth.
