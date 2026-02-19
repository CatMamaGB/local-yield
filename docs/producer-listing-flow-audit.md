# Producer product listing flow — audit report

**Goal:** Verify the complete producer listing experience (unit, image upload, organic badge, API responses) end-to-end.

**Audit date:** 2026-02-18

---

## 1) Schema + Prisma

| Check | Result | Location |
|-------|--------|----------|
| Product has nullable `unit` column | **PASS** | `prisma/schema.prisma` L221–222: `unit String? @map("unit")` |
| Migration for `unit` exists | **PASS** | `prisma/migrations/20260219041535_add_product_unit/migration.sql`: `ALTER TABLE "Product" ADD COLUMN "unit" TEXT` |
| Prisma create includes `unit` where needed | **PASS** | `app/api/products/route.ts` L75: `...(unit != null ? { unit } : {})` |
| Prisma update includes `unit` where needed | **PASS** | `app/api/products/[id]/route.ts` L87–94: `updates.unit = unitResult.data` |
| GET products uses findMany/findUnique (no select omitting unit) | **PASS** | `app/api/products/route.ts` L18–21 (findMany, full model); `app/api/products/[id]/route.ts` L34–37 (findUnique, full model) |

---

## 2) Validation

| Check | Result | Location |
|-------|--------|----------|
| `ALLOWED_PRODUCT_UNITS` and `ProductUnitSchema` defined | **PASS** | `lib/validators.ts` L331–339 |
| POST `/api/products` validates unit (allowlist or null) | **PASS** | `app/api/products/route.ts` L56–62 (after fix: L58–61 return VALIDATION_ERROR when unit supplied and invalid) |
| PATCH `/api/products/[id]` validates unit | **PASS** | `app/api/products/[id]/route.ts` L87–94 |
| Invalid unit returns `{ ok: false, error, code: "VALIDATION_ERROR", requestId }` | **PASS** | POST L59–60; PATCH L90–91. Response shape uses `fail(..., { code: "VALIDATION_ERROR", requestId })` → `lib/api.ts` L50–58 returns `ok: false`, `error`, `code`, `requestId` |

---

## 3) API wiring

| Check | Result | Location |
|-------|--------|----------|
| GET `/api/products` includes `unit` in returned objects | **PASS** | Full model from `prisma.product.findMany` (no select) — `app/api/products/route.ts` L18–22 |
| `/api/listings` includes `unit` in payload | **PASS** | `app/api/listings/route.ts` L67 Row type, L92 `unit: p.unit ?? null`, L166 `unit: r.unit ?? null` |
| `types/listings.ts` has `unit` on `BrowseListing` | **PASS** | `types/listings.ts` L29–30: `unit?: string \| null` |

---

## 4) UI wiring

| Check | Result | Location |
|-------|--------|----------|
| Unit dropdown in Add form | **PASS** | `app/dashboard/products/ProductsClient.tsx` L403–418 (Quantity + Unit grid), L448–456 (select + PRODUCT_UNIT_OPTIONS) |
| Unit dropdown in Edit form | **PASS** | L707–719 (Quantity + Unit grid, select) |
| Submitted payload includes `unit` (Add) | **PASS** | L339: `unit: unit \|\| undefined` |
| Submitted payload includes `unit` (Edit) | **PASS** | L620: `unit: unit \|\| null` |
| Dashboard product list shows "$X / &lt;unit&gt;" when unit present | **PASS** | L179–181: `$p.price.toFixed(2)` + `p.unit ? \` / ${p.unit}\` : ""` |
| ListingRow shows "$X / &lt;unit&gt;" | **PASS** | `components/market/ListingRow.tsx` L41–44: `formatPrice(listing.price)` + `listing.unit ? \` / ${listing.unit}\` : ""` |
| ProducerProductGrid shows "$X / &lt;unit&gt;" | **PASS** | `components/market/ProducerProductGrid.tsx` L65–68: `formatPrice(p.price)` + `p.unit ? \` / ${p.unit}\` : ""` |

