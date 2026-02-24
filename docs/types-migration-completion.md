# Types Migration Completion Guide

**Goal:** Finish migrating all type imports from `@/types` to `@local-yield/shared/types`.

---

## Step 1: Find All Remaining Imports

Run these commands to find files that still use old imports:

```bash
# Find imports from @/types
grep -r "from [\"']@/types" --include="*.ts" --include="*.tsx" .

# Find imports from types/
grep -r "from [\"']types/" --include="*.ts" --include="*.tsx" .

# Find imports from ../types
grep -r "from [\"']\.\.\/types" --include="*.ts" --include="*.tsx" .
```

**Save output to a file:**
```bash
grep -r "from [\"']@/types" --include="*.ts" --include="*.tsx" . > types-imports.txt
```

---

## Step 2: Update Imports Systematically

### Pattern to Follow

**OLD:**
```typescript
import type { Role } from "@/types";
import type { BrowseListing } from "@/types/listings";
import type { User } from "@/types";
```

**NEW:**
```typescript
import type { Role } from "@local-yield/shared/types";
import type { BrowseListing } from "@local-yield/shared/types/listings";
import type { User } from "@local-yield/shared/types";
```

### Import Mapping

| Old Import | New Import |
|------------|------------|
| `@/types` | `@local-yield/shared/types` |
| `@/types/listings` | `@local-yield/shared/types/listings` |
| `@/types/care` | `@local-yield/shared/types/care` |
| `types/...` | `@local-yield/shared/types/...` |
| `../types/...` | `@local-yield/shared/types/...` |

---

## Step 3: Update Files

Go through each file found in Step 1 and update imports.

**Example:**
```typescript
// Before
import type { Role } from "@/types";
import type { BrowseListing } from "@/types/listings";

// After
import type { Role } from "@local-yield/shared/types";
import type { BrowseListing } from "@local-yield/shared/types/listings";
```

---

## Step 4: Verify

After updating imports:

1. **TypeScript compilation:**
   ```bash
   npm run build
   # or
   npx tsc --noEmit
   ```

2. **Check for errors:**
   - Should compile without errors
   - All type imports should resolve

3. **Runtime test:**
   ```bash
   npm run dev
   # Test that app still works
   ```

---

## Step 5: Add Deprecation Notice

Add to `types/index.ts`:

```typescript
/**
 * @deprecated Use @local-yield/shared/types instead
 * 
 * This directory is kept for backward compatibility only.
 * All new types should go in packages/shared/src/types
 * 
 * Migration status: In progress
 * Last updated: 2026-02-19
 */

// Re-export from shared package for backward compatibility
export * from "@local-yield/shared/types";
export * from "@local-yield/shared/types/listings";
export * from "@local-yield/shared/types/care";
```

This allows gradual migration - old imports still work, but new code should use shared package.

---

## Step 6: Add Lint Rule (Optional)

Add to `.eslintrc.json` or `eslint.config.js`:

```json
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "@/types",
            "message": "Use @local-yield/shared/types instead. See docs/types-migration-completion.md"
          },
          {
            "name": "@/types/listings",
            "message": "Use @local-yield/shared/types/listings instead"
          },
          {
            "name": "@/types/care",
            "message": "Use @local-yield/shared/types/care instead"
          }
        ]
      }
    ]
  }
}
```

This prevents new code from using old imports.

---

## Step 7: Delete `types/` (After Stable)

Once all imports updated and tested for at least 1 week:

1. **Verify no remaining imports:**
   ```bash
   grep -r "from [\"']@/types" --include="*.ts" --include="*.tsx" .
   # Should return nothing
   ```

2. **Delete directory:**
   ```bash
   rm -rf types/
   ```

3. **Update any remaining references:**
   - Check `tsconfig.json` paths (if any)
   - Check documentation

---

## Current Status

**Files Already Updated:**
- ✅ `app/api/listings/route.ts`
- ✅ `lib/auth/server.ts`
- ✅ `lib/auth/types.ts`
- ✅ `components/market/ListingRow.tsx`
- ✅ `components/market/BrowseClient.tsx`
- ✅ `app/api/admin/users/route.ts`

**Files Still Need Update:**
- [ ] Run grep to find remaining files
- [ ] Update systematically
- [ ] Test after each batch

---

## Notes

- **Don't rush:** Update in small batches and test after each batch
- **Keep types/ temporarily:** Re-export from shared package for backward compatibility
- **Test thoroughly:** Make sure runtime works, not just TypeScript compilation
