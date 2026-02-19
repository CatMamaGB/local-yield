# Sign-in and sign-up flows

Auth is **provider-driven** and **deterministic**: when Clerk env vars are set, only Clerk login/signup UI is shown; otherwise only the dev role-picker UI is shown. The two are never shown at the same time.

---

## 1. Is Clerk configured?

- **Yes:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are both set → **Clerk** login/signup pages only.
- **No:** **Dev mode** (cookie-based, `__dev_user` / `__dev_user_id` + `__dev_zip`).

**Optional (local only):** With Clerk configured but **not** in production, you can force the dev UI with `?auth=dev` (e.g. `/auth/login?auth=dev`, `/auth/signup?auth=dev`). In production this query param is ignored and Clerk is always used.

---

## 2. Sign-in flow

### Path: `/auth/login`

| Config   | What renders                    | On submit / after sign-in |
|----------|----------------------------------|----------------------------|
| **Clerk** | `<SignIn />` (Clerk component)  | Clerk signs in → redirect to **`afterSignInUrl`** (e.g. `/auth/onboarding?from=login` or with `next=` for deep link). Sign-up link goes to `/auth/signup`. |
| **Dev**   | `<AuthForm mode="sign-in" />`   | User picks **one role**: BUYER, PRODUCER, or ADMIN (radio). Form submits to **`POST /api/auth/dev-login`** with `{ role }`. |

### Dev sign-in detail

1. **Page:** `app/auth/login/page.tsx` → `AuthForm` with `mode="sign-in"`.
2. **Form:** Single-role radio (BUYER, PRODUCER, ADMIN). Submit calls:
   - **`POST /api/auth/dev-login`**  
     - Body: `{ role: "BUYER" | "PRODUCER" | "ADMIN" }`.
     - **Upserts by stub email** (e.g. `producer@test.localyield.example`) so seed-created users work; syncs role in same transaction. No duplicate-email constraint failure.
     - Sets cookie **`__dev_user_id`** = returned user id (CUID), **`__dev_user`** = role (7 days). Cookie options: path=/, httpOnly, sameSite=lax, secure only in production.
     - Response: `{ redirect }` to `/auth/onboarding?from=login` (or with safe `next=`) if not onboarded, else post-login default. All errors return `{ ok: false, error, code, requestId }`; no raw Prisma leak.
3. **Client:** On success, `router.push(data.redirect)` → **`/auth/onboarding`** (or `/dashboard` if no redirect in body; current API always returns redirect to onboarding).

So: **Dev sign-in → /api/auth/dev-login → set __dev_user_id + __dev_user → redirect to /auth/onboarding** (or `next=` / lastActiveMode / market).

**Cookie/session:** Dev login upserts user by **stub email** (so seed-created users work). It sets `__dev_user_id` (user id) and `__dev_user` (role). `getCurrentUser()` in `lib/auth/server.ts` reads `__dev_user_id` and loads the user from DB; if missing, falls back to `__dev_user` + stub object.

### Redirect consistency

- **Safe `?next=`:** All auth entry points (login, signup) accept `?next=<path>`. Only **safe internal paths** are used (e.g. `/market`, `/dashboard`, `/care`, `/admin` and subpaths). Auth paths and external URLs are rejected.
- **Logged in but not onboarded:** User is always sent to **`/auth/onboarding?next=...`** (or without `next=` if none). After onboarding, the app uses normal redirect logic (requested `next=`, cart, lastActiveMode, or default).

### Error handling (auth UI)

- **AuthForm (sign-in):** On API failure, the form shows an **InlineAlert** (error variant) with the API message and **Request ID** for support. Failed login does not log to the console from the client.

### Dev auth (no Clerk)

- **Login:** `/auth/login` uses the dev role stub (**POST /api/auth/dev-login**). There are no passwords and no password reset flow in dev.
- **Password reset:** Available only when Clerk is enabled (staging/prod).
- **Testing redirects:** Use `/auth/login?next=/dashboard/orders` to verify `next=` behavior and post-login routing.
- **Reset onboarding (dev-only):** Use **POST /api/dev/reset-onboarding** to clear `termsAcceptedAt` and `onboardingCompletedAt` and re-test onboarding. Optional body: `{ "clearZip": true }` to also clear ZIP.
- **Debug (dev-only):** **GET /api/auth/debug** returns `{ currentUser, cookies }` to confirm dev login. **Security:** In production (`NODE_ENV === "production"`) the route always returns **404**. In development it also returns 404 unless **`DEV_DEBUG=true`** is set in the environment (optional extra guard).

### Dev login manual test checklist (5 steps)

