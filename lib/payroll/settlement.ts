// Helper settlement. Constraint UNIQUE(gajikuTxId) di MySQL adalah pengaman final.
export type KasbonRecord = { gajikuTxId: string; nominal: bigint; adminFee: bigint; periode?: string };
export function selectUnsettledKasbon(records: KasbonRecord[], settledIds: ReadonlySet<string>, startPeriod?: string, endPeriod?: string) {
  if ((startPeriod && startPeriod.startsWith("W:")) || (endPeriod && endPeriod.startsWith("W:"))) {
    throw new Error("Periode kasbon mingguan belum didukung.");
  }
  const seen = new Set<string>();
  return records.filter(r => {
    if (!r.gajikuTxId || r.nominal < 0n || r.adminFee < 0n) throw new Error("Data kasbon tidak valid.");
    if (seen.has(r.gajikuTxId)) throw new Error("View kasbon mengandung ID transaksi duplikat.");
    seen.add(r.gajikuTxId);
    if (startPeriod && r.periode !== undefined && r.periode < startPeriod) return false;
    if (endPeriod && r.periode !== undefined && r.periode > endPeriod) return false;
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
