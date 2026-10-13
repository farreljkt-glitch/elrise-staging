-- One-time remediation of attendance auto-approved by the legacy check-in path.
-- Any approval timestamp before/equal to checkout was not a genuine post-checkout review.
-- Existing finance/payroll records MUST be reconciled manually before using these days.
UPDATE `Attendance`
SET `validatedAt` = NULL
WHERE `validatedAt` IS NOT NULL
  AND (
    `checkInAt` IS NULL OR `checkOutAt` IS NULL
    OR `checkOutAt` <= `checkInAt`
    OR `validatedAt` <= `checkOutAt`
  );
