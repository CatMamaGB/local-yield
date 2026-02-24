# Phase 3 Ready Checklist

**Goal:** Confirm auth and CORS are correct before starting Expo (Phase 3).

---

## Plain-English Summary

1. **You are NOT building your own token system.**  
   Mobile uses Clerk’s JWT directly. Web uses cookies. API verifies Clerk JWT with `authenticateRequest()` and loads user from DB (DB wins).

2. **`/api/auth/token` is not a main endpoint.**  
   It is dev-only: 404 in production. In dev it’s a convenience / health-check. No custom token issuance in prod.

3. **CORS is a controlled rollout.**  
   Only enable it on endpoints the mobile app needs (start with public, then add protected as needed).

4. **Shared types migration has a safe landing.**  
   Keep `types/` as a re-export during migration; move imports to `@local-yield/shared/types` over time.

---

## A) Auth Flow (Protected Routes)

**Intended flow on a protected route (e.g. `/api/products`):**

1. Read `Authorization` header (handled inside `getCurrentUser()`).
2. If Bearer token present → `verifyClerkToken(token)` → `clerkClient().authenticateRequest(request)` (signature + expiry).
3. If no valid session/token → `getCurrentUser()` returns `null` → `requireAuth()` throws `"Unauthorized"` → route returns **401**.
4. Use authenticated userId to load/sync user from DB (in `getUserFromToken` / `syncClerkUserToDb`).
5. Use DB roles/capabilities for authorization (`requireProducerOrAdmin()` etc.); wrong role → **403**.

**What was done:**

- **Products route example:**  
  - `GET/POST /api/products` call `requireProducerOrAdmin()`.  
  - Catch block: if message is `"Unauthorized"` → **401** + `UNAUTHORIZED`; if `"Forbidden"` → **403** + `FORBIDDEN`.  
  - So: expired/invalid JWT → 401; valid user but wrong role → 403.

**Recommendation:** Use the same pattern on other protected routes that catch auth errors: map `"Unauthorized"` → 401, `"Forbidden"` → 403.

---

## B) `/api/auth/token` — Code Guard

**Decision:** Option 1 — dev-only; 404 in production.

**Implementation:**

- At the top of `POST /api/auth/token`:  
  `if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });`
- So in production this route does not exist; no token issuance, no accidental use.
- In development it can still return dev token or auth-echo for health-check.

---

## C) Expo Phase 3 (When Checklist Is Done)

1. Install Clerk Expo SDK.
2. Implement sign-in.
3. After sign-in: call `Clerk.getToken()` and attach to API requests (`Authorization: Bearer <jwt>`).
4. Test:  
   - `/api/listings` (public, with Phase 1 CORS).  
   - Then a protected endpoint (e.g. `/api/products`) with Clerk JWT → expect 200 when authorized, 401 when invalid/expired.

---

## D) Vercel Password Protection (Preview)

- Use existing Basic Auth gate: `APP_GATE_ENABLED`, `APP_GATE_USER`, `APP_GATE_PASS`.
- Enable only for **Preview/Staging** in Vercel (set those env vars for Preview).
- Production stays ungated.
- If `proxy.ts` already implements the gate, you only need the env vars in the Preview environment.

---

## “Are We Done?” Checklist

Before starting Phase 3 (Expo), confirm:

| Check | Status |
|-------|--------|
| Mobile can call `/api/listings` from Expo dev without CORS errors (after Phase 1 CORS rollout) | ⬜ |
| Mobile can call a protected endpoint (e.g. `/api/products`) with Clerk JWT and get 200 | ⬜ |
| Expired/invalid JWT returns **401** (not 500) | ⬜ |
| DB role changes immediately affect permissions even if token exists (DB wins) | ⬜ |
| `/api/auth/token` returns **404** in production | ⬜ |
| Protected routes return 401 for Unauthorized, 403 for Forbidden (products route done; others as you touch them) | ⬜ |

When all are true, you’re ready for Phase 3.

---

## What To Do Next (Concrete)

1. **Confirm `authenticateRequest()` usage**  
   - Flow is: `getCurrentUser()` → `extractBearerToken()` → `verifyClerkToken()` → `authenticateRequest(mockRequest)`.  
   - Then sync/load user from DB and use DB for capabilities.  
   - Sanity-check by calling `/api/products` with a valid Clerk JWT (200), with an expired JWT (401), and with no token (401).

2. **`/api/auth/token`**  
   - Already enforced: 404 in production, dev-only behavior in development.

3. **CORS**  
   - Add CORS only to routes mobile needs (see `docs/cors-rollout-checklist.md`).  
   - Start with `/api/listings` (already done), then other public, then protected as needed.

4. **Expo Phase 3**  
   - Start once the checklist above is verified (CORS for listings, 401/403 behavior, DB wins, token endpoint 404 in prod).

5. **Vercel**  
   - Use existing Basic Auth for Preview; keep production ungated.

---

## Review: What Needs To Be Done

| Item | Status | Action |
|------|--------|--------|
| **A) Auth flow** | ✅ Done | Created `mapAuthErrorToResponse()` helper. Updated: products, dashboard/conversations, dashboard/profile, dashboard/summary, catalog/categories. |
| **B) /api/auth/token** | ✅ Done | Code guard: 404 in production. No further change. |
| **C) Expo Phase 3** | ✅ Ready | Install Clerk Expo → sign-in → Clerk.getToken() → hit /api/listings then /api/products. |
| **D) Vercel preview gate** | Use existing | Set APP_GATE_* only on Preview env; production ungated. |
| **CORS** | ✅ Phase 1 done | Added CORS to: listings, products, dashboard/*, catalog/categories. Add more as mobile needs them. |
| **Types migration** | In progress | Finish imports to @local-yield/shared; keep types/ as re-export until stable. |

---

## Files Touched (This Pass)

### Created
- `lib/auth/error-handler.ts` — Shared helper: `mapAuthErrorToResponse()` for consistent 401/403 handling.
- `docs/mobile-endpoints-status.md` — Status tracker for mobile endpoints (CORS + 401/403).

### Updated (401/403 + CORS)
- `app/api/auth/token/route.ts` — Production guard: 404 in prod.
- `app/api/products/route.ts` — Uses helper + CORS (GET and POST).
- `app/api/dashboard/conversations/route.ts` — Uses helper + CORS.
- `app/api/dashboard/conversations/create/route.ts` — Uses helper + CORS.
- `app/api/dashboard/profile/route.ts` — Uses helper + CORS (GET and PATCH).
- `app/api/dashboard/summary/route.ts` — CORS added (already had correct 401).
- `app/api/catalog/categories/route.ts` — Uses helper + CORS.

**Pattern:** All use `mapAuthErrorToResponse()` + `addCorsHeaders()` + `OPTIONS` handler.
