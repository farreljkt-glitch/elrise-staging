import "server-only";
import { db } from "@/lib/db";
import { selectUnsettledKasbon } from "@/lib/payroll/settlement";
import { validateMonthlyKasbonWindow } from "@/lib/integration/period-mapping";

export type KasbonSukses = {
  gajikuTxId: string; email: string; externalTenantId: string; idPegawai: string; periode: string; nominal: bigint;
  adminFee: bigint; status: string; finalApprovedAt: Date | null;
};
/** Membaca view read-only di hris_db; periode historis sebelum go-live tidak pernah ditarik.
 *  Requires verified employee mapping. Gajiku employee IDs MUST be globally unique;
 *  tenant-scoped source filtering remains a prerequisite for production. */
type ApiKasbonItem = {
  transaction_id: string; period: string; amount: number; admin_fee: number;
  status: string; final_approved_at: string | null;
};
type ApiKasbonResponse = { tenant_id: string; employee_id: string; items: ApiKasbonItem[] };

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
  let payload: ApiKasbonResponse;
  try {
    const response = await fetch(url, {
      method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: controller.signal, cache: "no-store", redirect: "error",
    });
    if (!response.ok) throw new Error(`upstream status ${response.status}`);
    payload = await response.json() as ApiKasbonResponse;
  } catch {
    throw new Error("API Gajiku gagal diakses; payroll dibatalkan tanpa fallback.");
  } finally {
    clearTimeout(timeout);
  }
  if (payload?.tenant_id !== externalTenantId || payload?.employee_id !== externalEmployeeId ||
      !Array.isArray(payload.items) || payload.items.length > 5000) {
    throw new Error("Respons identitas API Gajiku tidak valid; payroll dibatalkan.");
  }
  const seen = new Set<string>();
  return payload.items.map(item => {
    if (!item || typeof item.transaction_id !== "string" || !item.transaction_id.trim() ||
        seen.has(item.transaction_id) || typeof item.period !== "string" ||
        item.period < window.startPeriod || item.period > window.periodeKey ||
        item.status.toLowerCase() !== "sukses" ||
        !Number.isSafeInteger(item.amount) || item.amount < 0 ||
        !Number.isSafeInteger(item.admin_fee) || item.admin_fee < 0) {
      throw new Error("Data transaksi API Gajiku tidak valid; payroll dibatalkan.");
    }
    seen.add(item.transaction_id);
    const approved = item.final_approved_at ? new Date(item.final_approved_at) : null;
    if (approved && Number.isNaN(approved.getTime())) throw new Error("Tanggal approval kasbon tidak valid.");
    return {
      gajikuTxId: item.transaction_id, email: "", externalTenantId,
      idPegawai: externalEmployeeId, periode: item.period, nominal: BigInt(item.amount),
      adminFee: BigInt(item.admin_fee), status: item.status, finalApprovedAt: approved,
    };
  });
}

export async function getUnsettledKasbon(idPegawai: string, periodeKey: string) {
  const employee = await db.pegawai.findUnique({
    where: { idPegawai },
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
