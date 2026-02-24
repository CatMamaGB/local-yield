# Token Auth Production Safety Fix

## Critical Issues Found

1. **Token endpoint returns unsigned strings** (`clerk:${user.id}`, `dev:${user.id}`)
   - No signature verification
   - No expiration
   - No scoping
   - Anyone can forge tokens

2. **Token verification doesn't verify signatures**
   - Just checks format, doesn't verify authenticity

3. **No expiration handling**
   - Tokens never expire

## Decision: Use Clerk Tokens Directly

**Answer to question:** We should use Clerk tokens directly, not wrap them.

**Why:**
- Clerk handles token issuance, refresh, revocation
- Clerk tokens are signed JWTs with expiration
- No need to maintain our own token infrastructure
- Mobile apps use Clerk SDK → get Clerk JWT → API verifies Clerk JWT

**What this means:**
- `/api/auth/token` endpoint is NOT needed for Clerk (mobile uses Clerk.getToken())
- `/api/auth/token` can remain for dev mode only
- API routes verify Clerk JWTs directly using Clerk's verification API

## Implementation Plan

1. **Remove custom token issuance** (for Clerk)
2. **Add Clerk JWT verification** in `lib/auth/server.ts`
3. **Keep dev tokens** for development (simple, not production)
4. **Update documentation** to clarify mobile should use Clerk.getToken()