---

## 5) Upload

| Check | Result | Location |
|-------|--------|----------|
| POST `/api/upload/image` exists | **PASS** | `app/api/upload/image/route.ts` |
| Producer/admin only | **PASS** | L16–20: `requireProducerOrAdmin()`, 403 on catch |
| Max 4 MB enforced | **PASS** | L12, L28–29 |
| Allowlisted MIME types | **PASS** | L13, L31–32: image/jpeg, image/png, image/webp, image/gif |
| Success: `{ ok: true, data: { url } }` | **PASS** | L38: `return ok({ url: blob.url })` → `lib/api.ts` ok() → `{ ok: true, data }` |
| Errors: `{ ok: false, error, code, requestId }` | **PASS** | L26, L29, L31, L46–50, L53: `fail(..., { code, requestId })` → response has `error`, `code`, `requestId` |
| UploadPhotoButton calls endpoint, sets imageUrl from returned url | **PASS** | `ProductsClient.tsx` L232–239: fetch POST, `json?.data?.url` → `onUploaded(json.data.url)` |
| Upload errors shown via InlineAlert + requestId | **PASS** | After fix: `onError(msg, requestId)` → `setSubmitError({ message: msg, requestId })`; L355–361 / L638–644 render InlineAlert with message and requestId |
| Upload error message from API: use `error` field | **PASS** | After fix: `onError(json?.error ?? "Upload failed", json?.requestId)` — API returns `error`, not `message` |
| BLOB_READ_WRITE_TOKEN missing → 503 with clear message | **PASS** | `app/api/upload/image/route.ts` L41–50: catch detects config/module errors, returns fail with code SERVICE_UNAVAILABLE, status 503 |

---

## 6) Organic

| Check | Result | Location |
|-------|--------|----------|
| `isOrganic` stored and returned (GET products, GET product by id) | **PASS** | Full model from Prisma; schema L224 |
| `isOrganic` in listings API | **PASS** | `app/api/listings/route.ts` L93, L164 |
| Organic badge in dashboard list | **PASS** | `ProductsClient.tsx` L176–177: `p.isOrganic === true` → green "Organic" pill |
| Organic badge in ListingRow | **PASS** | `ListingRow.tsx` L45–47 |
| Organic badge in ProducerProductGrid | **PASS** | `ProducerProductGrid.tsx` L58–60 |
| Shop page passes `isOrganic` to grid | **PASS** | `app/market/shop/[id]/page.tsx` L123–124: `isOrganic: p.isOrganic ?? null` |

---

## Fixes applied during audit

1. **POST `/api/products` — invalid unit**  
   When the client sends a non-empty invalid `unit` (e.g. `"kg"`), the API now returns `VALIDATION_ERROR` with message and `requestId` instead of silently coercing to null.  
   **File:** `app/api/products/route.ts` (added L58–61).

2. **Upload error handling in ProductsClient**  
   - Use API `error` field: `onError(json?.error ?? "Upload failed", json?.requestId)` so the server message is shown.  
   - Pass `requestId` into `onError` and into `setSubmitError({ message, requestId })` so the InlineAlert displays the request ID.  
   **File:** `app/dashboard/products/ProductsClient.tsx` (UploadPhotoButton signature and body; both Add and Edit form `onError` callbacks).

---

## Doc drift / missing types

- **None.** `docs/routes.md` and `docs/PROJECT-SUMMARY.md` already mention unit, isOrganic, imageUrl, and `POST /api/upload/image`. `BrowseListing` and product types include `unit` and `isOrganic`.

---

## Summary

| Area | Status |
|------|--------|
| Schema + Prisma | **PASS** |
| Validation | **PASS** (after POST unit fix) |
| API wiring | **PASS** |
| UI (unit + organic) | **PASS** |
| Upload (API + client) | **PASS** (after error/requestId fix) |
| Organic | **PASS** |

**Overall: PASS** — Producer listing flow is correct and consistent end-to-end after the two minimal fixes above.
