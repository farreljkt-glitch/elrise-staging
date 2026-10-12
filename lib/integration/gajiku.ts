import "server-only";
import { db } from "@/lib/db";
import { selectUnsettledKasbon } from "@/lib/payroll/settlement";
import { validateMonthlyKasbonWindow } from "@/lib/integration/period-mapping";
import { parseGajikuKasbon } from "@/lib/integration/gajiku-contract";

export type KasbonSukses = {
  gajikuTxId: string; email: string; externalTenantId: string; idPegawai: string; periode: string; nominal: bigint;
  adminFee: bigint; status: string; finalApprovedAt: Date | null;
};
/** Integration uses a verified tenant-scoped read-only Gajiku API, never direct live SQL. */
export async function getKasbonSukses(externalEmployeeId: string, externalTenantId: string, startPeriod: string, periodeKey: string): Promise<KasbonSukses[]> {
  const window = validateMonthlyKasbonWindow(startPeriod, periodeKey);
  const endpoint = process.env.GAJIKU_INTEGRATION_URL;
  const token = process.env.GAJIKU_INTEGRATION_TOKEN;
  if (!endpoint || !token || token.length < 32) throw new Error("Konfigurasi API Gajiku belum tersedia; payroll dibatalkan.");
  const url = new URL("/internal/v1/kasbon", endpoint);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "127.0.0.1")) {
    throw new Error("Endpoint integrasi wajib HTTPS di production.");
  }
  url.searchParams.set("tenant_id", externalTenantId);
  url.searchParams.set("employee_id", externalEmployeeId);
  url.searchParams.set("start_period", window.startPeriod);
  url.searchParams.set("end_period", window.periodeKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let payload: unknown;
  try {
    const response = await fetch(url, {
      method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: controller.signal, cache: "no-store", redirect: "error",
    });
    if (!response.ok) throw new Error(`upstream status ${response.status}`);
    payload = await response.json();
  } catch {
    throw new Error("API Gajiku gagal diakses; payroll dibatalkan tanpa fallback.");
  } finally {
    clearTimeout(timeout);
  }
  return parseGajikuKasbon(payload,{
    tenantId:externalTenantId,employeeId:externalEmployeeId,
    startPeriod:window.startPeriod,endPeriod:window.periodeKey,
  });
}

export async function getUnsettledKasbon(idPegawai: string, periodeKey: string) {
  const employee = await db.pegawai.findUnique({
    where: { id: idPegawai },
    select: { clientId: true, client: { select: { setting: { select: { kasbonGajikuEnabled: true, kasbonStartPeriod: true } } } } },
  });
  if (!employee) throw new Error("Pegawai tidak ditemukan di HRIS. Payroll dibatalkan.");
  const setting = employee.client.setting;
  const enabled = !!setting?.kasbonGajikuEnabled;
  // Standalone clients never depend on Gajiku availability or identity matching.
  if (!enabled) return [];

  // Fail closed: a verified, ACTIVE tenant connection and employee mapping are
  // mandatory before a cross-product payroll deduction can be calculated.
  const mapped = await db.integrationEmployeeMap.findUnique({
    where: { pegawaiId: idPegawai },
    include: { connection: true },
  });
  if (!mapped || !mapped.verifiedAt || !mapped.connection.verifiedAt ||
      mapped.connection.state !== "ACTIVE" || mapped.connection.payrollOwner !== "ELRISE" ||
      mapped.connection.clientId !== employee.clientId || !mapped.externalEmployeeId.trim()) {
    throw new Error("Mapping tenant/pegawai Gajiku belum terverifikasi dan aktif; payroll dibatalkan.");
  }
  const externalEmployeeId = mapped.externalEmployeeId.trim();
  if (periodeKey.startsWith("W:")) {
    throw new Error("Kasbon mingguan belum didukung. Payroll dibatalkan sampai konfigurasi cutoff mingguan tersedia.");
  }
  const { startPeriod } = validateMonthlyKasbonWindow(setting!.kasbonStartPeriod, periodeKey);
  const records = await getKasbonSukses(externalEmployeeId, mapped.connection.externalTenantId, startPeriod, periodeKey);
  // Reject ambiguous/malformed upstream identity data instead of silently
  // allocating transactions to the wrong employee.
  if (records.some(r => r.idPegawai !== externalEmployeeId || r.externalTenantId !== mapped.connection.externalTenantId)) {
    throw new Error("Identitas kasbon Gajiku tidak sesuai mapping; payroll dibatalkan.");
  }
  const ids = records.map(r => r.gajikuTxId);
  const settlements = ids.length ? await db.kasbonSettlement.findMany({ where: { gajikuTxId: { in: ids } }, select: { gajikuTxId: true } }) : [];
  // Batas periode diteruskan lagi sebagai lapis kedua selain filter SQL.
  return selectUnsettledKasbon(records, new Set(settlements.map(s => s.gajikuTxId)), startPeriod, periodeKey);
}
