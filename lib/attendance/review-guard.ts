/** Review blockers shared by UI-independent domain logic and integration tests. */
export function hasAttendanceFlags(flags:unknown):boolean{
  if(flags===null || flags===undefined)return false;
  if(Array.isArray(flags))return flags.length>0;
  if(typeof flags==="object")return Object.keys(flags).length>0;
  return true;
}
export function canApproveAttendance(record:{
  status:string;checkInAt:Date|null;checkOutAt:Date|null;
  validatedAt:Date|null;suspiciousFlags:unknown;
}):boolean{
  if(record.validatedAt || !["HADIR","TELAT"].includes(record.status))return false;
  if(!record.checkInAt || !record.checkOutAt || record.checkOutAt<=record.checkInAt)return false;
  if(hasAttendanceFlags(record.suspiciousFlags))return false;
  return true;
}
