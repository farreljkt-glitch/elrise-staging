import {describe,it,expect} from "vitest";
import {parseCreateLeaveType,parseGrantLeaveBalances} from "../lib/leave/admin-validation";
describe("T3 leave policy and initial balances",()=>{
 it("permits a typed leave policy",()=>{
  expect(parseCreateLeaveType({name:"Cuti Tahunan",paid:true,annualQuota:12}).annualQuota).toBe(12);
 });
 it.each([{name:"a",paid:true,annualQuota:12},{name:"Cuti",paid:"true",annualQuota:12},
  {name:"Cuti",paid:true,annualQuota:-1},{name:"Cuti",paid:true,annualQuota:366},
  {name:"Cuti",paid:true,annualQuota:12,clientId:"foreign"}])("rejects invalid/mass-assigned types",value=>{
   expect(()=>parseCreateLeaveType(value)).toThrow();
 });
 it("validates bounded tenant-derived assignments",()=>{
  const input={leaveTypeId:"t1",year:2026,quota:12,employeeIds:["a","b"]};
  expect(parseGrantLeaveBalances(input).employeeIds).toHaveLength(2);
  expect(()=>parseGrantLeaveBalances({...input,employeeIds:["a","a"]})).toThrow();
  expect(()=>parseGrantLeaveBalances({...input,employeeIds:Array.from({length:101},(_,i)=>String(i))})).toThrow();
  expect(()=>parseGrantLeaveBalances({...input,clientId:"foreign"})).toThrow();
  expect(()=>parseGrantLeaveBalances({...input,quota:-1})).toThrow();
 });
});
