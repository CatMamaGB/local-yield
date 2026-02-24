# Next Steps Guide - From Local to Production

**Date:** 2026-02-19  
**Status:** Code ready, deployment steps needed

---

## Overview

You have:
- ✅ Token auth working (Clerk JWT)
- ✅ CORS on mobile endpoints
- ✅ 401/403 error handling
- ✅ Shared types package
- ✅ All code changes complete

**Next:** Test locally → Deploy to Vercel → Build Expo app → Test end-to-end

---

## Step 1: Test Locally (Before Pushing)

### 1.1 Verify Everything Works

```bash
# Start dev server
npm run dev

# In another terminal, test endpoints
```

**Test public endpoint:**
```bash
curl http://localhost:3000/api/listings?zip=90210&radius=25
# Should return 200 with listings
```

**Test protected endpoint (with dev token):**
```bash
# First, login via web to get dev token
# Then:
curl http://localhost:3000/api/products \
  -H "Authorization: Bearer dev:your-user-id"
# Should return 200 with products (if producer)
```

**Test CORS:**
```bash
curl -X OPTIONS http://localhost:3000/api/listings \
  -H "Origin: http://localhost:8081" \
  -v
# Should return 204 with CORS headers
```

### 1.2 Check for Linting Errors

```bash
npm run lint
# Fix any errors before pushing
```

### 1.3 Verify TypeScript Compiles

```bash
npm run build
# Should compile without errors
```

### 1.4 Test Auth Flow

1. **Login via web** (`/auth/login`)
2. **Check token endpoint** (dev mode):
   ```bash
   curl -X POST http://localhost:3000/api/auth/token \
     -H "Cookie: __dev_user_id=your-user-id"
   # Should return dev token
   ```
3. **Use token on protected endpoint:**
   ```bash
   curl http://localhost:3000/api/products \
     -H "Authorization: Bearer dev:your-user-id"
   # Should return 200
   ```

---

## Step 2: Commit & Push to Git

### 2.1 Review Changes

```bash
git status
git diff
# Review all changes
```

### 2.2 Commit

```bash
git add .
git commit -m "feat: Add token auth, CORS, and shared types for mobile app

- Add token-based auth support (Clerk JWT + dev tokens)
- Add CORS to mobile endpoints
- Create shared types package (@local-yield/shared)
- Add auth error handler (401/403 mapping)
- Guard /api/auth/token (404 in production)
- Update mobile endpoints: products, dashboard/*, catalog/categories"
```

### 2.3 Push to Branch

```bash
# Push to develop branch (or your feature branch)
git push origin develop
```

---

## Step 3: Deploy to Vercel

### 3.1 Connect Repository (If Not Already)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Select branch: `develop` (or `main`)

### 3.2 Configure Environment Variables

**In Vercel Project Settings → Environment Variables:**

**Production:**
```
DATABASE_URL=your-production-postgres-url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
CLERK_SECRET_KEY=your-clerk-secret
NEXT_PUBLIC_WEB_URL=https://thelocalyield.com
# Add other production env vars
```

**Preview (Staging):**
```
# Same as production, plus:
APP_GATE_ENABLED=true
APP_GATE_USER=your-username
APP_GATE_PASS=your-password
EXPO_PUBLIC_MOBILE_URL=https://your-expo-app-url.com
```

**Development:**
```
# Same as preview, plus any dev-only vars
```

### 3.3 Deploy

Vercel will auto-deploy when you push. Or manually:

1. Go to Vercel Dashboard
2. Click "Deploy" → "Deploy Latest Commit"
3. Wait for build to complete

### 3.4 Verify Deployment

**Test production endpoints:**

```bash
# Public endpoint
curl https://your-vercel-url.vercel.app/api/listings?zip=90210&radius=25

# Protected endpoint (should return 401 without token)
curl https://your-vercel-url.vercel.app/api/products

# Token endpoint (should return 404 in production)
curl -X POST https://your-vercel-url.vercel.app/api/auth/token
# Should return 404
```

---

## Step 4: Set Up Expo App (Phase 3)

### 4.1 Create Expo App

```bash
# In your project root (or create apps/ directory)
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

# Navigation (if needed)
npx expo install expo-router

# Or use React Navigation
npx expo install @react-navigation/native
```

### 4.3 Configure Clerk

**Create `apps/mobile/.env`:**
```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
EXPO_PUBLIC_API_URL=https://your-vercel-url.vercel.app
```

**Wrap app with ClerkProvider:**

```typescript
// apps/mobile/App.tsx
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from './lib/auth';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {/* Your app */}
    </ClerkProvider>
  );
}
```

**Create token cache:**

```typescript
// apps/mobile/lib/auth.ts
import * as SecureStore from 'expo-secure-store';
import { TokenCache } from '@clerk/clerk-expo/dist/cache';

export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      // Handle error
    }
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      // Handle error
    }
  },
};
```

### 4.4 Create API Client

