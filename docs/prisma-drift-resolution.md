# Prisma Migration Drift Resolution

This document describes how to detect and resolve **migration drift**: when the database schema and your Prisma schema (or migration history) are out of sync. **Do not run destructive commands on production without backups and a clear rollback plan.**

---

## 1. Check status

### See if migrations are in sync

```bash
npx prisma migrate status
```

- **"Database schema is up to date"** — No drift; you're good.
- **"Pending migrations"** — Migrations exist in repo that haven’t been applied to the DB.
- **"Drift detected"** — DB has changes that don’t match the migration history (e.g. manual SQL or a different branch applied migrations).

### Compare DB to Prisma schema (no changes applied)

```bash
npx prisma db pull
```

This updates a **temporary** `schema.prisma` from the current database. **Do not overwrite your real `prisma/schema.prisma`** unless you intend to make the DB the source of truth (Option A below). Use it to:

- Inspect what the DB actually has (e.g. write the result to `prisma/schema-from-db.prisma` and diff).
- Confirm whether the DB has extra tables/columns or is missing ones from your repo schema.

### Optional: diff schema file vs DB

After `prisma db pull` you can diff the pulled schema against your repo schema to see exactly what differs.

---

## 2. Two safe resolution options

Choose **one** of these based on **source of truth**:

- **Option A** — Database is source of truth (e.g. DB was changed manually or by another tool).
- **Option B** — Repo (Prisma schema + migrations) is source of truth and the DB should match it.

---

## Option A: Database is source of truth (baseline migrations)

Use when the **current database** is correct and you want the migration history to reflect it without changing the DB.

### Steps

1. **Back up the database** (e.g. pg_dump, or your provider’s backup).

2. **Ensure your repo `prisma/schema.prisma` matches the DB.**  
   - Run `npx prisma db pull` and either:
     - Replace `prisma/schema.prisma` with the result, or
     - Manually align `schema.prisma` to the DB (add/remove models/fields until `prisma validate` and your app are happy).

3. **Baseline the migration history** so Prisma treats the current DB as “already migrated”:

   ```bash
   npx prisma migrate resolve --applied "<migration_name>"
   ```

   Use the **name of the latest migration** that corresponds to the current DB state (the folder name under `prisma/migrations/`). If you have multiple pending migrations, resolve from oldest to newest:

   ```bash
   npx prisma migrate resolve --applied "20240101000000_init"
   npx prisma migrate resolve --applied "20240212000000_add_indexes"
   ```

   **Only use `--applied`** for migrations that are already reflected in the DB. Marking a migration as applied when the DB doesn’t have those changes will cause drift or errors later.

4. **Verify:**

   ```bash
   npx prisma migrate status
   ```

   Should report database schema is up to date.

### When to use

- DB was changed outside Prisma (manual SQL, another app, or an old deployment).
- You want to keep the DB as-is and only fix the migration history.

### Warnings

- **Data loss:** Option A does not change the DB; it only updates migration state. The main risk is marking a migration as `--applied` when the DB doesn’t actually have those changes — then future migrations may fail or conflict.
- Do **not** run `prisma migrate reset` in production (it drops the database).

---

## Option B: Repo is source of truth (reconcile DB to repo)

Use when **Prisma schema and migrations in the repo** are correct and the DB should be updated to match.

### Steps

1. **Back up the database.**

2. **If there are pending migrations**, apply them:

   ```bash
   npx prisma migrate deploy
   ```

   This applies all pending migrations in order. It does **not** reset the DB.

3. **If you still have drift** (e.g. DB has extra columns/tables not in migrations, or migrations failed partway):

   - **Development:** You can reset the DB and re-apply all migrations (destructive):

     ```bash
     npx prisma migrate reset
     ```

     This **drops the database**, recreates it, and runs all migrations from scratch. **Only use on local/dev.** Do not use in production.

   - **Production:** Do **not** use `migrate reset`. Instead:
     - Fix the DB manually (e.g. run SQL to add/remove columns so the DB matches what the last migration expects), or
     - Add a new migration that makes the DB match the schema:

       ```bash
       npx prisma migrate dev --name fix_drift
       ```

       Use this only in a **dev** environment where you can afford to resolve conflicts. Then deploy the new migration and run `prisma migrate deploy` in production.

4. **Verify:**

   ```bash
   npx prisma migrate status
   npx prisma db pull
   ```

   Then diff the pulled schema (or a copy of it) with your repo `schema.prisma` to confirm they align.

### When to use

- Repo schema and migrations are authoritative.
- You want the DB to match the repo (apply pending migrations or fix drift with a new migration).

### Warnings

- **Data loss:** `prisma migrate reset` **drops the database**. Use only in development.
- **Production:** Never run `migrate reset` in production. Use `migrate deploy` and, if needed, manual SQL or a new migration to fix drift.

---

## 3. Exact commands reference

| Goal | Command |
|------|--------|
| Check migration vs DB | `npx prisma migrate status` |
| Pull schema from DB (inspect only) | `npx prisma db pull` (then diff, don’t overwrite repo schema unless doing Option A) |
| Apply pending migrations (safe in prod) | `npx prisma migrate deploy` |
| Mark migration as already applied (Option A) | `npx prisma migrate resolve --applied "<migration_name>"` |
| Reset DB and re-apply all migrations (dev only) | `npx prisma migrate reset` |
| Create new migration from schema (dev) | `npx prisma migrate dev --name <name>` |

---

## 4. Summary

- **Drift** = DB and migration history (or schema) don’t match.
- **Option A (DB as source of truth):** Align repo schema to DB, then `migrate resolve --applied` for the migrations that are already in the DB. No DB changes.
- **Option B (Repo as source of truth):** Use `migrate deploy` to apply pending migrations; in dev you can use `migrate reset`; in production fix drift with manual SQL or a new migration, never with reset.
- Always **back up** before resolving drift in production.
- **Never** run `prisma migrate reset` in production.
