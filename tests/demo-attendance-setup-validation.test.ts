import {describe,it,expect} from "vitest";
import {parseAdminPtOffice} from "../lib/admin/attendance-setup-validation";
const valid={projectId:"a2",name:"Kantor Site SCBD",lat:-6.2,lng:106.8,radiusM:100};
describe("Demo GPS office config requires explicit PT ownership and strict shape",()=>{
  it("accepts valid lat/long within allowed radius",()=>{
    expect(parseAdminPtOffice(valid)).toEqual(valid);
  });
  it.each([{clientId:"b"},{projectId:""},{isActive:true},{attendanceEnabled:false},
    {requireSelfie:false},{attendanceNetworkRule:"IP"},{radiusM:10000},
    {lat:91},{lng:-181},{lat:"-6.2"},{radiusM:10}])("rejects unsafe office input %j",extra=>{
    expect(()=>parseAdminPtOffice({...valid,...extra})).toThrow();
  });
});
