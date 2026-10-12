import { describe, expect, it } from "vitest";
import { selectUnsettledKasbon } from "../lib/payroll/settlement";

const rows = [
  { gajikuTxId: "legacy", nominal: 200n, adminFee: 0n, periode: "2026-09" },
  { gajikuTxId: "current", nominal: 300n, adminFee: 10n, periode: "2026-10" },
  { gajikuTxId: "future", nominal: 400n, adminFee: 0n, periode: "2026-11" },
];

describe("Q9 settlement cutover fail-closed", () => {
  it("never deducts pre-cutover or future loans", () => {
    expect(selectUnsettledKasbon(rows, new Set(), "2026-10", "2026-10").map(r => r.gajikuTxId))
      .toEqual(["current"]);
  });
  it("does not deduct previously settled transactions again", () => {
    expect(selectUnsettledKasbon(rows, new Set(["current"]), "2026-10", "2026-10")).toEqual([]);
  });
  it("requires explicit cutover and payroll period boundaries", () => {
    expect(() => selectUnsettledKasbon(rows, new Set())).toThrow(/kasbonStartPeriod/);
    expect(() => selectUnsettledKasbon(rows, new Set(), "2026-10")).toThrow(/Periode akhir/);
    expect(() => selectUnsettledKasbon(rows, new Set(), "2026-11", "2026-10")).toThrow(/terbalik/);
  });
  it.each(["W:2026-10-05", "2026-13", "2026-1", ""])(
    "rejects unsupported transaction period %s", periode => {
      expect(() => selectUnsettledKasbon([{ ...rows[1], periode }], new Set(), "2026-10", "2026-10"))
        .toThrow(/Periode transaksi/);
    },
  );
  it("rejects missing transaction period instead of including legacy debt", () => {
    const { periode: _unused, ...withoutPeriod } = rows[1];
    expect(() => selectUnsettledKasbon([withoutPeriod], new Set(), "2026-10", "2026-10"))
      .toThrow(/Periode transaksi/);
  });
  it("rejects duplicated transaction IDs before settlement", () => {
    expect(() => selectUnsettledKasbon([rows[1], rows[1]], new Set(), "2026-10", "2026-10"))
      .toThrow(/duplikat/);
  });
});
