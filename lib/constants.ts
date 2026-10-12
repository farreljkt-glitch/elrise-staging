// Konstanta aplikasi untuk status, role, dan konfigurasi umum

export const APP_NAME = "Terhubung Gajiku";
export const BRAND_NAME = "elrise";
export const BRAND_TAGLINE = "HRIS by Elkyno Technology";

/** Label siklus: periode berjalan 1 bulan penuh, dimulai pada tanggal tertentu (sama dengan Gajiku). */
export const SALARY_CYCLE_LABELS: Record<string, string> = {
  SIKLUS_A: "Siklus A (periode mulai tgl 1)",
  SIKLUS_B: "Siklus B (periode mulai tgl 16)",
  SIKLUS_C: "Siklus C (periode mulai tgl 21)",
  SIKLUS_D: "Siklus D (periode mulai tgl 26)",
};
export const SALARY_CYCLES = [
  { value: "SIKLUS_A", label: "Siklus A (periode mulai tanggal 1)" },
  { value: "SIKLUS_B", label: "Siklus B (periode mulai tanggal 16)" },
  { value: "SIKLUS_C", label: "Siklus C (periode mulai tanggal 21)" },
  { value: "SIKLUS_D", label: "Siklus D (periode mulai tanggal 26)" },
];

export const ATTENDANCE_STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  HADIR: { label: "Hadir", variant: "success" },
  TELAT: { label: "Terlambat", variant: "warning" },
  ALPHA: { label: "Alpha", variant: "danger" },
  CUTI: { label: "Cuti", variant: "info" },
  IZIN: { label: "Izin", variant: "neutral" },
  DINAS: { label: "Dinas Luar", variant: "info" },
  LIBUR: { label: "Hari Libur", variant: "neutral" },
};

export const PAYROLL_STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  DRAFT: { label: "Draft", variant: "neutral" },
  REVIEW: { label: "Dalam Review", variant: "warning" },
  LOCKED: { label: "Terkunci", variant: "info" },
  PAID: { label: "Sudah Dibayar", variant: "success" },
};

export const LEAVE_STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  PENDING: { label: "Menunggu Persetujuan", variant: "warning" },
  APPROVED: { label: "Disetujui", variant: "success" },
  REJECTED: { label: "Ditolak", variant: "danger" },
};

export const KASBON_STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  SUKSES: { label: "Sukses Disalurkan", variant: "info" },
  SETTLED: { label: "Settled (Lunas)", variant: "success" },
  BELUM_SETTLED: { label: "Belum Settled", variant: "warning" },
  SELISIH: { label: "Ada Selisih", variant: "danger" },
};
