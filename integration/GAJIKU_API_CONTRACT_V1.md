# Gajiku API contract v1 — staging verification required

This branch adds **strict Elrise-side parser unit tests** for `GET /internal/v1/kasbon`. The expected response shape is:

```json
{"tenant_id":"synthetic-tenant","employee_id":"synthetic-employee","items":[{"transaction_id":"synthetic-tx","period":"2026-10","amount":250000,"admin_fee":5000,"status":"sukses","final_approved_at":"2026-10-10T10:00:00Z"}]}
```

Required: explicit verified tenant ID and employee ID, stable unique transaction ID, YYYY-MM within approved go-live cutoff, final-success status and final-approved timestamp, nonnegative integer fees and positive integer nominal. Any malformed row aborts the entire response; no silent missing-deduction fallback. All values above are synthetic.

## Still blocking production

1. **Gajiku Live has NOT been patched or queried.** Verify this contract against a synthetic Gajiku staging clone and actual Flask routes. This endpoint may not exist in the running Gajiku release.
2. Validate cross-tenant enforcement on Gajiku itself, API authentication/rotation, idempotency, status semantics, reservations and disbursement events.
3. End-to-end HTTP contract negative tests with Gajiku staging; no live credentials or PII in CI.
4. No payroll PAID/settlement until accounting reconciliation, cutover and transactional outbox are proven.
5. `getUnsettledKasbon` now queries Prisma by internal `Pegawai.id` to match `IntegrationEmployeeMap.pegawaiId`; review all future callers to pass the internal ID and server-derived tenant context.
