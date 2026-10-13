/** Admin PT policy configuration only; money is never based on gaji pokok. */
export type NewPolicyInput={
  scope:"TENANT_DEFAULT"|"EMPLOYEES";
  pegawaiIds:string[];
  mode:"FIXED_IDR"|"PERCENT_OF_PRE_KASBON_THP";
  percentBps?:number;
  fixedAmountIdr?:string;
  denominatorDays:number;
  effectiveDate:string;
};
export function parseNewPolicy(input:unknown, today=new Date()):NewPolicyInput{
 if(!input||typeof input!=="object"||Array.isArray(input))throw new Error("Payload tidak valid");
 const v=input as Record<string,unknown>;
 if(Object.keys(v).some(k=>!["scope","pegawaiIds","mode","percentBps","fixedAmountIdr","denominatorDays","effectiveDate"].includes(k)))
   throw new Error("Field kebijakan tidak diizinkan");
 const scope=v.scope,mode=v.mode;
 if(scope!=="TENANT_DEFAULT"&&scope!=="EMPLOYEES")throw new Error("Scope tidak valid");
 if(!Array.isArray(v.pegawaiIds) || v.pegawaiIds.length>200 ||
    v.pegawaiIds.some(id=>typeof id!=="string"||!id.trim()||id.length>191) ||
    new Set(v.pegawaiIds).size!==v.pegawaiIds.length) throw new Error("Pilihan pegawai tidak valid");
 if(scope==="TENANT_DEFAULT"&&v.pegawaiIds.length!==0 ||
    scope==="EMPLOYEES"&&v.pegawaiIds.length===0)throw new Error("Scope pegawai tidak konsisten");
 if(mode!=="FIXED_IDR"&&mode!=="PERCENT_OF_PRE_KASBON_THP")throw new Error("Mode plafon tidak valid");
 if(!Number.isInteger(v.denominatorDays)||(v.denominatorDays as number)<1||
    (v.denominatorDays as number)>366)throw new Error("Hari kerja pembagi tidak valid");
 if(typeof v.effectiveDate!=="string"||!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(v.effectiveDate))
   throw new Error("Tanggal berlaku harus YYYY-MM-DD");
 const date=new Date(v.effectiveDate+"T00:00:00.000Z");
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==v.effectiveDate ||
    v.effectiveDate < today.toISOString().slice(0,10))throw new Error("Tanggal berlaku tidak boleh lampau");
 if(mode==="FIXED_IDR"){
   if(typeof v.fixedAmountIdr!=="string"||!/^(0|[1-9]\d{0,12})$/.test(v.fixedAmountIdr)||
     v.percentBps!==undefined)throw new Error("Nominal plafon tidak valid");
 }else{
   if(!Number.isInteger(v.percentBps)||(v.percentBps as number)<0||
      (v.percentBps as number)>10000||v.fixedAmountIdr!==undefined)
      throw new Error("Persentase plafon tidak valid");
 }
 return {scope,pegawaiIds:v.pegawaiIds as string[],mode,
   ...(mode==="FIXED_IDR"?{fixedAmountIdr:v.fixedAmountIdr as string}:{percentBps:v.percentBps as number}),
   denominatorDays:v.denominatorDays as number,effectiveDate:v.effectiveDate};
}
