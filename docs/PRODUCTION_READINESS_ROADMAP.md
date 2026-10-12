# ELRISE — Production Readiness Roadmap (baseline 2026-10-12)

**Owner:** Elkyno Technology | **Applications:** Elrise Next.js/Prisma/MySQL, Gajiku Live Flask/MySQL | **Mode:** staging-first; never change Gajiku production while developing Elrise.

## Scope & status

Goal: safely release a **multi-tenant HRIS** with Superadmin, Admin PT, Admin Project, and Karyawan, covering employee lifecycle, validated attendance, leave/overtime workflows, payroll/THP, secure payslips, and bundled Gajiku kasbon integration.

- Repository: `farreljkt-glitch/elrise-staging`. Current `main`: Q6–Q10 commits merged; R1 employee POST in PR #8, successful CI but **not yet merged** when this plan was created.
- CI today covers Prisma schema validation, TypeScript, Vitest, Next.js build, and MySQL 8 disposable **schema smoke**. It does **not** cover real HTTP tenant-isolation, transactional rollback, Gajiku interoperability, UAT, or DR.
- Existing Prisma enum `Role` has only `SUPERADMIN`, `ADMIN`, `PEGAWAI`; Admin Project role is still unimplemented.
- Multiple admin/superadmin/employee dashboard, payroll, leave, attendance review, employee create/detail and payslip pages use `MOCK_*` fixtures.
- `lib/integration/settlement-outbox.ts` is an unwired helper; there is no verified end-to-end PAID→settlement acknowledgement flow.
- `prisma/migrations/` has no versioned migration committed; do not use `db push` as production deploy.
- Legacy `integration/sql/01_users_grants.sql` and `02_views_hris.sql` refer to `hris_db` and unverified Gajiku schema assumptions; must not be executed against live systems.
- The previously discussed **85% visual demo / 45% functional demo / 25% production** numbers are qualitative estimates, **not** measured release metrics.

## Definition of DONE for every feature (no exceptions)

1. UI is connected to a documented server endpoint; no mock data or fake-success mutation in production navigation.
2. Authentication, server-side role authorization, tenant/project scope and ownership validation; cross-tenant IDOR negative test passes.
3. Input validation, numeric precision in integer rupiah, explicit errors, and deterministic states; writes are transactional where necessary.
4. State persisted in MySQL and remains correct after application restart; audit log for meaningful mutations without salary/bank leaks.
5. Tests: units and DB/HTTP integration, happy/negative/race cases; passing CI on the PR head **and on main** after merge.
6. Updated migrations, API contract, UX empty/loading/error states, monitoring/logging, rollback and documented acceptance evidence.
7. Acceptance signed by the designated domain owner (HR, finance, Gajiku maintainer) for financial/approval behavior.

## Phase map and implementation sequence

