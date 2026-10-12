// Aturan limit kasbon HRIS → Gajiku (disepakati: limit harian × hari hadir).
// Modul murni (tanpa DB/IO) supaya bisa diuji dan dijadikan acuan patch compute_limits() di Gajiku.
//
// Perbedaan dari Gajiku saat ini (compute_limits di app/routes/web.py):
//   - plafon_bulanan = floor(gaji_HRIS × persen/100)      (Gajiku lama: floor(0.5 × gaji_Gajiku))
//   - pengali = jumlah HARI HADIR (HADIR/TELAT tervalidasi) (Gajiku lama: hari_ke kalender)
//   - saldo dibatasi sisa plafon (Gajiku lama tidak membatasi; pada hari ke-31 bisa melampaui plafon)

export interface KasbonLimitInput {
  /** gaji pokok bulanan dari HRIS (rupiah, bilangan bulat) */
  gajiPokok: number;
  /** persen gaji yang jadi plafon, 0..100 (konfigurasi per klien) */
  plafonPercent: number;
  /** jumlah tanggal berbeda berstatus HADIR/TELAT tervalidasi dalam periode berjalan s.d. hari ini */
  hariHadir: number;
  /** total kasbon (sukses + on-proses) pada periode berjalan */
  totalTerpakai: number;
  /** true bila perusahaan memakai cutoff mingguan: plafon 25% dari plafon bulanan, dibagi 7 */
  weekly?: boolean;
}

export interface KasbonLimit {
  plafonBulanan: number;
  plafon: number;
  limitHarian: number;
  saldo: number;
  sisaPlafon: number;
}

const int = (v: number, name: string) => {
  if (!Number.isFinite(v) || v < 0) throw new Error(`${name} tidak valid.`);
  return Math.floor(v);
};

export function computeKasbonLimit(i: KasbonLimitInput): KasbonLimit {
  const gaji = int(i.gajiPokok, "gajiPokok");
  if (!Number.isFinite(i.plafonPercent) || i.plafonPercent < 0 || i.plafonPercent > 100) throw new Error("plafonPercent harus 0–100.");
  const hariHadir = int(i.hariHadir, "hariHadir");
  const terpakai = int(i.totalTerpakai, "totalTerpakai");

  // Hitung dengan bilangan bulat: gaji × persen / 100 (persen bisa desimal -> dikali 100 dulu)
  const plafonBulanan = Math.floor((gaji * Math.round(i.plafonPercent * 100)) / 10000);
  const plafon = i.weekly ? Math.floor(plafonBulanan * 0.25) : plafonBulanan;
  const days = i.weekly ? 7 : 30;
  const limitHarian = Math.floor(plafon / days);
  const sisaPlafon = Math.max(plafon - terpakai, 0);
  const saldo = Math.min(Math.max(limitHarian * hariHadir - terpakai, 0), sisaPlafon);
  return { plafonBulanan, plafon, limitHarian, saldo, sisaPlafon };
}

/** Awal periode mingguan Gajiku: hari setelah cutoff (0=Senin..6=Minggu). Tanggal UTC date-only. */
export function weeklyPeriodStart(d: Date, cutoffDay: number): Date {
  if (!Number.isInteger(cutoffDay) || cutoffDay < 0 || cutoffDay > 6) throw new Error("cutoffDay harus 0–6.");
  const weekday = (d.getUTCDay() + 6) % 7; // JS: 0=Minggu -> 0=Senin
  const since = (weekday - ((cutoffDay + 1) % 7) + 7) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - since));
}
export const weeklyPeriodKey = (d: Date, cutoffDay: number) => `W:${weeklyPeriodStart(d, cutoffDay).toISOString().slice(0, 10)}`;
