# Phase Q7 — Gajiku integration contract: deployment stop

**Do not run the existing `integration/sql/01_users_grants.sql` or `02_views_hris.sql` against Gajiku Live.** They are historical draft scripts, not reviewed migrations.

## Verified from repository (static audit)

- Local Elrise database is called `elrise_db`; draft SQL creates/uses `hris_db`. Executing as-is could create the wrong schema and grant permissions against it.
- The grants script presumes Gajiku transaction columns `periode`, `nominal`, `admin_fee`, `final_approved_at`. Compatibility has not been established with the running Flask app.
- The legacy limit view calculates `gajiPokok * kasbonPlafonPercent / 100`. The current bundle policy instead supports pre-kasbon THP percentage or fixed IDR, accrued over validated attendance, less outstanding and reservations.
- Employee identity cannot rely on email alone across multiple tenants; require a verified, tenant-scoped mapping and reject ambiguity.
- The draft views have hard-coded MySQL users/hosts and cross-schema privileges. A least-privilege grant review is required before executing any DDL.

## Required Q7 evidence

1. **Metadata only**, collected from an isolated Gajiku staging clone: table names, relevant column names/types, indexes and foreign keys. No real names, salaries, bank accounts, or password material.
2. Confirm whether Gajiku has a stable external transaction ID, employee ID and parent-company tenant ID; define canonical key mapping and fail-closed semantics.
3. Document how Gajiku records final approval, disbursement, cancellation, on-process reservation, fees and period identifiers.
4. Align Elrise payroll deductions to final-success transactions only, cutover boundary `kasbonStartPeriod`, and immutable unique transaction settlement.
5. Implement a separate reviewed migration for `elrise_db` staging only, with environment-bound schema names and minimum required SELECT grants.
6. Exercise negative cases: duplicate email across tenants, missing mapping, disabled bundle, absent attendance, lost DB connection, double disbursement, repeated settlement and pre-cutover loans.

## Safe next action

Continue unit/CI contract tests that do not depend on Gajiku's unverified database columns. Do not deploy integration views or enable bundled loan disbursement until staging metadata and end-to-end tests exist.

**Phase Q6 result:** GitHub Actions MySQL schema smoke and TypeScript/build checks passed. This is not evidence of cross-database compatibility or production readiness.
