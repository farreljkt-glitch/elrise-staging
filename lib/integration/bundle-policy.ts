/** Deterministic integer-IDR loan calculation; no database or network dependency. */
export type LoanPolicyInput = {
  preKasbonThp: bigint; mode: "PERCENT_OF_PRE_KASBON_THP" | "FIXED_IDR";
  percentBps?: number; fixedAmount?: bigint; denominatorDays: number;
  validatedPresentDays: number; outstandingPrincipal: bigint; pendingReservations: bigint;
};
export function calculateBundleLoanLimit(p: LoanPolicyInput) {
  if (p.preKasbonThp < 0n || p.outstandingPrincipal < 0n || p.pendingReservations < 0n)
    throw new Error("Negative monetary input");
  if (!Number.isInteger(p.denominatorDays) || p.denominatorDays < 1 || p.denominatorDays > 366)
    throw new Error("Invalid Admin PT denominator");
  if (!Number.isInteger(p.validatedPresentDays) || p.validatedPresentDays < 0)
    throw new Error("Invalid attendance count");
  let ceiling: bigint;
  if (p.mode === "PERCENT_OF_PRE_KASBON_THP") {
    if (!Number.isInteger(p.percentBps) || p.percentBps! < 0 || p.percentBps! > 10000)
      throw new Error("Invalid percentage");
    ceiling = p.preKasbonThp * BigInt(p.percentBps!) / 10000n;
  } else if (p.mode === "FIXED_IDR") {
    if (p.fixedAmount === undefined || p.fixedAmount < 0n) throw new Error("Invalid fixed ceiling");
    ceiling = p.fixedAmount;
  } else throw new Error("Unknown policy mode");
  const countedDays = Math.min(p.validatedPresentDays, p.denominatorDays);
  const accrued = ceiling * BigInt(countedDays) / BigInt(p.denominatorDays);
  const remainder = accrued - p.outstandingPrincipal - p.pendingReservations;
  return { ceiling, accrued, available: remainder > 0n ? remainder : 0n, countedDays };
}
