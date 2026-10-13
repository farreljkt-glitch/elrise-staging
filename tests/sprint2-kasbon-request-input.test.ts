import { describe,it,expect } from "vitest";
import {currentKasbonPeriod,getWibDate,parseKasbonReview,
  parseKasbonSubmission,parseKasbonStartPeriod} from "../lib/integration/loan-request-input";
const key="a724719e-480e-4d75-a34a-35ba191d6d3f";
const valid={amountIdr:"250000",purpose:"Keperluan keluarga mendadak",requestKey:key};
describe("V1 employee kasbon intake fail closed",()=>{
 it("parses integer IDR with stable request key",()=>{
   expect(parseKasbonSubmission(valid).amount).toBe(250000n);
   expect(parseKasbonSubmission(valid).requestKey).toBe(key);
 });
 it.each([
   {amountIdr:"0"},{amountIdr:"100.25"},{amountIdr:"-200"},
   {amountIdr:"999"},{amountIdr:"1000000000001"},{requestKey:"not-uuid"},
   {purpose:"short"},{status:"APPROVED"},{clientId:"other"},
   {pegawaiId:"foreign"},{reviewedAt:"2026-10-13"},
 ])("rejects unsupported or tampered request %j",patch=>
   expect(()=>parseKasbonSubmission({...valid,...patch})).toThrow());
 it("permits ONLY rejection or preliminary HOLD, never financial approval",()=>{
   expect(parseKasbonReview({decision:"REVIEW_HOLD"}).decision).toBe("REVIEW_HOLD");
   expect(parseKasbonReview({decision:"REJECT",reason:"Dokumen tidak lengkap"}).decision).toBe("REJECT");
   expect(()=>parseKasbonReview({decision:"APPROVE"})).toThrow();
   expect(()=>parseKasbonReview({decision:"REJECT"})).toThrow();
   expect(()=>parseKasbonReview({decision:"REVIEW_HOLD",status:"PAID"})).toThrow();
 });
 it("derives period server-side from WIB and payroll cycle, including new-year rollover",()=>{
   expect(getWibDate(new Date("2026-10-13T18:00:00Z")).toISOString().slice(0,10)).toBe("2026-10-14");
   const day=(v:string)=>new Date(v+"T00:00:00Z");
   expect(currentKasbonPeriod("A",day("2026-10-01")).gajikuPeriodKey).toBe("2026-10");
   expect(currentKasbonPeriod("B",day("2026-10-15")).gajikuPeriodKey).toBe("2026-09");
   expect(currentKasbonPeriod("C",day("2026-10-20")).gajikuPeriodKey).toBe("2026-09");
   expect(currentKasbonPeriod("D",day("2026-01-25")).gajikuPeriodKey).toBe("2025-12");
   expect(currentKasbonPeriod("D",day("2026-01-26")).gajikuPeriodKey).toBe("2026-01");
 });
 it("rejects absent/weekly/future cutover",()=>{
   expect(()=>parseKasbonStartPeriod(null,"2026-10")).toThrow();
   expect(()=>parseKasbonStartPeriod("W:2026-10-05","2026-10")).toThrow();
   expect(()=>parseKasbonStartPeriod("2026-11","2026-10")).toThrow();
   expect(parseKasbonStartPeriod("2026-09","2026-10")).toBe("2026-09");
 });
});
