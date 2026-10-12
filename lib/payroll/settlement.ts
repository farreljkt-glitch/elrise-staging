// Helper settlement. Constraint UNIQUE(gajikuTxId) di MySQL adalah pengaman final.
export type KasbonRecord = { gajikuTxId: string; nominal: bigint; adminFee: bigint; periode?: string };
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const isMonth = (value: string) => monthPattern.test(value);

export function selectUnsettledKasbon(records: KasbonRecord[], settledIds: ReadonlySet<string>, startPeriod?: string, endPeriod?: string) {
  // Never include legacy loans by default when a cutover boundary is missing.
  if (!startPeriod || !isMonth(startPeriod))
    throw new Error("kasbonStartPeriod wajib dalam format YYYY-MM.");
  if (!endPeriod || !isMonth(endPeriod))
    throw new Error("Periode akhir wajib dalam format YYYY-MM.");
  if (startPeriod > endPeriod)
    throw new Error("Rentang periode kasbon terbalik.");
  const seen = new Set<string>();
  return records.filter(r => {
    if (!r.gajikuTxId?.trim() || r.nominal < 0n || r.adminFee < 0n)
      throw new Error("Data kasbon tidak valid.");
    if (!r.periode || !isMonth(r.periode))
      throw new Error("Periode transaksi kasbon hilang atau tidak didukung.");
    if (seen.has(r.gajikuTxId))
      throw new Error("View kasbon mengandung ID transaksi duplikat.");
    seen.add(r.gajikuTxId);
    if (r.periode < startPeriod || r.periode > endPeriod) return false;
    return !settledIds.has(r.gajikuTxId);
  });
}

/**
 * Kasbon adalah domain Gajiku; HRIS hanya membaca kasbon yang sudah sukses untuk dipotong dari gaji.
 * Jika modul potongan kasbon belum aktif di HRIS padahal Gajiku mencatat kasbon sukses pada periode payroll,
 * payroll tidak boleh jalan diam-diam dengan potongan nol.
 */
export function assertKasbonConfigConsistent(input: { enabled: boolean; hasConfiguredSetting: boolean; successRowsInPeriod: number }) {
  if (!input.hasConfiguredSetting) {
    throw new Error("Pengaturan klien belum dibuat. Payroll dibatalkan sampai ClientSetting dikonfigurasi.");
  }
  if (!input.enabled && input.successRowsInPeriod > 0) {
    throw new Error("Gajiku mencatat kasbon sukses pada periode ini, tetapi potongan kasbon belum diaktifkan untuk klien ini. Aktifkan integrasi (dan isi kasbonStartPeriod) atau selesaikan rekonsiliasi sebelum payroll.");
  }
}