1. **Go to** `/auth/login`.
2. **Select** PRODUCER (or BUYER / ADMIN).
3. **Click** “Sign in”.
4. **Confirm** redirect to `/auth/onboarding` or `next=` if provided; no 500. In DevTools → Application → Cookies, confirm `__dev_user_id` and `__dev_user` are set (path `/`, HttpOnly).
5. **Refresh** the page or open `/dashboard` — you should still be logged in. Optional: open **GET /api/auth/debug** in a new tab and confirm `currentUser` is non-null and `cookies.__dev_user_id` is set.

---

## 3. Sign-up flow

### Path: `/auth/signup`

| Config   | What renders                     | On submit / after sign-up |
|----------|-----------------------------------|----------------------------|
| **Clerk** | `<SignUp />` (Clerk component)  | Clerk creates account → redirect to **`afterSignUpUrl="/auth/onboarding"`**. Sign-in link goes to `/auth/login`. |
| **Dev**   | `<AuthForm mode="sign-up" />`    | User picks **multiple roles** (Buyer, Producer, Caregiver, Care Seeker). Form submits to **`POST /api/auth/dev-signup`** with `{ roles }`. |

### Dev sign-up detail

1. **Page:** `app/auth/signup/page.tsx` → `AuthForm` with `mode="sign-up"`.
2. **Form:** `<RoleSelection />` – multi-select (BUYER, PRODUCER, CAREGIVER, CARE_SEEKER). **No ADMIN.** Submit calls:
   - **`POST /api/auth/dev-signup`**  
     - Body: `{ roles: ["BUYER", "PRODUCER", ...] }` (min 1).
     - **Creates new user** in DB (new `cuid`, email `dev-{timestamp}@test.localyield.example`, `zipCode: "00000"`).
     - Sets **`__dev_user_id`** = user id and **`__dev_user`** = primary role (7 days).
     - Response: `{ redirect: "/auth/onboarding" }`.
3. **Client:** On success, `router.push(data.redirect)` → **`/auth/onboarding`**.

So: **Dev sign-up → /api/auth/dev-signup → create user, set __dev_user_id + __dev_user → redirect to /auth/onboarding.**

---

## 4. Onboarding flow (after sign-in or sign-up)

### Path: `/auth/onboarding`

- **Server:** `app/auth/onboarding/page.tsx`
  - Calls `getCurrentUser()`. If **no user** → **redirect `/auth/login`**.
  - If user has **zipCode set and ≠ "00000"** → redirect:
    - **Producer/Admin:** `/dashboard`
    - **Else:** `/market/browse` (listings page; post-login default). **Navbar** “Browse” goes to **`/market`** (hub).
  - Else → render **`<OnboardingClient />`**.

### Onboarding form (Clerk and Dev)

- **Component:** `app/auth/onboarding/OnboardingClient.tsx`
  - **Role selection:** `<RoleSelection />` (multi: Buyer, Producer, Caregiver, Care Seeker); default `["BUYER"]`.
  - **ZIP:** `<ZipCodeInput />` (5-digit).
  - Submit → **`POST /api/auth/onboarding`** with `{ zipCode, roles }`.

### Onboarding API

- **`POST /api/auth/onboarding`**
  - Requires **authenticated user** (Clerk or dev cookie).
  - Body: `{ zipCode: string, roles?: ("BUYER"|"PRODUCER"|"CAREGIVER"|"CARE_SEEKER")[] }`.
  - Updates user: `zipCode`; if `roles` provided, updates `isBuyer`, `isProducer`, `isCaregiver`, `isHomesteadOwner` and primary `role` (never ADMIN).
  - Sets cookie **`__dev_zip`** = zip (when in dev).
  - Returns **`{ redirect }`**: `/dashboard` if producer/admin or isProducer, else `/market/browse`. (Navbar “Browse” links to `/market`; `/market/browse` is the results page.)

Flow: **Onboarding page → OnboardingClient → POST /api/auth/onboarding → set zip (and optionally roles) → redirect to /dashboard or /market/browse.**

---

## 5. Resolving “current user” (session)

- **Clerk:** `getCurrentUser()` uses `auth()` + `currentUser()`, then **`syncClerkUserToDb(clerkId, ...)`** (find or create by `clerkId`, return DB user as `SessionUser`).
- **Dev:**
  1. If cookie **`__dev_user_id`** is set → load **user by id** from DB → return (multi-role dev-signup users).
  2. Else if cookie **`__dev_user`** is set (BUYER | PRODUCER | ADMIN) → return **stub** from `STUB_USERS[role]` (and apply `__dev_zip` if set).
  3. Else → `null` (not signed in).

---

## 5a. Password reset (Clerk only)

When Clerk is configured, the `<SignIn />` UI shows a **“Forgot password?”** link. Clerk handles:

- Email/identity verification
- Sending the reset email or code
- Setting a new password and signing the user back in
- Redirecting back to your app using the same **afterSignInUrl** flow (onboarding + `next=`)

