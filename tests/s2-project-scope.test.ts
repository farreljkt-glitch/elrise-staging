import {describe,it,expect} from "vitest";
import {assertProjectActor,assertProjectResource} from "../lib/project/scope";
const actor={role:"ADMIN_PROJECT",clientId:"tenant-a",managedProjectId:"project-a"};
describe("Admin Project scope",()=>{
  it("permits assigned project and tenant",()=>{
    const scope=assertProjectActor(actor);
    expect(scope).toEqual({clientId:"tenant-a",projectId:"project-a"});
    expect(()=>assertProjectResource(scope,{clientId:"tenant-a",projectId:"project-a"})).not.toThrow();
  });
  it.each([{...actor,role:"ADMIN"},{...actor,clientId:null},{...actor,managedProjectId:null},null])("denies undefined scope",input=>{
    expect(()=>assertProjectActor(input)).toThrow();
  });
  it("denies other projects and tenants",()=>{
    const scope=assertProjectActor(actor);
    expect(()=>assertProjectResource(scope,{clientId:"tenant-a",projectId:"project-b"})).toThrow();
    expect(()=>assertProjectResource(scope,{clientId:"tenant-b",projectId:"project-a"})).toThrow();
  });
});
