import { describe, expect, it } from "vitest";
import { calculateBundleLoanLimit as calc } from "./bundle-policy";

const base = {
  preKasbonThp: 5_000_000n,
  mode: "PERCENT_OF_PRE_KASBON_THP" as const,
  percentBps: 4_000,
  denominatorDays: 20,
  validatedPresentDays: 10,
  outstandingPrincipal: 300_000n,
  pendingReservations: 0n,
};

describe("bundle loan policy edge cases", () => {
  it("returns zero available when there is no validated attendance", () => {
    expect(calc({ ...base, validatedPresentDays: 0 }).available).toBe(0n);
  });

  it("rejects negative THP, outstanding, and reservations", () => {
    expect(() => calc({ ...base, preKasbonThp: -1n })).toThrow();
    expect(() => calc({ ...base, outstandingPrincipal: -1n })).toThrow();
    expect(() => calc({ ...base, pendingReservations: -1n })).toThrow();
  });

  it("rejects invalid percentage basis points", () => {
    for (const percentBps of [-1, 10_001, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => calc({ ...base, percentBps })).toThrow();
    }
  });

  it("rejects invalid denominator and presence values", () => {
    for (const denominatorDays of [0, 367, 1.5, Number.NaN]) {
      expect(() => calc({ ...base, denominatorDays })).toThrow();
    }
    for (const validatedPresentDays of [-1, 1.5, Number.NaN]) {
      expect(() => calc({ ...base, validatedPresentDays })).toThrow();
    }
  });

  it("does not allow pending reservations to increase availability", () => {
    const withoutReservation = calc({ ...base, pendingReservations: 0n });
    const withReservation = calc({ ...base, pendingReservations: 400_000n });
    expect(withReservation.available).toBeLessThanOrEqual(withoutReservation.available);
    expect(withReservation.available).toBe(300_000n);
  });

  it("uses bigint for large rupiah values without floating-point precision loss", () => {
    const thp = 9_007_199_254_740_993n;
    const result = calc({
      ...base,
      preKasbonThp: thp,
      percentBps: 10_000,
      denominatorDays: 1,
      validatedPresentDays: 1,
      outstandingPrincipal: 0n,
    });
    expect(result.ceiling).toBe(thp);
    expect(result.available).toBe(thp);
  });
});
