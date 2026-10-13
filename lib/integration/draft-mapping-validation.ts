/** Strict Elrise-only drafts: client cannot set verifiedAt, state or connection IDs. */
const id=(v:unknown,k:string)=>{
 if(typeof v!=="string"||!v.trim()||v.length>191||/[\x00-\x1f\x7f]/.test(v))throw new Error("Invalid "+k);
 return v.trim();
};
function object(v:unknown,allow:string[]){
 if(!v||typeof v!=="object"||Array.isArray(v))throw new Error("Invalid input");
 const d=v as Record<string,unknown>;
 if(Object.keys(d).some(k=>!allow.includes(k)))throw new Error("Unsupported field");
 return d;
}
export function parseDraftConnection(v:unknown){
 const d=object(v,["clientId","externalTenantId"]);
 return {clientId:id(d.clientId,"clientId"),externalTenantId:id(d.externalTenantId,"externalTenantId")};
}
export function parseDraftEmployeeMapping(v:unknown){
 const d=object(v,["clientId","pegawaiId","externalEmployeeId"]);
 return {clientId:id(d.clientId,"clientId"),pegawaiId:id(d.pegawaiId,"pegawaiId"),
   externalEmployeeId:id(d.externalEmployeeId,"externalEmployeeId")};
}
