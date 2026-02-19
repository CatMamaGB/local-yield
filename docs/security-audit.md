# npm audit: understanding and safe fixes

**Policy:** Production dependencies must have no **high** or **critical** advisories. Dev-only (ESLint, Prisma CLI) moderate findings are documented and accepted until the next tooling upgrade. Use `npm run audit:ci` in CI to fail only on high/critical.

## What the report means

| Package    | Severity  | What it is        | Where it comes from        | Production? |
|-----------|-----------|-------------------|----------------------------|-------------|
| **ajv**   | moderate  | ReDoS in `$data`  | ESLint → @eslint/eslintrc  | No (dev)    |
| **minimatch** | high | ReDoS in patterns | ESLint, eslint-config-next | No (dev)    |
| **hono**  | moderate  | XSS, cache, IP    | Prisma → @prisma/dev       | No (dev)    |
| **lodash**| moderate  | Prototype pollute | Prisma → chevrotain chain  | No (dev)    |
| **undici**| moderate  | Decompression DoS | @vercel/blob               | **Yes**     |

- **Dev vs production:** Only **@vercel/blob** (and thus **undici**) is in code that runs in production. The rest are **devDependencies** (ESLint, Prisma CLI/tooling) or transitive deps of dev tooling—they run when you lint/build, not when the app serves traffic.
- **Risk in production:** The undici issue (unbounded decompression) can be triggered by malicious HTTP responses when your server makes outbound requests. Our upload route uses `@vercel/blob`, which uses Node fetch/undici. Upgrading `@vercel/blob` to 2.x pulls in a patched undici and is the right fix for production.

## What NOT to do

- **Do not run `npm audit fix --force`.** It would:
  - Downgrade **Prisma** to 6.x (breaking; we use 7.x).
  - Upgrade **ESLint** to 10 (breaking config/plugins).
  - Cause other breaking changes. Only use `--force` if you explicitly plan to handle breakage.

## Safe fixes

### 1. Fix production-relevant: upgrade @vercel/blob

We use Blob only in `app/api/upload/image/route.ts`. The 2.x API for `put()` is compatible.

```bash
npm install @vercel/blob@^2.2.0
```

This resolves the **undici** (and thus @vercel/blob) advisory for production.

### 2. Non-breaking audit fix

```bash
npm audit fix
```

Run without `--force`. It may fix some patches; it will not apply breaking changes. If it reports "no fix available" for some items, that’s expected.

### 3. Dev-only vulnerabilities (optional, low urgency)

- **ESLint / ajv / minimatch:** Fixed in ESLint 10 and newer plugin versions, but upgrading often requires config and plugin updates. Acceptable to leave as-is and re-audit when you next upgrade ESLint.
- **Prisma / hono / lodash:** These live inside Prisma’s dev and codegen tooling. Updating is on Prisma’s release cycle. No action needed unless Prisma publishes a security advisory for your version.

## Applied: override for minimatch only

In `package.json`, an **overrides** entry forces a patched minimatch (fixes the **high**-severity ReDoS in the ESLint chain):

```json
"overrides": {
  "minimatch": ">=10.2.1"
}
```

**Why not ajv?** Forcing `ajv@>=8.18.0` breaks ESLint (API incompatibility with @eslint/eslintrc), so it is not overridden. Remaining findings are **moderate** only: ajv, hono, and lodash in ESLint/Prisma dev tooling. Fixing those would require `npm audit fix --force` (downgrades Prisma / upgrades ESLint) and is not recommended.

## Summary

| Action                         | When / why                          |
|--------------------------------|-------------------------------------|
| Upgrade `@vercel/blob` to ^2.2 | Done; production-relevant           |
| Override for minimatch         | Done; removes all high severity    |
| Run `npm audit fix` (no --force)| Optional; safe patches only         |
| Avoid `npm audit fix --force`   | Would break Prisma / ESLint          |
| Remaining (ajv, hono, lodash)   | Dev-only; wait for tooling updates  |

Re-run `npm audit` after changes. Remaining findings are dev-only (Prisma CLI/codegen) and can be tracked until the next Prisma major upgrade.

---

## Accepted risks (decision log)

| Finding   | Severity | Scope   | Decision |
|-----------|----------|---------|----------|
| ajv       | moderate | Dev (ESLint) | Accept until ESLint 10 upgrade; overriding breaks @eslint/eslintrc. |
| hono      | moderate | Dev (Prisma) | Accept; fix would require Prisma 6.x. Track Prisma release notes. |
| lodash    | moderate | Dev (Prisma) | Accept; same as hono. |

**When to revisit:** (1) Upgrade ESLint to 10 or Prisma to a version that drops vulnerable hono/lodash. (2) If any of these appear in a **production** dependency (e.g. a new package pulls them in), treat as high priority.

---

## CI: enforce no high/critical

Run in CI (e.g. before build or in a security job):

```bash
npm run audit:ci
```

This runs `npm audit --audit-level=high` and exits non-zero only if there is a **high** or **critical** advisory. Moderate dev-only findings do not fail the build. If a high appears (e.g. new prod dependency), fix or override before merging.
