import {describe,it,expect} from "vitest";
import {parseNewClient,parseNewProject} from "../lib/superadmin/validation";
describe("superadmin allowlist",()=>{
  it("normalizes valid client and project",()=>{
    expect(parseNewClient({code:"pt_demo",name:"PT Demo"})).toEqual({code:"PT_DEMO",name:"PT Demo"});
    expect(parseNewProject({clientId:"c1",code:"ops-1",name:"Operasional"}).code).toBe("OPS-1");
  });
  it.each([{code:"x",name:"Valid"},{code:"GOOD",name:"x"},{code:"GOOD",name:"Valid",status:"AKTIF"},{code:"GOOD",name:"Valid",id:"hacked"}])("rejects invalid or mass-assigned client",x=>expect(()=>parseNewClient(x)).toThrow());
  it.each([{clientId:"",code:"PROJECT",name:"Valid"},{clientId:"a",code:"x",name:"Valid"},{clientId:"a",code:"PROJECT",name:"Valid",isActive:false}])("rejects invalid project",x=>expect(()=>parseNewProject(x)).toThrow());
});
