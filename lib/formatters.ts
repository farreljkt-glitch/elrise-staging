// Utility fungsi pemformatan data berbahasa Indonesia
// Digunakan secara konsisten di seluruh halaman untuk standarisasi tampilan.

/**
 * Format angka integer menjadi format mata uang Rupiah
 * Contoh: 12500000 -> "Rp12.500.000"
 */
export function formatRupiah(value: number): string {
  if (isNaN(value)) return "Rp0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format string tanggal ISO menjadi format tanggal Indonesia
 * Contoh: "2026-03-15" -> "15 Maret 2026"
 */
export function formatDate(isoDateString: string): string {
  if (!isoDateString) return "-";
  try {
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return isoDateString;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return isoDateString;
  }
}

/**
 * Format tanggal dan waktu ke bahasa Indonesia
 * Contoh: "2026-03-15T08:30:00Z" -> "15 Maret 2026, 15:30 WIB"
 */
export function formatDateTime(isoString: string): string {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const formatted = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
    return `${formatted} WIB`;
  } catch {
    return isoString;
  }
}

/**
 * Format angka dengan pemisah ribuan titik
 * Contoh: 12500 -> "12.500"
 */
export function formatNumber(value: number): string {
  if (isNaN(value)) return "0";
  return new Intl.NumberFormat("id-ID").format(value);
}

/**
 * Dapatkan inisial dari nama (maksimal 2 huruf)
 * Contoh: "Budi Santoso" -> "BS"
 */
export function getInitials(name: string): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Samarkan nomor rekening bank demi keamanan tampilan
 * Contoh: "1234567890" -> "**** **** 7890"
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return "-";
  const cleaned = accountNumber.replace(/\s+/g, "");
  if (cleaned.length <= 4) return cleaned;
  const lastFour = cleaned.slice(-4);
  return `**** **** ${lastFour}`;
}
