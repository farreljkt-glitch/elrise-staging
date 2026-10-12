import {describe,it,expect} from "vitest";
import {parseGajikuKasbon} from "../lib/integration/gajiku-contract";
const scope={tenantId:"gajiku-tenant-a",employeeId:"employee-a",startPeriod:"2026-10",endPeriod:"2026-10"};
const valid={tenant_id:"gajiku-tenant-a",employee_id:"employee-a",items:[
 {transaction_id:"tx-1",period:"2026-10",amount:250000,admin_fee:5000,status:"sukses",final_approved_at:"2026-10-10T10:00:00Z"},
]};
describe("Gajiku V1 contract fail closed",()=>{
  it("accepts a verified final-approved loan",()=>{
    const loans=parseGajikuKasbon(valid,scope);
    expect(loans[0].nominal).toBe(250000n);
    expect(loans[0].adminFee).toBe(5000n);
    expect(loans[0].idPegawai).toBe(scope.employeeId);
  });
  it.each([
    {...valid,tenant_id:"tenant-b"},
    {...valid,employee_id:"employee-b"},
    {...valid,items:[{...valid.items[0],status:"on-proses"}]},
    {...valid,items:[{...valid.items[0],period:"2026-09"}]},
    {...valid,items:[{...valid.items[0],period:"W:2026-10-05"}]},
    {...valid,items:[{...valid.items[0],final_approved_at:null}]},
    {...valid,items:[{...valid.items[0],amount:0}]},
    {...valid,items:[{...valid.items[0],amount:1.5}]},
    {...valid,items:[valid.items[0],valid.items[0]]},
  ])("rejects mismatched or unsafe upstream payload",payload=>{
    expect(()=>parseGajikuKasbon(payload,scope)).toThrow();
  });
  it("rejects missing or overlapping cutover scope",()=>{
    expect(()=>parseGajikuKasbon(valid,{...scope,startPeriod:"2026-11"})).toThrow();
    expect(()=>parseGajikuKasbon(valid,{...scope,startPeriod:"W:2026-10-05"})).toThrow();
  });
});
