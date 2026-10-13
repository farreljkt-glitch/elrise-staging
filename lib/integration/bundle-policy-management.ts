import "server-only";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-server";
import { Prisma, type LoanCeilingMode } from "@prisma/client";

type PolicyRequest = { clientId: string; pegawaiIds: string[]; mode: LoanCeilingMode; percentBps?: number; fixedAmountIdr?: string; denominatorDays: number; effectiveAt: string };

/** ADMIN is Admin PT in the current schema. Policies are append-only and tenant-scoped. */
export async function createEffectiveDatedLoanPolicies(input: PolicyRequest) {
  const actor = await requireUser(["ADMIN"]);
  if (!actor.clientId || input.clientId !== actor.clientId) throw new Error("Tenant mismatch");
  if (!Array.isArray(input.pegawaiIds) || input.pegawaiIds.length > 500 || new Set(input.pegawaiIds).size !== input.pegawaiIds.length) throw new Error("Invalid employee selection");
  if (!Number.isInteger(input.denominatorDays) || input.denominatorDays < 1 || input.denominatorDays > 366) throw new Error("Invalid attendance denominator");
  const effectiveAt = new Date(input.effectiveAt);
  if (!input.effectiveAt || !Number.isFinite(effectiveAt.getTime()) ||
      effectiveAt.toISOString().slice(0,10) < new Date().toISOString().slice(0,10))
    throw new Error("Invalid effective date");
  if (input.mode === "PERCENT_OF_PRE_KASBON_THP") {
    if (!Number.isInteger(input.percentBps) || input.percentBps! < 0 || input.percentBps! > 10000 || input.fixedAmountIdr !== undefined) throw new Error("Invalid percentage policy");
  } else if (input.mode === "FIXED_IDR") {
    if (!input.fixedAmountIdr || !/^(0|[1-9][0-9]{0,12})$/.test(input.fixedAmountIdr) || input.percentBps !== undefined) throw new Error("Invalid fixed amount");
  } else throw new Error("Invalid policy mode");
  return db.$transaction(async tx => {
    const client = await tx.client.findUnique({
      where: { id: actor.clientId! }, select: { status: true },
    });
    if (client?.status !== "AKTIF") throw new Error("Tenant inactive");
    const subscription = await tx.bundleSubscription.findUnique({ where: { clientId: actor.clientId! } });
    const connection = await tx.integrationConnection.findUnique({ where: { clientId: actor.clientId! } });
    if (subscription?.mode !== "BUNDLE" || subscription.effectiveAt.toISOString().slice(0,10) > effectiveAt.toISOString().slice(0,10) || connection?.state !== "ACTIVE" || !connection.verifiedAt || connection.payrollOwner !== "ELRISE") throw new Error("Verified bundle required");
    if (input.pegawaiIds.length) {
      const employees = await tx.pegawai.findMany({ where: { clientId: actor.clientId!, id: { in: input.pegawaiIds }, isActive: true }, select: { id: true } });
      if (employees.length !== input.pegawaiIds.length) throw new Error("Employee not found in tenant");
    }
    const ids: (string | null)[] = input.pegawaiIds.length ? input.pegawaiIds : [null];
    const collision = await tx.bundleLoanPolicy.count({ where: {
      clientId: actor.clientId!, effectiveAt,
      pegawaiId: ids.length===1 && ids[0]===null ? null : { in: input.pegawaiIds },
    } });
    if (collision) throw new Error("duplicate policy effective date");
    const saved = await tx.bundleLoanPolicy.createMany({ data: ids.map(pegawaiId => ({
      clientId: actor.clientId!, pegawaiId, mode: input.mode,
      percentBps: input.mode === "PERCENT_OF_PRE_KASBON_THP" ? input.percentBps! : null,
      fixedAmount: input.mode === "FIXED_IDR" ? BigInt(input.fixedAmountIdr!) : null,
      denominatorDays: input.denominatorDays, effectiveAt, createdByUserId: actor.id
    })) });
    await tx.auditLog.create({ data: {
      actorId: actor.id, clientId: actor.clientId!, action: "CREATE",
      entity: "BundleLoanPolicy", entityId: actor.clientId!,
      newValue: { mode: input.mode, count: saved.count, effectiveAt: input.effectiveAt,
        scope: input.pegawaiIds.length ? "EMPLOYEES" : "TENANT_DEFAULT" },
    } });
    return saved;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

/** Employee override wins over tenant default. Never select future-effective policy. */
export async function getApplicableLoanPolicy(clientId: string, pegawaiId: string, at: Date) {
  if (!Number.isFinite(at.getTime())) throw new Error("Invalid date");
  const actor = await requireUser(["ADMIN", "PEGAWAI", "SUPERADMIN"]);
  if (actor.role !== "SUPERADMIN" && actor.clientId !== clientId) throw new Error("Tenant mismatch");
  if (actor.role === "PEGAWAI" && actor.pegawaiId !== pegawaiId) throw new Error("Employee mismatch");
  const employee = await db.pegawai.findFirst({ where: { id: pegawaiId, clientId, isActive: true }, select: { id: true } });
  if (!employee) throw new Error("Employee unavailable");
  const subscription = await db.bundleSubscription.findUnique({ where: { clientId } });
  if (subscription?.mode !== "BUNDLE" || subscription.effectiveAt > at) return null;
  const orderBy = [{ effectiveAt: "desc" as const }, { createdAt: "desc" as const }, { id: "desc" as const }];
  const override = await db.bundleLoanPolicy.findFirst({ where: { clientId, pegawaiId, effectiveAt: { lte: at } }, orderBy });
  return override ?? db.bundleLoanPolicy.findFirst({ where: { clientId, pegawaiId: null, effectiveAt: { lte: at } }, orderBy });
}
