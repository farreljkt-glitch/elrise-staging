import { describe,it,expect } from "vitest";
import { canApproveAttendance,hasAttendanceFlags } from "../lib/attendance/review-guard";
const valid={status:"HADIR",checkInAt:new Date("2026-10-12T01:00:00Z"),
  checkOutAt:new Date("2026-10-12T09:00:00Z"),validatedAt:null,suspiciousFlags:null};
describe("T1 attendance validation rules",()=>{
  it("permits complete, clean attendance",()=>{
    expect(canApproveAttendance(valid)).toBe(true);
    expect(canApproveAttendance({...valid,status:"TELAT"})).toBe(true);
  });
  it.each([
    {status:"ALPHA"},{status:"CUTI"},{checkInAt:null},{checkOutAt:null},
    {checkOutAt:new Date("2026-10-12T00:00:00Z")},{validatedAt:new Date()},
    {suspiciousFlags:["geo_spoof"]},{suspiciousFlags:{ip:"mismatch"}},
  ])("rejects incomplete, flagged, non-present or already approved",patch=>{
    expect(canApproveAttendance({...valid,...patch})).toBe(false);
  });
  it("does not flag absent or empty flag collections",()=>{
    expect(hasAttendanceFlags(null)).toBe(false);
    expect(hasAttendanceFlags([])).toBe(false);
    expect(hasAttendanceFlags({})).toBe(false);
  });
});
