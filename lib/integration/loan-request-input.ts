import { calculatePayrollPeriodRange, type PayrollCycleType } from "./period-mapping";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const month=/^20\\d{2}-(0[1-9]|1[0-2])$/;
export const MAX_REQUEST_IDR=1_000_000_000_000n;

export function parseKasbonSubmission(value:unknown){
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Payload tidak valid");
  const obj=value as Record<string,unknown>;
  if(Object.keys(obj).some(k=>!["amountIdr","purpose","requestKey"].includes(k)))
    throw new Error("Field kasbon tidak diizinkan");
  if(typeof obj.amountIdr!=="string"||!/^[1-9]\\d{0,12}$/.test(obj.amountIdr))
    throw new Error("Nominal wajib rupiah bulat positif");
  const amount=BigInt(obj.amountIdr);
  if(amount<10_000n||amount>MAX_REQUEST_IDR)throw new Error("Nominal di luar batas pengajuan");
  if(typeof obj.purpose!=="string"||obj.purpose.trim().length<10||
     obj.purpose.trim().length>500)throw new Error("Alasan wajib 10 sampai 500 karakter");
  if(typeof obj.requestKey!=="string"||!uuid.test(obj.requestKey))
    throw new Error("Kunci request tidak valid");
  return {amount,purpose:obj.purpose.trim(),requestKey:obj.requestKey.toLowerCase()};
}
export function parseKasbonReview(value:unknown){
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Payload tidak valid");
  const obj=value as Record<string,unknown>;
  if(Object.keys(obj).some(k=>!["decision","reason"].includes(k)))
    throw new Error("Field keputusan tidak diizinkan");
  if(obj.decision!=="REVIEW_HOLD"&&obj.decision!=="REJECT")
    throw new Error("Keputusan tidak valid; pembayaran tidak didukung");
  const reason=typeof obj.reason==="string"?obj.reason.trim():"";
  if(obj.decision==="REJECT"&&(reason.length<10||reason.length>500))
    throw new Error("Penolakan wajib disertai alasan 10 sampai 500 karakter");
  if(obj.decision==="REVIEW_HOLD"&&reason.length>500)
    throw new Error("Catatan terlalu panjang");
  if(obj.reason!==undefined&&typeof obj.reason!=="string")
    throw new Error("Catatan tidak valid");
  return {decision:obj.decision,reason:reason||null};
}
/** Date-only WIB clock, stable even when Node runs UTC. */
export function getWibDate(now:Date):Date{
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Jakarta",
    year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const get=(type:string)=>parts.find(x=>x.type===type)?.value;
  const result=new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00.000Z`);
  if(!Number.isFinite(result.getTime()))throw new Error("Jam WIB tidak valid");
  return result;
}
export function currentKasbonPeriod(cycle:PayrollCycleType,today:Date){
  if(!Number.isFinite(today.getTime())||today.getUTCHours()!==0||
      today.getUTCMinutes()!==0||today.getUTCSeconds()!==0)
    throw new Error("Tanggal operasional harus WIB date-only");
  if(!["A","B","C","D"].includes(cycle))throw new Error("Siklus tidak valid");
  const start={A:1,B:16,C:21,D:26}[cycle];
  const anchorYear=today.getUTCFullYear();
  const anchorMonth=today.getUTCMonth()+1;
  const first=new Date(Date.UTC(anchorYear,anchorMonth-1+(today.getUTCDate()<start?-1:0),1));
  const range=calculatePayrollPeriodRange(cycle,first.getUTCFullYear(),first.getUTCMonth()+1);
  if(today<range.startDate||today>range.endDate)throw new Error("Hari di luar siklus");
  return range;
}
export function parseKasbonStartPeriod(value:unknown,currentPeriod:string){
  if(typeof value!=="string"||!month.test(value)||!month.test(currentPeriod)||value>currentPeriod)
    throw new Error("Cutover kasbon bulanan belum dikonfigurasi");
  return value;
}
