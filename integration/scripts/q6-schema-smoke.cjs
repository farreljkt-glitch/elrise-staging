// Q6 CI-only schema smoke: read metadata in disposable MySQL; no business rows.
const { PrismaClient } = require("@prisma/client");
const assert = require("node:assert/strict");
const db = new PrismaClient();

async function main() {
  const expected = [
    "Client", "ClientSetting", "Project", "User", "Pegawai",
    "Attendance", "PayrollPeriod", "PayrollItem", "KasbonSettlement",
    "IntegrationConnection", "IntegrationEmployeeMap", "BundleLoanPolicy",
  ];
  const tables = await db.$queryRawUnsafe(
    "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'"
  );
  const actual = new Set(tables.map((r) => r.name));
  for (const table of expected) assert(actual.has(table), `Missing table: ${table}`);

  const unique = await db.$queryRawUnsafe(
    "SELECT TABLE_NAME AS tableName, INDEX_NAME AS indexName, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columnsList FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND NON_UNIQUE = 0 GROUP BY TABLE_NAME, INDEX_NAME"
  );
  function hasUnique(table, columns) {
    return unique.some((r) => r.tableName === table && r.columnsList === columns);
  }
  assert(hasUnique("KasbonSettlement", "gajikuTxId"), "Settlement transaction ID must be unique");
  assert(hasUnique("Attendance", "pegawaiId,tanggal"), "Attendance must be unique per employee/day");
  assert(hasUnique("IntegrationEmployeeMap", "connectionId,externalEmployeeId"), "External employee mapping must be unique per connection");
  console.log(`Q6 schema smoke passed: ${expected.length} core tables and 3 uniqueness constraints`);
}

main().catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => db.$disconnect());
