# Warm Farmhouse SaaS — UI Audit & Design System

## 1. UI Inconsistencies Found

### Color & palette
- **Mixed neutrals:** Some components use `text-brand/70`, others `text-brand/80`; no single secondary text token.
- **Pure black/white:** `--foreground: #171717` and white cards feel harsh; design system calls for dark brown and warm off-white.
- **Alert colors:** `InlineAlert` uses sky/green/amber/red; not aligned with earthy palette (should use warm tones).
- **Badges:** OrderStatusBadge and admin type badges use blue-100/green-100/amber-100; need soft green/blue/amber from farmhouse palette.
- **Destructive actions:** No consistent terracotta/muted red; some use red-600 or amber.

### Typography
- **Line-height:** Not explicitly increased for “warmth”; body copy could use `leading-relaxed`.
- **Section headings:** Inconsistent size (text-lg vs text-xl); design system asks for “slightly larger” section headings.
- **Font application:** `font-display` and `font-body` exist in Tailwind but not applied consistently to all headings/body.

### Layout & spacing
- **Max-width:** Mix of max-w-3xl, max-w-4xl, max-w-5xl, max-w-6xl; design system specifies max-w-5xl or max-w-6xl.
- **Page vertical rhythm:** Some pages use py-8, others py-12; design system asks for py-10+.
- **Card padding:** SectionCard uses p-4 sm:p-6; some cards use p-6 only; inconsistent.

### Components
- **Buttons:** No shared Button component; mix of `rounded`, `rounded-lg`, `rounded-xl`, `bg-brand`, `border-2 border-brand`.
- **Cards:** SectionCard exists but not used everywhere; some use raw `rounded-xl border border-brand/20 bg-white`.
- **Shadows:** Mix of shadow-sm, shadow-xl; design system asks for shadow-sm or subtle custom.
- **Borders:** Mix of border-brand/10, border-brand/15, border-brand/20, border-brand/30; design system says “soft border-brand/10”.
- **Form fields:** No shared FormField wrapper; labels and inputs styled ad hoc (rounded vs rounded-xl, border-brand/30).
- **Tables:** Some tables in rounded-xl wrapper, some not; thead uses bg-brand-light/50, border-brand/20 — should be consistent.
- **Empty states:** EmptyState exists; action button uses bg-brand (should be olive primary).
- **Loading:** LoadingSkeleton exists; SkeletonBlock available; not used on all list/detail pages.

### Accessibility
- **Focus rings:** Some inputs use focus:ring-2 focus:ring-brand/20; not all interactive elements have visible focus.
- **Labels:** sr-only and block labels present; FormField would standardize label + error.

### Page-specific
- **Landing:** Hero and cards already use brand gradient; central card could be more “breathing” (py-10, rounded-xl).
- **Market browse:** Filter card and table are separate; search input not in same card as location.
- **Care browse:** Filter card and caregiver grid OK; species chips could use shared Badge.
- **Caregiver profile:** Trust section chips (experience, species, tasks) mixed rounded vs rounded-lg.
- **Dashboard:** Metric cards and growth cards consistent; quick actions and admin links use different border styles.
- **Admin:** Tables and flagged-review cards need same card treatment and type badges (MARKET/CARE) from design system.

---

## 2. Components to Standardize

| Component | Purpose | Location / action |
|-----------|---------|-------------------|
| **Button** | Primary, secondary, destructive | New: `components/ui/Button.tsx` |
| **Card** | White bg, rounded-xl, soft shadow, optional header | Refactor: `SectionCard` → align with design system |
| **Badge** | MARKET, CARE, PENDING, FULFILLED, CANCELED, PAID, etc. | New: `components/ui/Badge.tsx` (type + status); refactor OrderStatusBadge to use it |
| **EmptyState** | Title, body, action button | Refactor: warm palette, primary button from design system |
| **SectionHeader** | Section title + optional actions | New: `components/ui/SectionHeader.tsx` or reuse PageHeader with variant |
| **Table** | Wrapper for consistent table styling | Shared class / small wrapper or document in design system |
| **FormField** | Label + input/select/textarea + error | New: `components/ui/FormField.tsx` |
| **PageHeader** | Page title, subtitle, actions | Already exists; ensure typography and spacing |
| **LoadingSkeleton** | List and block skeletons | Refactor: warm palette (brand-light/50, border-brand/10) |
| **InlineAlert** | Info, success, warning, error | Refactor: warm variants (muted green, amber, terracotta) |

---

## 3. Design Tokens (Tailwind + CSS)

- **Background:** Warm off-white `#F7F3EB` (or keep brand-light).
- **Primary (buttons):** Muted olive (e.g. `#5C6B4A` or similar).
- **Destructive:** Soft terracotta (e.g. `#B8735C`).
- **Text:** Primary dark brown (brand); secondary muted warm gray.
- **Badges:** MARKET → soft green; CARE → soft blue; PENDING → amber; FULFILLED → green; CANCELED → muted gray; PAID → blue.

Implementation: extend `tailwind.config.ts` and `app/globals.css` with these tokens; use in new/refactored components.
