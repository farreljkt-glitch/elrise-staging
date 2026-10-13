import { describe,it,expect } from "vitest";
import { parseNewPolicy } from "../lib/integration/loan-policy-input";
const today=new Date("2026-10-13T00:00:00.000Z");
const fixed={scope:"EMPLOYEES",pegawaiIds:["employee-a"],mode:"FIXED_IDR",
  fixedAmountIdr:"1000000",denominatorDays:22,effectiveDate:"2026-10-13"};
describe("Sprint2 Admin PT loan policy validation",()=>{
 it("accepts per-employee fixed IDR and future tenant percentage",()=>{
  expect(parseNewPolicy(fixed,today).fixedAmountIdr).toBe("1000000");
  expect(parseNewPolicy({scope:"TENANT_DEFAULT",pegawaiIds:[],
    mode:"PERCENT_OF_PRE_KASBON_THP",percentBps:2500,
    denominatorDays:22,effectiveDate:"2026-11-01"},today).percentBps).toBe(2500);
 });
 it.each([
  {scope:"EMPLOYEES",pegawaiIds:[]},{scope:"TENANT_DEFAULT",pegawaiIds:["employee-a"]},
  {pegawaiIds:["employee-a","employee-a"]},{clientId:"other"},
  {effectiveDate:"2026-10-12"},{effectiveDate:"2026-02-30"},
  {fixedAmountIdr:"-1"},{fixedAmountIdr:"100.50"},{denominatorDays:0},
  {mode:"PERCENT_OF_PRE_KASBON_THP",percentBps:99999,fixedAmountIdr:undefined},
 ])("rejects unsafe input %j",patch=>expect(()=>parseNewPolicy({...fixed,...patch},today)).toThrow());
});
