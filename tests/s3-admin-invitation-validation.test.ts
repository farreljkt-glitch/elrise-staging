import { describe,it,expect } from "vitest";
import { parseInviteAdmin } from "../lib/superadmin/admin-invitation-validation";
const valid={clientId:"tenant-a",name:"Admin Contoh",email:"  ADMIN@EXAMPLE.COM ",role:"ADMIN_PROJECT",projectId:"project-a"};
describe("S3 privileged admin invitation validation",()=>{
  it("normalizes explicit tenant and project assignment",()=>{
    expect(parseInviteAdmin(valid)).toEqual({...valid,email:"admin@example.com"});
  });
  it("allows tenant-only Admin PT",()=>{
    expect(parseInviteAdmin({...valid,role:"ADMIN",projectId:null}).role).toBe("ADMIN");
  });
  it.each([
    {role:"SUPERADMIN"},{clientId:""},{name:"a"},{email:"invalid"},
    {projectId:null},{projectId:""},
    {isActive:true},{passwordHash:"hijack"},{managedProjectId:"other"},{role:"ADMIN",projectId:"project-a"},
  ])("rejects malformed/mass-assigned elevated role %j",patch=>{
    expect(()=>parseInviteAdmin({...valid,...patch})).toThrow();
  });
});
