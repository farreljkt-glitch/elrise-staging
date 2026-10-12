# Phase Q6 — MySQL staging integration gate

Status: **NOT VERIFIED**. This document is an execution plan, not evidence of successful integration.

## Safety rules

- Never run `prisma db push`, `prisma migrate reset`, or seed scripts against `gajiku_db` production.
- Use a dedicated disposable MySQL instance or isolated staging schema `elrise_q6_staging`, with separate credentials and backups.
- `DATABASE_URL` must point to the staging schema. Confirm the host and schema **before** any mutating command.
- No real employee identity, salary, bank account, or loan records in staging. Use synthetic fixtures.
- Existing `integration/sql/*.sql` are **not** automatically executed; review each statement and GRANT first.

## Gate 1 — isolated Elrise schema

1. Provision MySQL with a dedicated user restricted to `elrise_q6_staging`.
2. Copy `.env.example` to a local `.env` (never commit secrets); configure `DATABASE_URL` and `AUTH_SECRET`.
3. Verify the target host/schema from the connection string without printing its password.
4. Run:
   ```sh
   npm ci
   npx prisma validate
   npx prisma generate
   npm run typecheck
   npm test
   npm run build
   npx prisma db push
   ```
5. Verify tables, foreign keys, unique constraints, and indexes using MySQL metadata.
6. Exercise create/read/update on synthetic tenants, projects, users, employees and attendance. Confirm tenant A cannot read/write tenant B through the actual HTTP routes.

## Gate 2 — integration contract

- Review `integration/GAJIKU_PATCH.md`, `integration/CUTOVER_KASBON_CHECKLIST.md` and SQL views before applying anything.
- Ensure `v_kehadiran` exposes only validated attendance for mapped, active employees.
- Ensure `v_plafon_kasbon` never exposes raw salary and is restricted to authorized tenant/employee mappings.
- Ensure `v_gajiku_kasbon` matches **actual** Gajiku staging columns and includes only final-success transactions.
- Verify SQL user grants: Gajiku integration account must not have direct SELECT on HRIS salary tables or write access to HRIS.
- Verify behavior when mapping is missing, duplicated, suspended, or database/view is unavailable: fail closed for bundled employees, not fallback to legacy limits.
- Verify monthly cutover `kasbonStartPeriod`, carry-over, idempotent settlement, duplicate transaction IDs, and cross-tenant isolation.
- Weekly `W:` payroll settlement remains blocked until explicitly implemented and tested.

## Gate 3 — evidence required

Record MySQL version, sanitized database/schema names, commands and exit codes, passing test counts, staging view column definitions, GRANT inspection, and negative-case results. Redact all credentials and personal data.

**Exit criteria:** schema, HTTP tenant isolation, view contract, permissions, and settlement scenarios verified on staging. Passing GitHub Actions alone does not satisfy Phase Q6. No production cutover before this gate.
