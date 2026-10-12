import { createHash } from "node:crypto";

// Pembatasan percobaan login. Sengaja TIDAK mengunci akun berdasarkan email saja dengan ambang rendah,
// karena penyerang cukup mengirim beberapa percobaan salah untuk memblokir login pemilik akun (DoS).
export const THROTTLE_WINDOW_MS = 15 * 60 * 1000;
export const THROTTLE_LIMITS = {
  emailIp: 8,       // kombinasi email + IP: memblokir hanya sumber yang menebak-nebak
  ip: 40,           // satu IP ke banyak akun (kantor NAT tetap aman karena ambangnya lebih longgar)
  emailGlobal: 100, // pengaman brute force terdistribusi; ambang tinggi agar sulit dipakai untuk DoS
} as const;

export type ThrottleKey = { fingerprint: string; limit: number; clearOnSuccess: boolean };

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * Daftar bucket yang dihitung untuk satu percobaan login.
 * Jika IP tidak diketahui (header proxy tidak ada), hanya bucket email-global yang berlaku;
 * jangan gabungkan semua request tanpa IP ke satu bucket bersama karena itu memblokir semua orang.
 */
export function throttleKeys(email: string, ip: string | null): ThrottleKey[] {
  const normalized = email.trim().toLowerCase();
  const keys: ThrottleKey[] = [{ fingerprint: sha256(`email-global|${normalized}`), limit: THROTTLE_LIMITS.emailGlobal, clearOnSuccess: false }];
  if (ip) {
    keys.push({ fingerprint: sha256(`email-ip|${normalized}|${ip}`), limit: THROTTLE_LIMITS.emailIp, clearOnSuccess: true });
    keys.push({ fingerprint: sha256(`ip|${ip}`), limit: THROTTLE_LIMITS.ip, clearOnSuccess: false });
  }
  return keys;
}
