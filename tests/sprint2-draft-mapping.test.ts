import { describe,it,expect } from "vitest";
import { parseDraftConnection,parseDraftEmployeeMapping } from "../lib/integration/draft-mapping-validation";
describe("Sprint2 draft contract",()=>{
 it("accepts plain identities",()=>{
  expect(parseDraftConnection({clientId:"pt-a",externalTenantId:"external-a"})).toEqual({clientId:"pt-a",externalTenantId:"external-a"});
  expect(parseDraftEmployeeMapping({clientId:"pt-a",pegawaiId:"employee-a",externalEmployeeId:"ext-a"}).externalEmployeeId).toBe("ext-a");
 });
 it.each([{clientId:"",externalTenantId:"ext"},{clientId:"pt-a",externalTenantId:"ext",verifiedAt:new Date()},
  {clientId:"pt-a",externalTenantId:"ext",state:"ACTIVE"},
  {clientId:"pt-a",externalTenantId:"ext",token:"secret"}])("rejects unsafe connection %j",x=>{
   expect(()=>parseDraftConnection(x)).toThrow();
 });
 it.each([{clientId:"pt-a",pegawaiId:"",externalEmployeeId:"e"},
  {clientId:"pt-a",pegawaiId:"e",externalEmployeeId:""},
  {clientId:"pt-a",pegawaiId:"e",externalEmployeeId:"gajiku",verifiedAt:"today"},
  {clientId:"pt-a",pegawaiId:"e",externalEmployeeId:"gajiku",connectionId:"foreign"}])("rejects unsafe mapping %j",x=>{
    expect(()=>parseDraftEmployeeMapping(x)).toThrow();
 });
});
