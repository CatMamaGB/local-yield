# Producer listing — next steps (production-grade)

Roadmap for keeping the producer product listing flow high-quality as usage grows. Items already done are marked ✅.

---

## 1) Upload hardening

| Item | Status | Notes |
|------|--------|------|
| Validate MIME and size | ✅ | `POST /api/upload/image`: 4 MB, JPEG/PNG/WebP/GIF |
| Validate file signatures (magic bytes) | ✅ | `lib/upload-image-validation.ts` + upload route |
| Validate image dimensions | ✅ | Reject if any side &lt; 1 or &gt; 4096 px via `image-size` |
| **Strip EXIF metadata** | Later | Use `sharp` or similar before upload; reduces PII and normalizes orientation. Optional. |
| **Prevent orphaned blobs** | Later | Option A: `ImageAsset` table (productId, blobUrl) and cleanup job for unreferenced blobs. Option B: periodic job that lists blobs and deletes those not in any product.imageUrl. |

---

## 2) UX polish

| Item | Status | Notes |
|------|--------|------|
| Thumbnail preview after upload | ✅ | Add/Edit forms show 64×64 preview when `imageUrl` is set |
| Remove / Replace | ✅ | “Remove” clears `imageUrl`; replace = upload again or paste new URL. Placeholder used when empty via `getProductDisplayImage`. |

---

## 3) Category learning

| Item | Status | Notes |
|------|--------|------|
| Deterministic suggestions + manual override | ✅ | `getSuggestionForName` + “Change” link; never auto-change saved products |
| Log suggestion vs chosen | ✅ | `ProductCategorySuggestionLog`: `normalizedTitle`, `suggestedCategoryId`, `chosenCategoryId`, `accepted`. POST/PATCH accept optional `suggestedCategoryId` + `suggestionAccepted` and log when both present. |
| **Build frequency table** | Later | Query `ProductCategorySuggestionLog` grouped by `normalizedTitle`, aggregate `accepted` and `chosenCategoryId` counts. Use only to improve `PRODUCT_NAME_MAPPINGS` or a future suggestion engine. Never auto-update saved products. |

---

## Implementation summary

- **Upload:** Magic bytes and dimension checks are in `app/api/upload/image/route.ts` and `lib/upload-image-validation.ts`. Dependency: `image-size`.
- **UX:** Preview + Remove in `app/dashboard/products/ProductsClient.tsx` (Add and Edit).
- **Category learning:** Table `ProductCategorySuggestionLog`, `lib/product-category-suggestion-log.ts`, and logging from POST/PATCH products when client sends `suggestedCategoryId` and `suggestionAccepted`.

Run `npx prisma migrate dev` to apply the `ProductCategorySuggestionLog` migration, and `npm install` for `image-size`.
