import { describe,it,expect } from "vitest";
import { countLeaveWorkdays, parseLeaveDate, parseLeaveDecision, parseLeaveRequest } from "../lib/leave/workdays";
describe("T2 validated leave workdays",()=>{
 it("counts configured workdays with holidays and leaves weekends out",()=>{
   expect(countLeaveWorkdays(parseLeaveDate("2026-10-19"),parseLeaveDate("2026-10-23"),
     [1,2,3,4,5],["2026-10-21"])).toBe(4);
 });
 it("rejects cross-year, invalid dates, over 31-day periods and malformed holiday rules",()=>{
   expect(()=>parseLeaveDate("2026-02-30")).toThrow();
   expect(()=>countLeaveWorkdays(parseLeaveDate("2026-12-30"),parseLeaveDate("2027-01-02"),[1,2,3,4,5],[])).toThrow();
   expect(()=>countLeaveWorkdays(parseLeaveDate("2026-10-01"),parseLeaveDate("2026-12-01"),[1,2,3],[])).toThrow();
   expect(()=>countLeaveWorkdays(parseLeaveDate("2026-10-20"),parseLeaveDate("2026-10-21"),[1,2,3],null)).toThrow();
 });
 it("prevents client-supplied tenant, employee or approval fields",()=>{
   const body={leaveTypeId:"leave-type",startDate:"2026-10-20",endDate:"2026-10-21",reason:"Family matters"};
   expect(parseLeaveRequest(body).reason).toBe("Family matters");
   expect(()=>parseLeaveRequest({...body,clientId:"other"})).toThrow();
   expect(()=>parseLeaveRequest({...body,status:"DISETUJUI"})).toThrow();
 });
 it("reject requires reason and approve forbids it",()=>{
   expect(parseLeaveDecision({decision:"APPROVE"}).decision).toBe("APPROVE");
   expect(()=>parseLeaveDecision({decision:"REJECT"})).toThrow();
   expect(()=>parseLeaveDecision({decision:"APPROVE",reason:"fake"})).toThrow();
 });
});
