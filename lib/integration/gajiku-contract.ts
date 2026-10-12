export type NormalizedKasbon = {
  gajikuTxId:string;email:"";externalTenantId:string;idPegawai:string;
  periode:string;nominal:bigint;adminFee:bigint;status:"sukses";finalApprovedAt:Date;
};
export type GajikuContractScope={tenantId:string;employeeId:string;startPeriod:string;endPeriod:string};
const month=/^\d{4}-(0[1-9]|1[0-2])$/;
/** Fail closed on ANY invalid row; callers must never treat unavailable loans as zero. */
export function parseGajikuKasbon(payload:unknown,scope:GajikuContractScope):NormalizedKasbon[]{
  if(!month.test(scope.startPeriod)||!month.test(scope.endPeriod)||scope.startPeriod>scope.endPeriod)
    throw new Error("Invalid monthly Gajiku scope");
  if(!scope.tenantId.trim()||!scope.employeeId.trim())
    throw new Error("Missing Gajiku identity");
  if(!payload || typeof payload!=="object" || Array.isArray(payload))
    throw new Error("Invalid Gajiku response");
  const response=payload as Record<string,unknown>;
  if(response.tenant_id!==scope.tenantId||response.employee_id!==scope.employeeId||
     !Array.isArray(response.items)||response.items.length>5000)
    throw new Error("Unverified Gajiku response identity");
  const seen=new Set<string>();
  return response.items.map((raw:unknown):NormalizedKasbon=>{
    if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new Error("Malformed Gajiku loan");
    const row=raw as Record<string,unknown>;
    if(typeof row.transaction_id!=="string"||!row.transaction_id.trim()||
       row.transaction_id.length>191||seen.has(row.transaction_id))
       throw new Error("Duplicate or missing Gajiku transaction");
    seen.add(row.transaction_id);
    if(typeof row.period!=="string"||!month.test(row.period)||
       row.period<scope.startPeriod||row.period>scope.endPeriod)
       throw new Error("Unsupported Gajiku transaction period");
    if(typeof row.status!=="string"||row.status.toLowerCase()!=="sukses")
       throw new Error("Only final-success Gajiku loans are deductible");
    if(!Number.isSafeInteger(row.amount)||Number(row.amount)<=0||
       !Number.isSafeInteger(row.admin_fee)||Number(row.admin_fee)<0)
       throw new Error("Invalid Gajiku loan money");
    if(typeof row.final_approved_at!=="string"||!row.final_approved_at.trim())
       throw new Error("Missing final approval timestamp");
    const approved=new Date(row.final_approved_at);
    if(!Number.isFinite(approved.getTime()))throw new Error("Invalid final approval");
    return {
      gajikuTxId:row.transaction_id,email:"",externalTenantId:scope.tenantId,
      idPegawai:scope.employeeId,periode:row.period,nominal:BigInt(row.amount as number),
      adminFee:BigInt(row.admin_fee as number),status:"sukses",finalApprovedAt:approved,
    };
  });
}
