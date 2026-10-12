import { describe, expect, it } from "vitest";
import { calculateBundleLoanLimit as calc } from "./bundle-policy";
const base = {preKasbonThp:5000000n,mode:"PERCENT_OF_PRE_KASBON_THP" as const,percentBps:4000,denominatorDays:20,validatedPresentDays:10,outstandingPrincipal:300000n,pendingReservations:0n};
describe("bundle loan limits",()=>{
 it("accrues pro rata and subtracts outstanding",()=>expect(calc(base)).toEqual({ceiling:2000000n,accrued:1000000n,available:700000n,countedDays:10}));
 it("caps presence at configured denominator",()=>expect(calc({...base,validatedPresentDays:25}).accrued).toBe(2000000n));
 it("never returns negative available",()=>expect(calc({...base,outstandingPrincipal:3000000n}).available).toBe(0n));
 it("supports fixed nominal ceiling",()=>expect(calc({...base,mode:"FIXED_IDR",fixedAmount:1000000n}).accrued).toBe(500000n));
 it("rejects zero denominator",()=>expect(()=>calc({...base,denominatorDays:0})).toThrow());
 it("rejects negative attendance",()=>expect(()=>calc({...base,validatedPresentDays:-1})).toThrow());
 it("subtracts reservations",()=>expect(calc({...base,pendingReservations:200000n}).available).toBe(500000n));
});