| Phase | Delivery (must have) | Exit gate / acceptance |
| --- | --- | --- |
| **Q (close infrastructure and security gate)** | Merge validated Q10; disposable MySQL integration suite + HTTP session/tenant/project/RBAC/IDOR tests; real transaction rollback/unique replay tests; staging-only Gajiku contract audit and freeze of unsafe legacy SQL. | At least two isolated synthetic tenants verified through actual endpoints, repeat settlement cannot double debit, DB failure never means zero kasbon; CI includes reproducible evidence. **Q not currently closed.** |
| **R (Employee lifecycle)** | Merge R1 after CI; connect add/edit/detail/deactivate/reactivate UI to server DB; pagination/search; CSV preview+commit and Excel conversion if in scope; duplicate/import rollback; invitation/reset, activation and suspension propagation; salary field permissions. | Admin PT creates/imports/edits 100+ synthetic employees; changes survive restart; unauthorized admin/project and other tenant cannot read/modify them; login activation works. |
| **S (Tenancy and RBAC)** | Superadmin CRUD PT/project/subscription `ELRISE_ONLY` or `BUNDLE`; add **ADMIN_PROJECT** and scoped management; actual server endpoints for project assignment, limits, suspension, provision/bundle verification; audit. | Four role matrix exercises allow/deny, cross-tenant/project and employee ownership tests; tenant suspend blocks actions; Gajiku-only tenants unchanged. |
| **T (Attendance + leave + overtime)** | Admin office GPS/IP settings, employee check-in/out/selfie, validated presence, corrections with approval, holidays/timezone and cutoff, Admin Project approval for project staff, Admin PT review; leave and overtime persistence. | Attendance source of truth is MySQL; approval state machine works; no double check-in; cutoff/timezone and invalid GPS/IP cases tested; attendance used by accrual/payroll is approved and period-scoped. |
| **U (Loan ceiling policies)** | Admin PT single/bulk `PERCENT_OF_PRE_KASBON_THP` or `FIXED_IDR` policy; effective-dated revisions; validated attendance prorata per payroll period; pending reservation/outstanding deductions; no salary disclosure to Gajiku. | Exact integer-IDR oracle test for 0, partial, full, capped, month boundary, retroactive revisions and concurrent reservations; no negative available limit. |
| **V (Gajiku contract and reconciliation)** | Verify Gajiku staging schema/API and actual tenant/employee/transaction IDs; documented versioned internal contract, least privilege and authentication; Elrise→Gajiku authorized limit and attendance projection; Gajiku→Elrise success transactions; cutover `kasbonStartPeriod` and settlement history. | Both staging apps interoperable with synthetic tenants; fail closed on missing/ambiguous mapping, down upstream, malformed period, wrong status, duplicate IDs, pre-cutover loans. No migration or SQL runs on live Gajiku. |
| **W (Kasbon workflow ownership)** | Keep application/approval/disbursement/ledger on Gajiku; Admin PT approval handoff/decision as agreed; Elrise enforces authorization boundaries and exposes only authorized loan policy/limit; idempotent callbacks or polling and auditable statuses. | Exactly-once business effect under duplicate/reordered/retried messages; pending reservation reduces available limit; final success alone eligible for payroll deduction. |
| **X (Payroll production engine)** | MySQL payroll DRAFT→REVIEW→LOCKED→PAID workflow; per-tenant cycles A/B/C/D; approved attendance/leave/overtime inputs; THP components incl. PPh21, BPJS, THR as applicable using finance-verified effective-dated tables; immutable item snapshot, payslip, audit; Gajiku deduction + settlement/outbox in same DB transaction as authorization. | Finance signs reconciliation against independent spreadsheets across cycles, exceptions and December/year-end; no negative/duplicate pay, cross-tenant data, or pre-cutover debt; parallel PAID and crash/retry tests pass; evidence for paid proof. |
| **Y (Full QA/UAT/security/operations)** | Automated 2-tenant HTTP E2E, migrations and drift check, MySQL/Gajiku API integration fixtures, performance/load, authorization checks, logs/metrics/alerts, WAF/reverse proxy, backup restore and operational runbook, data retention/privacy. | QA+HR+finance+Gajiku maintainer sign UAT; tested restore to isolated environment; documented RTO/RPO, SLO, rollback dry-run; no unresolved critical/high release blocker. |
| **Z (Pilot → production rollout)** | Shadow payroll on reconciled historical/synthetic data; 1 opted-in pilot tenant, verified cutover balance, feature flags, backup, versioned migrations, monitoring/on-call, progressively activate bundle; rollback and incident response. | Finance approves first payroll reconciliation (preferably 2 consecutive cycles); health and audit reviewed; post-launch issues tracked, no double settlement; explicit go/no-go signoff. |

## Delivery strategy (parallel work, bounded risk)

