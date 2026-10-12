-- Phase Q6: read-only preflight for a LOCAL/STAGING Elrise database.
-- Run with mysql CLI connected to the intended local database (e.g. elrise_db).
-- No USE statement, INSERT, UPDATE, DELETE, DDL, or production references.
-- Review DATABASE_URL target separately before running any Prisma mutation.
SELECT DATABASE() AS connected_schema, @@hostname AS mysql_host, VERSION() AS mysql_version;

-- Expected core tables; missing rows indicate schema not yet provisioned.
SELECT expected.table_name,
       CASE WHEN actual.table_name IS NULL THEN 'MISSING' ELSE 'PRESENT' END AS state
FROM (
  SELECT 'Client' AS table_name UNION ALL
  SELECT 'ClientSetting' UNION ALL
  SELECT 'Project' UNION ALL
  SELECT 'User' UNION ALL
  SELECT 'Pegawai' UNION ALL
  SELECT 'Attendance' UNION ALL
  SELECT 'PayrollPeriod' UNION ALL
  SELECT 'PayrollItem' UNION ALL
  SELECT 'KasbonSettlement' UNION ALL
  SELECT 'IntegrationConnection' UNION ALL
  SELECT 'IntegrationEmployeeMap' UNION ALL
  SELECT 'BundleLoanPolicy'
) expected
LEFT JOIN information_schema.tables actual
  ON actual.table_schema = DATABASE() AND actual.table_name = expected.table_name
ORDER BY expected.table_name;

-- Inspect FK and unique constraints without accessing business rows.
SELECT table_name, constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = DATABASE()
  AND constraint_type IN ('FOREIGN KEY','UNIQUE')
ORDER BY table_name, constraint_type, constraint_name;

-- View metadata only: views may intentionally not exist before Gajiku integration.
SELECT table_name AS integration_view, security_type, definer
FROM information_schema.views
WHERE table_schema = DATABASE()
  AND table_name IN ('v_kehadiran','v_plafon_kasbon','v_gajiku_kasbon')
ORDER BY table_name;

-- Check that any salary-bearing column is absent from the integration views.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name IN ('v_kehadiran','v_plafon_kasbon','v_gajiku_kasbon')
  AND (
    LOWER(column_name) LIKE '%gaji%'
    OR LOWER(column_name) LIKE '%salary%'
    OR LOWER(column_name) LIKE '%thp%'
    OR LOWER(column_name) LIKE '%rekening%'
  )
ORDER BY table_name, column_name;
-- Last query should be EMPTY; independently inspect view definitions and grants.
