# Sign-in and sign-up flows

Auth is **provider-driven**: when Clerk env vars are set, Clerk handles UI and session; otherwise dev mode uses cookie-based stub auth.

---

## 1. Is Clerk configured?

- **Yes:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are both set.
- **No:** Dev mode (cookie-based, `__dev_user` / `__dev_user_id` + `__dev_zip`).

---

## 2. Sign-in flow

### Path: `/auth/login`

| Config   | What renders                    | On submit / after sign-in |
|----------|----------------------------------|----------------------------|
| **Clerk** | `<SignIn />` (Clerk component)  | Clerk signs in → redirect to **`afterSignInUrl="/dashboard"`**. Sign-up link goes to `/auth/signup`. |
| **Dev**   | `<AuthForm mode="sign-in" />`   | User picks **one role**: BUYER, PRODUCER, or ADMIN (radio). Form submits to **`POST /api/auth/dev-login`** with `{ role }`. |

### Dev sign-in detail

1. **Page:** `app/auth/login/page.tsx` → `AuthForm` with `mode="sign-in"`.
2. **Form:** Single-role radio (BUYER, PRODUCER, ADMIN). Submit calls:
   - **`POST /api/auth/dev-login`**  
     - Body: `{ role: "BUYER" | "PRODUCER" | "ADMIN" }`.
     - Upserts **stub user** in DB (fixed IDs: `stub-buyer-1`, `stub-producer-1`, `stub-admin-1`).
     - Sets cookie **`__dev_user`** = role (7 days).
     - Response: `{ redirect: "/auth/onboarding" }`.
3. **Client:** On success, `router.push(data.redirect)` → **`/auth/onboarding`** (or `/dashboard` if no redirect in body; current API always returns redirect to onboarding).

So: **Dev sign-in → /api/auth/dev-login → set __dev_user → redirect to /auth/onboarding.**

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
    - **Else:** `/market/browse`
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
  - Returns **`{ redirect }`**: `/dashboard` if producer/admin or isProducer, else `/market/browse`.

Flow: **Onboarding page → OnboardingClient → POST /api/auth/onboarding → set zip (and optionally roles) → redirect to /dashboard or /market/browse.**

---

## 5. Resolving “current user” (session)

- **Clerk:** `getCurrentUser()` uses `auth()` + `currentUser()`, then **`syncClerkUserToDb(clerkId, ...)`** (find or create by `clerkId`, return DB user as `SessionUser`).
- **Dev:**
  1. If cookie **`__dev_user_id`** is set → load **user by id** from DB → return (multi-role dev-signup users).
  2. Else if cookie **`__dev_user`** is set (BUYER | PRODUCER | ADMIN) → return **stub** from `STUB_USERS[role]` (and apply `__dev_zip` if set).
  3. Else → `null` (not signed in).

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
| `/auth/login`        | Clerk       | Clerk SignIn → after sign-in → `/dashboard` |
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
| Shared auth form     | `components/AuthForm.tsx` |
| Role selection (multi)| `components/RoleSelection.tsx` |
| Role picker (single) | `components/RolePicker.tsx` |
| Sign-out button      | `components/SignOutButton.tsx` |
| Session / get user   | `lib/auth.ts` (`getCurrentUser`, `syncClerkUserToDb`, stub handling) |
