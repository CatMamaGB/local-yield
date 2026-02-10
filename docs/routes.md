# Route layout (one domain, two experiences)

Exact paths for thelocalyield.com. Deep links map 1:1 to these paths (PWA + mobile app).

## Public website + web app (PWA)

| Path | Purpose |
|------|--------|
| `/` | Brand + “Market” + “Care” (choose your path) |
| `/market` | Market explainer + browse CTA |
| `/market/browse` | Browse (product list) |
| `/market/shop/[id]` | Producer storefront |
| `/care` | Care explainer (waitlist until live) |
| `/care/browse` | Later (browse caregivers) |
| `/care/caregiver/[id]` | Later (caregiver profile) |

## Mobile app

- **Tabs:** Market | Orders | Messages | Profile (+ Care when `NEXT_PUBLIC_ENABLE_CARE=true`)
- **Deep links:** Same paths as above (e.g. `thelocalyield.com/market/shop/123` opens app to that storefront when installed).

## Other routes (unchanged)

- `/auth/login`, `/auth/signup`
- `/dashboard`, `/dashboard/*`
- `/admin/*`
- `/about`
