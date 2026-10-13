# P0 tenant-relational-integrity migration gate

This phase extends defense-in-depth **beyond per-route `clientId` filters** with MySQL 8 composite foreign keys. It does NOT create automatic row-level security (MySQL does not provide that here); every API route must still enforce the acting user's tenant and project scope.

## Enforced relationships

- `Pegawai (clientId, projectId) → Project (clientId, id)`.
- `Attendance (clientId, projectId, pegawaiId) → Pegawai (clientId, projectId, id)`; photo approval remains scoped.
- `User (clientId, pegawaiId)` and assigned Admin Project relation cannot reference a foreign tenant.
- `AttendanceCorrection`, `LeaveRequest`, `LeaveBalance` cannot point to a foreign employee or leave type.
- `PayrollItem` receives required `clientId` matching **both** payroll period and employee.
- `KasbonSettlement` receives required `clientId` matching the payroll item.
- `IntegrationEmployeeMap` receives required `clientId` matching **both** Elrise employee and Gajiku integration connection.
- `IntegrationSettlementOutbox` still contains raw event IDs and does NOT prove an end-to-end PAID flow; no production settlement is authorized by this migration.

## Deployment safety — important

**Never execute migrations on the existing local `elrise_db` or live Gajiku based only on passing CI.**

1. Back up the actual Elrise DB. Reproduce a sanitized clone on an isolated MySQL 8 staging instance.
2. Verify migration history and `prisma migrate status`. If existing `elrise_db` lacks baselined migrations, follow `ELRISE_MYSQL_BASELINE_RUNBOOK.md`; do not run empty-DB baseline statements over populated tables.
3. Review cross-tenant legacy data. The migration begins with a **fail-before-DDL preflight** using an enforced MySQL 8 CHECK. Any known mismatched tenant/project/employee/period stops the migration. Do not auto-fix cross-tenant finance records: reconcile with HR and finance.
4. `PayrollItem.clientId` is backfilled **only** from its linked `PayrollPeriod`, and `KasbonSettlement.clientId` from its parent `PayrollItem`. `IntegrationEmployeeMap.clientId` comes **only** from its integration connection. FK constraints then check they also match the referenced employee.
5. On the isolated clone, test backup restore, `prisma migrate deploy`, FK rejection, HTTP IDOR tests, and record-count/total salary/settlement reconciliation. Rehearse rollback (MySQL DDL is not fully transactional).
6. Seek explicit review before scheduling a controlled **Elrise-only** migration. Never run the deprecated cross-database Gajiku SQL scripts or modify `gajiku_db`.

## Residual risk

- Raw SQL with privileged database credentials can still bypass request-level tenant checks. Do not expose a broad SQL console to tenants.
- Unlinked outbox events and business calculations require additional finance integration gates; no payroll production claims.
- Protect database backups and logs, and separate migration/runtime users later in P1.
