/**
 * Real MySQL integration checks on a disposable GitHub Actions schema ONLY.
 * Never run against Elrise production or Gajiku Live.
 */
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");

const target = new URL(process.env.DATABASE_URL || "mysql://missing:missing@invalid/none");
if (target.hostname !== "127.0.0.1" || target.pathname !== "/elrise_ci" || process.env.CI !== "true") {
  throw new Error("Refusing integration writes outside disposable CI MySQL elrise_ci");
}

const db = new PrismaClient();
async function main() {
  const suffix = randomUUID().slice(0, 8);
  const a = await db.client.create({ data: { code: "q11-a-" + suffix, name: "Q11 Tenant A" } });
  const b = await db.client.create({ data: { code: "q11-b-" + suffix, name: "Q11 Tenant B" } });
  const pa = await db.project.create({ data: { clientId: a.id, code: "MAIN", name: "A project" } });
  const pb = await db.project.create({ data: { clientId: b.id, code: "MAIN", name: "B project" } });
  const employeeA = await db.pegawai.create({ data: {
    clientId: a.id, projectId: pa.id, idPegawai: "QA-" + suffix,
    email: "a-" + suffix + "@example.invalid", nama: "Employee A", gajiPokok: 1_250_000n,
  } });
  const employeeB = await db.pegawai.create({ data: {
    clientId: b.id, projectId: pb.id, idPegawai: "QB-" + suffix,
    email: "b-" + suffix + "@example.invalid", nama: "Employee B", gajiPokok: 2_500_000n,
  } });
  // Isolation relies on application queries being scoped, not on automatic MySQL row security.
  assert.equal((await db.pegawai.findMany({ where: { clientId: a.id } })).length, 1);
  assert.equal(await db.pegawai.findFirst({ where: { clientId: a.id, id: employeeB.id } }), null);
  assert.equal(await db.pegawai.findFirst({ where: { clientId: b.id, id: employeeA.id } }), null);
  console.log("PASS tenant-scoped repository lookup");

  // A transaction rejected after a write must not leave an employee behind.
  const rollbackCode = "ROLL-" + suffix;
  await assert.rejects(db.$transaction(async tx => {
    await tx.pegawai.create({ data: {
      clientId: a.id, projectId: pa.id, idPegawai: rollbackCode,
      email: "rollback-" + suffix + "@example.invalid", nama: "Rollback",
    } });
    throw new Error("intentional rollback");
  }), /intentional rollback/);
  assert.equal(await db.pegawai.count({ where: { idPegawai: rollbackCode } }), 0);
  console.log("PASS employee transaction rollback");

  await assert.rejects(db.pegawai.create({ data: {
    clientId: a.id, projectId: pa.id, idPegawai: employeeA.idPegawai,
    email: "duplicate-" + suffix + "@example.invalid", nama: "Duplicate",
  } }), err => err.code === "P2002");
  console.log("PASS employee unique constraint");

  const eventData = {
    clientId: a.id, gajikuTxId: "gajiku-test-" + suffix, externalTenantId: "external-a",
    externalEmployeeId: "employee-a", payrollItemId: "payroll-item-" + suffix,
    amount: 25_000n, payload: { demo: true }, payloadHash: "a".repeat(64),
    status: "PENDING",
  };
  const event = await db.integrationSettlementOutbox.create({
    data: { ...eventData, eventId: "event-" + suffix },
  });
  await assert.rejects(db.integrationSettlementOutbox.create({
    data: { ...eventData, eventId: "event-duplicate-" + suffix },
  }), err => err.code === "P2002");
  assert.equal(await db.integrationSettlementOutbox.count({ where: {
    clientId: a.id, gajikuTxId: eventData.gajikuTxId,
  } }), 1);
  console.log("PASS outbox unique transaction id");

  await assert.rejects(db.integrationSettlementOutbox.create({
    data: { ...eventData, eventId: event.eventId, gajikuTxId: "another-" + suffix },
  }), err => err.code === "P2002");
  console.log("PASS outbox event id uniqueness");

  const rollbackEventId = "rollback-event-" + suffix;
  await assert.rejects(db.$transaction(async tx => {
    await tx.integrationSettlementOutbox.create({
      data: { ...eventData, eventId: rollbackEventId, gajikuTxId: rollbackEventId },
    });
    throw new Error("rollback settlement");
  }), /rollback settlement/);
  assert.equal(await db.integrationSettlementOutbox.count({ where: { eventId: rollbackEventId } }), 0);
  console.log("PASS outbox transaction rollback");
  console.log("PASS Q11 disposable MySQL transaction integration checks");
}
main().catch(err => {
  console.error("Q11 MySQL transaction test failed", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
}).finally(() => db.$disconnect());
