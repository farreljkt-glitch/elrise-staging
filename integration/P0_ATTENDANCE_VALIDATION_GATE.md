# P0 Attendance validation cutover

- Employee CHECK_IN stores `validatedAt = NULL` always; CHECK_OUT remains unapproved.
- After complete check-in+check-out, a correctly scoped Admin PT/Project must explicitly approve `HADIR`/`TELAT` via `/api/attendance/review/:id`.
- Invalid GPS during `GPS_ATAU_IP` with verified IP is flagged and **cannot** be approved through the fast-path; use a distinct correction workflow.
- All CHECK_IN updates and CHECK_OUT changes use conditional `updateMany` inside transactions, blocking common races; on duplicate CREATE, MySQL unique index is authoritative.
- Migration `20261013020000_attendance_review_cutover` clears legacy auto approvals where approval happened before checkout or on incomplete records. **No automatic re-approval** or payroll/loan rollup may run until HR reconciles historical data.
- GPS is client-provided and cannot prove physical presence; device integrity remains a product limitation. Photo/selfie and trusted IP are addressed in a separate P0 patch.
- No migration runs on an existing DB without backup, isolated clone drift inspection and DBA review.