**You do not need a custom reset system in production.** Dev mode uses the role-picker stub (no passwords), so “forgot password” does not apply there.

**Testing:** Password reset must be tested in **staging or production** with Clerk enabled and a real inbox. Use `/auth/login?next=/dashboard/orders` (or another safe path) and confirm after reset the user lands on the intended page.

---

## 5b. Clerk production checklist

Before going live, verify in the **Clerk Dashboard**:

- **Email delivery:** Configure → Email (or Email, SMS). Set delivery method (Clerk SMTP or your provider). Ensure production domain is allowed and reset emails return to your app domain.
- **Redirect allowlist:** Include your app origin and paths: e.g. `https://<your-domain>/auth/login`, `https://<your-domain>/auth/onboarding`, `https://<your-domain>/auth/signup`. This ensures post–sign-in and post–reset flows return to your app.
- **Application URL:** Set to your production origin (e.g. `https://thelocalyield.com`) so Clerk redirects back to your app after reset/sign-in.

---

## 6. Sign-out flow

- **Clerk:** `<SignOutButton />` uses Clerk’s `signOut({ redirectUrl: "/" })`.
- **Dev:** `<SignOutButton />` calls **`POST /api/auth/sign-out`** → client then `router.push("/")` + refresh.

**`POST /api/auth/sign-out`** clears cookies:

- `__dev_user`
- `__dev_user_id`
- `__dev_zip`

(maxAge: 0 so browser removes them.)

---

## 7. Path summary

| Path                 | Clerk config | Result |
|----------------------|-------------|--------|
| `/auth/login`        | Clerk       | Clerk SignIn → after sign-in → `/auth/onboarding` (or `next=`); forgot password via Clerk. |
| `/auth/login`        | Dev         | AuthForm (sign-in) → POST dev-login → set __dev_user → redirect `/auth/onboarding` |
| `/auth/signup`       | Clerk       | Clerk SignUp → after sign-up → `/auth/onboarding` |
| `/auth/signup`       | Dev         | AuthForm (sign-up) → POST dev-signup → set __dev_user_id + __dev_user → redirect `/auth/onboarding` |
| `/auth/onboarding`   | Any         | If no user → `/auth/login`. If zip already set (≠ 00000) → `/dashboard` or `/market/browse`. Else → OnboardingClient → POST onboarding → redirect `/dashboard` or `/market/browse`. |
| Sign-out             | Clerk       | Clerk signOut → redirect `/` |
| Sign-out             | Dev         | POST sign-out → clear __dev_user, __dev_user_id, __dev_zip → client redirect `/` |

---

## 8. File reference

| Purpose              | File(s) |
|----------------------|--------|
| Login page           | `app/auth/login/page.tsx` |
| Signup page          | `app/auth/signup/page.tsx` |
| Onboarding page      | `app/auth/onboarding/page.tsx`, `OnboardingClient.tsx` |
| Dev login API        | `app/api/auth/dev-login/route.ts` |
| Dev signup API       | `app/api/auth/dev-signup/route.ts` |
| Onboarding API       | `app/api/auth/onboarding/route.ts` |
| Sign-out API         | `app/api/auth/sign-out/route.ts` |
| Shared auth form     | `components/AuthForm.tsx` (sign-in: InlineAlert + requestId on API failure; no console errors on failed login) |
| Role selection (multi)| `components/RoleSelection.tsx` |
| Role picker (single) | `components/RolePicker.tsx` |
| Sign-out button      | `components/SignOutButton.tsx` |
| Session / get user   | `lib/auth.ts` (`getCurrentUser`, `syncClerkUserToDb`, stub handling) |
| Error formatting     | `lib/client/error-format.ts` (`formatApiError`) — used by AuthForm and SignupForm |

---

## 9. Manual test checklist (pass before release)

Use this to verify dev auth and error UX end-to-end.

1. **Dev login (no 500):** Visit `/auth/login`. Select PRODUCER, click “Sign in”. Expect: no 500; cookies `__dev_user_id` and `__dev_user` set; redirect to `/auth/onboarding` if not onboarded (or to safe `next=` or default).
2. **Session persists:** After signing in, refresh `/dashboard/products` (or `/dashboard`) — you should stay logged in.
3. **Error UX:** Trigger an invalid request (e.g. send invalid body to dev-login or hit a rate limit). Expect: **InlineAlert** with error message and **Request ID** when present; no `alert()`; no console.error for the failure.
4. **Debug route (dev):** With `DEV_DEBUG=true` in env, **GET /api/auth/debug** returns `{ currentUser, cookies }` (e.g. `cookies.__dev_user_id`). Without `DEV_DEBUG=true`, same route returns 404.
5. **Debug route (production):** Run a production build and request **GET /api/auth/debug** — must return **404**.
