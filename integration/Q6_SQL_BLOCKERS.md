# Q6 integration SQL blockers (2026-10-12)

**Status: blocked — do not execute `integration/sql/01_*.sql` or `02_*.sql` against any existing database.**

Static review of `integration/sql/02_views_hris.sql` identified these issues:

1. **Wrong schema name.** SQL uses `USE hris_db` and fully qualified `hris_db.*`, while the local database is `elrise_db`. Never globally search/replace and run on production; use reviewed, environment-specific migrations.
2. **Gajiku source compatibility not proven.** The view assumes `gajiku_db.transactions.periode`, `nominal`, `admin_fee`, and `final_approved_at`, plus `gajiku_db.elkyno_employee_tenant_map`. Prior audit found incompatible transaction column assumptions. Inspect actual staging `SHOW CREATE TABLE` / information_schema first.
3. **Loan policy mismatch.** `v_plafon_kasbon` computes a percentage of `Pegawai.gajiPokok`, but the bundled loan policy is based on configurable **pre-kasbon THP or fixed IDR**, accrued by validated attendance, minus outstanding principal and pending reservations. The legacy view must not be treated as the authoritative bundle limit.
4. **Mapping/tenant risk.** `v_kehadiran` and `v_plafon_kasbon` use lowercase email as a join key without verified integration mapping or tenant scoping. Email-only joins across systems are insufficient for multi-tenant correctness.
5. **Definer and privileges.** The SQL assumes `hris_view_reader@localhost` and `gajiku_app@localhost` exist and are correctly restricted. `SQL SECURITY DEFINER` must be reviewed with exact view/table grants; no root definer.
6. **Settlement must be independent of read-only views.** Final-success transactions, cutover boundary, exact period keys, tenant mapping, unique external IDs and idempotency must be verified before payroll deduction.

## Required remediation order

1. Inventory real **staging** schema/column metadata for both Elrise and Gajiku, without copying personal data.
2. Define a single tenant-scoped immutable mapping contract and source-of-truth loan policy; explicitly retire incompatible legacy assumptions.
3. Implement and test environment-specific SQL views with least-privilege accounts and negative cases.
4. Validate end-to-end approval, disbursement, outstanding balance, payroll deduction and settlement replay against disposable fixtures.
5. Keep production integration disabled until evidence is recorded.

This document is a blocker report, not a claim that the SQL views are deployable.
