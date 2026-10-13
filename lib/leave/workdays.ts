/** Strictly bounded UTC calendar dates; tenant-configured weekdays & holidays. */
export function parseLeaveDate(value:unknown):Date{
  if(typeof value!=="string"||!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(value))
    throw new Error("Tanggal wajib format YYYY-MM-DD");
  const date=new Date(value+"T00:00:00.000Z");
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)
    throw new Error("Tanggal tidak valid");
  return date;
}
export function countLeaveWorkdays(start:Date,end:Date,workDays:unknown,holidays:unknown):number{
  if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||
    end<start||start.getUTCFullYear()!==end.getUTCFullYear()||
    (end.getTime()-start.getTime())/(24*3600*1000)>30)
    throw new Error("Cuti harus dalam 1 tahun dan maksimum 31 hari kalender");
  if(!Array.isArray(workDays)||workDays.length<1||
     workDays.some(d=>!Number.isInteger(d)||d<0||d>6))
    throw new Error("Hari kerja tenant belum valid");
  if(!Array.isArray(holidays))throw new Error("Konfigurasi hari libur tenant tidak valid");
  const dates=new Set<string>();
  for(const item of holidays){
    const value=typeof item==="string"?item:
      item&&typeof item==="object"&&!Array.isArray(item)?"date" in item?(item as {date:unknown}).date:null:null;
    if(typeof value!=="string")throw new Error("Hari libur tenant tidak valid");
    dates.add(parseLeaveDate(value).toISOString().slice(0,10));
  }
  const weekdays=new Set(workDays as number[]);
  let days=0;
  for(let at=start.getTime();at<=end.getTime();at+=24*3600*1000){
    const date=new Date(at);
    if(weekdays.has(date.getUTCDay())&&!dates.has(date.toISOString().slice(0,10)))days++;
  }
  return days;
}
export function parseLeaveRequest(body:unknown){
  if(!body||typeof body!=="object"||Array.isArray(body))throw new Error("Data tidak valid");
  const v=body as Record<string,unknown>;
  if(Object.keys(v).some(k=>!["leaveTypeId","startDate","endDate","reason"].includes(k)))
    throw new Error("Field tidak diizinkan");
  if(typeof v.leaveTypeId!=="string"||!v.leaveTypeId.trim()||v.leaveTypeId.length>191)
    throw new Error("Jenis cuti tidak valid");
  if(typeof v.reason!=="string"||v.reason.trim().length<5||v.reason.trim().length>1500)
    throw new Error("Alasan cuti wajib 5–1500 karakter");
  return {leaveTypeId:v.leaveTypeId.trim(),start:parseLeaveDate(v.startDate),
    end:parseLeaveDate(v.endDate),reason:v.reason.trim()};
}
export function parseLeaveDecision(body:unknown){
  if(!body||typeof body!=="object"||Array.isArray(body))throw new Error("Keputusan tidak valid");
  const v=body as Record<string,unknown>;
  if(Object.keys(v).some(k=>!["decision","reason"].includes(k)))
    throw new Error("Field keputusan tidak valid");
  if(v.decision!=="APPROVE"&&v.decision!=="REJECT")throw new Error("Keputusan tidak dikenal");
  const reason=typeof v.reason==="string"?v.reason.trim():"";
  if(v.decision==="REJECT"&&(reason.length<5||reason.length>500))
    throw new Error("Alasan penolakan wajib 5–500 karakter");
  if(v.decision==="APPROVE"&&reason.length)throw new Error("Tidak perlu alasan pada persetujuan");
  return {decision:v.decision,reason};
}
