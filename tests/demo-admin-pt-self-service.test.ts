import {describe,it,expect} from "vitest";
import {parseAdminPtProject,parseAdminPtProjectInvite} from "../lib/admin/project-self-service-validation";
describe("Demo Admin PT strict tenant and role input",()=>{
  it("derives project tenant from authenticated actor",()=>{
    expect(parseAdminPtProject({code:"site-scbd",name:"Site SCBD"},"tenant-a"))
      .toEqual({clientId:"tenant-a",code:"SITE-SCBD",name:"Site SCBD"});
  });
  it("refuses project mass assignment",()=>{
    for(const extra of [{clientId:"tenant-b"},{isActive:true},{id:"forged"},{createdBy:"other"}]){
      expect(()=>parseAdminPtProject({code:"SITE-SCBD",name:"Site SCBD",...extra},"tenant-a")).toThrow();
    }
  });
  it("fixes role ADMIN_PROJECT & clientId server-side",()=>{
    expect(parseAdminPtProjectInvite({projectId:"a2",name:"Manager SCBD",email:"manager.scbd@ptdemo.test"},"tenant-a"))
      .toEqual({clientId:"tenant-a",role:"ADMIN_PROJECT",projectId:"a2",
        name:"Manager SCBD",email:"manager.scbd@ptdemo.test"});
  });
  it.each([{role:"SUPERADMIN"},{role:"ADMIN"},{clientId:"tenant-b"},
    {managedProjectId:"project-b"},{isActive:true},{passwordHash:"arbitrary"},
    {tokenVersion:0},{mustChangePassword:false}])("rejects Admin PT invite escalation %j",patch=>{
    expect(()=>parseAdminPtProjectInvite({
      projectId:"a2",name:"Manager SCBD",email:"manager.scbd@ptdemo.test",...patch,
    },"tenant-a")).toThrow();
  });
});
