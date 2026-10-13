# Sprint 2 — Elrise-only kasbon intake & non-financial review

## State machine

```text
Employee POST (idempotent) -> PENDING_REVIEW
Admin PT decision REJECT      -> REJECTED        (terminal)
Admin PT decision REVIEW_HOLD -> REVIEWED_HOLD   (terminal until a future explicitly-reviewed finance transition)
```

**REVIEWED_HOLD is not an APPROVED loan.** There is no `APPROVED`, `RESERVED`, `SENT_TO_GAJIKU`, `PAID`, `SETTLED`, or automatic transition in this release. Admin PT can review the request's appropriateness but cannot give financial approval while verified pre-kasbon THP, validated HADIR, Gajiku outstanding/pending reservations, and authenticated Gajiku staging API are missing.

## Data ownership and access

- **Elrise** owns the application, tenant ID, internal employee ID, request ID, integer-IDR request amount, period/cycle snapshot, reason, review record, and audit trail.
- **Gajiku** owns actual kasbon disbursement, balances, transactions, and their final statuses. No network request, write, or transaction is sent to Gajiku in this PR.
- **Karyawan:** may create and list only their own requests. Server derives tenant, employee, current payroll period and WIB date; client cannot set status or reviewer.
- **Admin PT:** may list their PT and mark requests REVIEWED_HOLD or REJECTED. No cross-tenant access.
- **Admin Project / unauthenticated:** cannot submit on behalf of a worker, list loans, or review. No salary/bank details returned.

## Safeguards

- New `KasbonRequest` table and additive Prisma migration, with composite `(clientId, pegawaiId)` FK to `Pegawai`.
- Per-employee idempotency key unique inside each tenant; repeats of the same payload return the existing request. Changed payload reusing a key is rejected.
- Submission requires an enabled BUNDLE tenant, effective policy at payroll-period start, configured YYYY-MM go-live cutover, **monthly** mode, and a tenant-matched Elrise/Gajiku employee mapping (mapping need not be externally verified merely to queue). The Gajiku link can still be DISABLED, because this is only intake.
- Review is one-way with conditional `updateMany` and serialized audit transaction. No approval double-use.
- Preview amount **is not** calculated from base salary. No loan reservation, outstanding look-up, Gajiku API call, payroll deduction, or settlement is made.
- CI checks compile, unit tests, schema drift, migration on empty disposable MySQL, and two-tenant HTTP behavior.

## Deferred gates before money moves (still Sprint 2)

1. Finance-approved pre-kasbon THP snapshot and effective policy, with verified HADIR.
2. Verified tenant/employee mapping, active BUNDLE and Gajiku staging API contract.
3. Outstanding debt and pending reservations in Gajiku, carry-over cutover and weekly/month normalization.
4. Unique idempotent command for final approval, authenticated retries, reconciliation, and failure recovery. No automatic conversion of old REVIEWED_HOLD records.
5. Migration on the user's existing populated `elrise_db` is **not** performed by this PR. Use a sanitized clone, backup and drift audit first.

All current writes are to a **disposable CI MySQL** or future Elrise staging DB. Gajiku Live stays untouched.