- **Track A — Functional HRIS:** R→S→T, then X screens and user workflows. R may begin immediately while Q runs.
- **Track B — Security/data/integration:** Q close → U/V/W → X transactional engine → Y. Never launch real Gajiku loans/payroll before Track B exits its gates.
- **Track C — DevOps/QA:** start migrations/staging, backup/restore, CI E2E and telemetry early; finish during Y/Z.
- Keep feature flags: `ELRISE_ONLY` payroll may be exercised in staging with synthetic data before Gajiku bundle, but **never** present it as compliant production payroll until X/Y gates.
- Freeze legacy cross-database view scripts; choose a **single approved API-based contract** or audited restricted views after reviewing the actual Gajiku deployment. Avoid both competing implementations in active use.

## Practical estimates (planning assumptions, not promises)

Assume **2 engineers (frontend/full-stack + backend/integration)** and **part-time QA + domain HR/finance review** with prompt access to a **synthetic Gajiku staging environment**:

| Window | Outcome |
| --- | --- |
| Weeks 1–2 | Q integration test harness, merge/connect R1, real employee create/detail/edit/import/activation; staging environment and migration baseline |
| Weeks 3–5 | Complete R and S, four-role RBAC, tenant/project admin, safe onboarding, functional demo checkpoint |
| Weeks 6–8 | T validated attendance, leave and overtime workflows; U effective-dated loan limit engine |
| Weeks 9–12 | V+W contract and integrated kasbon flows on separate staging systems; begin X payroll implementation |
| Weeks 13–16 | X payroll tax/benefit/THR engine, review/lock/paid, payslips, reconciliation and outbox retries |
| Weeks 17–19 | Y E2E, security, performance, backup/restore, UAT fixes |
| Weeks 20–22+ | Z limited pilot and release gating; production only after audited results and signoff |

If only **one part-time developer** is available, timeframe likely expands substantially. Delayed Gajiku schema/API access, tax-policy decisions or HR/finance signoff can move the dates. **Functional demo** can be targeted around Weeks 3–5; that is *not* a production promise.

## Prioritized first backlog (next 10 PRs)

1. **R1:** Merge PR #8 (CI passed) and connect `/admin/pegawai/tambah` form and active tenant project selection to POST.
2. **Q:** Add transactional MySQL CI test job that creates/updates/rolls back synthetic employees, settlement/outbox records and checks unique keys.
3. **R:** Tenant-scoped `GET/PATCH` employee detail and soft deactivation (deactivate user in same DB transaction).
4. **R:** Replace `MOCK_*` in employee detail and search; add pagination and permission-scoped salary display.
5. **R:** Import CSV Excel-to-CSV strategy, duplicate-case test, account invite/activation/reset tests on DB.
6. **S:** Four-role role matrix and `ADMIN_PROJECT` Prisma migration/endpoint permissions.
7. **S:** Real superadmin tenant/project provisioning endpoints, bundle mode + subscription/connection verification.
8. **T:** Admin attendance list + approval/correction workflow on persisted DB and tenant-scoped routes.
9. **V:** Gajiku staging read-only schema/API contract verification, versioned identifiers, semantic success states.
10. **X:** Payroll DRAFT preview with actual DB data and separate finance-verified calculation reference; no PAID action until settlement tests pass.

## Go/no-go checklist

**Demo visual:** explicitly mark sample data; no claim of real payroll or live Gajiku.
**Demo functional:** seeded synthetic MySQL, role logins, employee create/import/activate, attendance appears in Admin PT, read-only payroll preview; demo rehearsal succeeds without manipulating browser-only state.
**Pilot:** all Q–Y technical gates passed for chosen scope, finance checks sample slips and loans, limited opted-in tenant and rollback tested.
**Production:** all P0/P1 resolved, staging evidence attached to release, migration tested/rollback available, backups restored in drill, monitoring/on-call ready, payroll compliance reviewed, Gajiku signed integration contract, cross-tenant security verified, cutover approved and owner signs go-live.

**Non-negotiable:** code merged and CI green ≠ verified business behavior. Do not push/deploy Gajiku Live changes as part of Elrise development without isolated staging tests, explicit review and maintenance/rollback plan.