```typescript
// apps/mobile/src/lib/api.ts
import { useAuth } from '@clerk/clerk-expo';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://thelocalyield.com';

export class ApiError extends Error {
  code?: string;
  status?: number;
  requestId?: string;

  constructor(
    message: string,
    opts?: { code?: string; status?: number; requestId?: string }
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = opts?.code;
    this.status = opts?.status;
    this.requestId = opts?.requestId;
  }
}

type ApiJson =
  | { ok: true; data: unknown }
  | { ok: false; error: string | { code: string; message: string }; code?: string; requestId?: string };

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new ApiError('Invalid response from server', { status: res.status });
  }

  const json: unknown = await res.json();
  if (!isApiJson(json)) {
    throw new ApiError('Invalid response from server', { status: res.status });
  }

  if (json.ok === true) {
    return json.data as T;
  }

  const { error, code, requestId } = json;
  const isStructured = typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  const message = isStructured ? error.message : typeof error === 'string' ? error : 'Something went wrong';
  const errorCode = isStructured ? error.code : code;

  throw new ApiError(message, {
    code: errorCode,
    status: res.status,
    requestId,
  });
}

function isApiJson(value: unknown): value is ApiJson {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof (value as ApiJson).ok === 'boolean'
  );
}

export async function apiGet<T>(url: string, getToken: () => Promise<string | null>): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'GET',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
  return parseResponse<T>(res);
}

export async function apiPost<T>(
  url: string,
  body: unknown,
  getToken: () => Promise<string | null>
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}
```

### 4.5 Create Sign-In Screen

```typescript
// apps/mobile/src/screens/SignIn.tsx
import { useSignIn } from '@clerk/clerk-expo';
import { useState } from 'react';
import { View, TextInput, Button } from 'react-native';

export function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // Navigate to home
      }
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      <Button title="Sign In" onPress={onSignInPress} />
    </View>
  );
}
```

---

## Step 5: Test Phase 3 Sequence

### 5.1 Test Public Endpoint (No Token)

```typescript
// In your Expo app
import { apiGet } from './src/lib/api';

// No token needed
const listings = await apiGet('/api/listings?zip=90210&radius=25', async () => null);
console.log('Listings:', listings);
// Should return 200 with listings
// Check: No CORS error in console
```

### 5.2 Test Protected Endpoint (With Token)

```typescript
import { useAuth } from '@clerk/clerk-expo';
import { apiGet } from './src/lib/api';

const { getToken } = useAuth();

// With token
const products = await apiGet('/api/products', getToken);
console.log('Products:', products);
// Should return:
// - 200 if user is producer/admin
// - 403 if user is buyer without producer capability
// - 401 if token missing/invalid/expired
```

### 5.3 Force Invalid Token Test

```typescript
// Send fake token
const fakeToken = async () => 'nope';
try {
  await apiGet('/api/products', fakeToken);
} catch (err) {
  if (err instanceof ApiError) {
    console.log('Status:', err.status); // Should be 401
    console.log('Code:', err.code); // Should be UNAUTHORIZED
  }
}
// Expect: 401 (never 500)
```

---

## Step 6: Debugging Guide

### If You Get CORS Errors

**Check:**
1. Origin is in `ALLOWED_ORIGINS` in `lib/cors.ts`
2. `EXPO_PUBLIC_MOBILE_URL` is set correctly
3. OPTIONS handler returns 204 with CORS headers

**Debug:**
```bash
# Check CORS headers
curl -X OPTIONS https://your-api.com/api/listings \
  -H "Origin: http://localhost:8081" \
  -v
# Should see Access-Control-Allow-Origin header
```

### If You Get 401 Errors

**Check:**
1. Token is being sent: `Authorization: Bearer <token>`
2. Token is valid (not expired)
3. Clerk is configured correctly

**Debug:**
```typescript
// Log token
const token = await getToken();
console.log('Token:', token?.substring(0, 20) + '...');

// Check token in request
const res = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
console.log('Response status:', res.status);
```

### If You Get 500 Errors

**Check:**
1. Server logs (Vercel logs)
2. Request ID in error response
3. Check `lib/auth/server.ts` token verification

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

---

## Step 7: Production Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Database migrations run on production DB
- [ ] Clerk configured for production domain
- [ ] CORS origins updated (remove localhost)
- [ ] `/api/auth/token` returns 404 in production (tested)
- [ ] Expo app builds successfully
- [ ] Test sign-in flow works
- [ ] Test API calls work from Expo app
- [ ] Test error handling (401, 403, 500)
- [ ] Test CORS from mobile app

---

## Quick Reference

### Local Testing
```bash
npm run dev
# Test endpoints at http://localhost:3000/api/*
```

### Deploy to Vercel
```bash
git push origin develop
# Vercel auto-deploys
```

### Expo Development
```bash
cd apps/mobile
npx expo start
# Scan QR code with Expo Go app
```

### Production URLs
- **Web:** `https://thelocalyield.com`
- **API:** `https://thelocalyield.com/api/*`
- **Mobile:** Set `EXPO_PUBLIC_API_URL` to web URL

---

## Support

If you hit issues:

1. **Check server logs** (Vercel Dashboard → Logs)
2. **Check request ID** in error response
3. **Test endpoint directly** with curl/Postman
4. **Verify CORS headers** in network tab
5. **Check token** is valid and not expired

**When asking for help, provide:**
- Request URL + headers
- Response status + body
- Server log line with requestId
