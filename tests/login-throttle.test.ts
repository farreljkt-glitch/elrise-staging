import { describe, it, expect } from "vitest";
import { throttleKeys, THROTTLE_LIMITS } from "../lib/auth/login-throttle";

describe("Throttle login", () => {
  it("membedakan bucket email+IP antar IP sehingga penyerang tidak bisa memblokir pemilik akun dari IP lain", () => {
    const a = throttleKeys("budi@contoh.com", "1.1.1.1").find(k => k.limit === THROTTLE_LIMITS.emailIp)!;
    const b = throttleKeys("budi@contoh.com", "2.2.2.2").find(k => k.limit === THROTTLE_LIMITS.emailIp)!;
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });
  it("menormalkan email (huruf besar/kecil dan spasi)", () => {
    const a = throttleKeys(" Budi@Contoh.com ", "1.1.1.1").map(k => k.fingerprint);
    const b = throttleKeys("budi@contoh.com", "1.1.1.1").map(k => k.fingerprint);
    expect(a).toEqual(b);
  });
  it("tanpa IP hanya memakai bucket email-global dengan ambang tinggi (tidak ada bucket bersama untuk semua orang)", () => {
    const keys = throttleKeys("budi@contoh.com", null);
    expect(keys).toHaveLength(1);
    expect(keys[0].limit).toBe(THROTTLE_LIMITS.emailGlobal);
    const other = throttleKeys("siti@contoh.com", null);
    expect(other[0].fingerprint).not.toBe(keys[0].fingerprint);
  });
  it("login sukses hanya membersihkan bucket email+IP", () => {
    const keys = throttleKeys("budi@contoh.com", "1.1.1.1");
    expect(keys.filter(k => k.clearOnSuccess)).toHaveLength(1);
    expect(keys.find(k => k.clearOnSuccess)!.limit).toBe(THROTTLE_LIMITS.emailIp);
  });
  it("ambang email-global jauh lebih tinggi daripada email+IP", () => {
    expect(THROTTLE_LIMITS.emailGlobal).toBeGreaterThan(THROTTLE_LIMITS.ip);
    expect(THROTTLE_LIMITS.ip).toBeGreaterThan(THROTTLE_LIMITS.emailIp);
  });
});
