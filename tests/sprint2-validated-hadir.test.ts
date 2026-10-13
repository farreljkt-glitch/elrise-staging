import {describe,it,expect} from "vitest";
import {countVerifiedHadir,type AttendanceEvidence} from "../lib/integration/validated-hadir";
const date=(d:string)=>new Date(d+"T00:00:00.000Z");
const approved:AttendanceEvidence={tanggal:date("2026-10-10"),status:"HADIR",
  checkInAt:new Date("2026-10-10T01:00:00Z"),checkOutAt:new Date("2026-10-10T09:00:00Z"),
  validatedAt:new Date("2026-10-10T10:00:00Z"),suspiciousFlags:null};
const count=(items:AttendanceEvidence[],cutoff=date("2026-10-13"))=>
  countVerifiedHadir(items,date("2026-10-01"),date("2026-10-31"),cutoff);
describe("V1 loan accrual counts ONLY validated HADIR",()=>{
 it("counts complete, approved HADIR once per calendar date",()=>{
  expect(count([approved,approved])).toBe(1);
 });
 it.each([
  {status:"TELAT"},{status:"CUTI"},{checkOutAt:null},
  {checkInAt:null},{validatedAt:null},
  {validatedAt:new Date("2026-10-10T08:00:00Z")},
  {checkOutAt:new Date("2026-10-10T00:30:00Z")},
  {suspiciousFlags:["GPS_UNVERIFIED_IP_FALLBACK"]},
  {suspiciousFlags:{flag:"SUSPECT"}},
  {tanggal:date("2026-09-30")},{tanggal:date("2026-11-01")},
 ])("excludes invalid evidence %j",delta=>{
  expect(count([{...approved,...delta}])).toBe(0);
 });
 it("does not count future dates as of today",()=>expect(count([approved],date("2026-10-09"))).toBe(0));
 it("rejects invalid date intervals",()=>expect(()=>
   countVerifiedHadir([approved],date("2026-11-01"),date("2026-10-01"),date("2026-10-13"))).toThrow());
});
