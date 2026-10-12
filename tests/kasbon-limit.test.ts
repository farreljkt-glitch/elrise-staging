import { describe, expect, it } from "vitest";
import { computeKasbonLimit, weeklyPeriodKey } from "../lib/integration/kasbon-limit";

describe("computeKasbonLimit", () => {
  it("gaji 10 jt, plafon 20% => plafon 2 jt, limit harian 66.666", () => {
    const r = computeKasbonLimit({ gajiPokok: 10_000_000, plafonPercent: 20, hariHadir: 0, totalTerpakai: 0 });
    expect(r.plafon).toBe(2_000_000);
    expect(r.limitHarian).toBe(66_666);
    expect(r.saldo).toBe(0);
  });
  it("saldo = limit harian x hari hadir - terpakai", () => {
    const r = computeKasbonLimit({ gajiPokok: 10_000_000, plafonPercent: 20, hariHadir: 10, totalTerpakai: 100_000 });
    expect(r.saldo).toBe(66_666 * 10 - 100_000);
  });
  it("saldo tidak melebihi sisa plafon", () => {
    const r = computeKasbonLimit({ gajiPokok: 10_000_000, plafonPercent: 20, hariHadir: 31, totalTerpakai: 1_900_000 });
    expect(r.saldo).toBe(100_000);
  });
  it("saldo tidak negatif bila terpakai melebihi", () => {
    expect(computeKasbonLimit({ gajiPokok: 10_000_000, plafonPercent: 20, hariHadir: 1, totalTerpakai: 500_000 }).saldo).toBe(0);
  });
  it("mingguan: plafon 25% dari plafon bulanan, dibagi 7", () => {
    const r = computeKasbonLimit({ gajiPokok: 10_000_000, plafonPercent: 20, hariHadir: 3, totalTerpakai: 0, weekly: true });
    expect(r.plafon).toBe(500_000);
    expect(r.limitHarian).toBe(71_428);
    expect(r.saldo).toBe(71_428 * 3);
  });
  it("persen 0 => tidak ada plafon", () => {
    expect(computeKasbonLimit({ gajiPokok: 10_000_000, plafonPercent: 0, hariHadir: 20, totalTerpakai: 0 }).plafon).toBe(0);
  });
  it("persen desimal tidak menimbulkan galat floating", () => {
    expect(computeKasbonLimit({ gajiPokok: 3_000_000, plafonPercent: 12.5, hariHadir: 0, totalTerpakai: 0 }).plafon).toBe(375_000);
  });
  it("menolak input tidak valid", () => {
    expect(() => computeKasbonLimit({ gajiPokok: 1, plafonPercent: 101, hariHadir: 0, totalTerpakai: 0 })).toThrow();
    expect(() => computeKasbonLimit({ gajiPokok: -1, plafonPercent: 10, hariHadir: 0, totalTerpakai: 0 })).toThrow();
  });
});

describe("weeklyPeriodKey (cocok dgn weekly_period_start Gajiku, cutoff Rabu=2)", () => {
  it("Rabu 2026-10-14 masih periode Kamis 2026-10-08", () => {
    expect(weeklyPeriodKey(new Date(Date.UTC(2026, 9, 14)), 2)).toBe("W:2026-10-08");
  });
  it("Kamis 2026-10-15 memulai periode baru", () => {
    expect(weeklyPeriodKey(new Date(Date.UTC(2026, 9, 15)), 2)).toBe("W:2026-10-15");
  });
  it("Minggu 2026-10-11 ada di periode yang mulai Kamis 2026-10-08", () => {
    expect(weeklyPeriodKey(new Date(Date.UTC(2026, 9, 11)), 2)).toBe("W:2026-10-08");
  });
});
