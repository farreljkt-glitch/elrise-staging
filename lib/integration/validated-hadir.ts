import { hasAttendanceFlags } from "../attendance/review-guard";
/** Only fully reviewed HADIR (not TELAT) dates count toward V1 loan accrual. */
export type AttendanceEvidence={
  tanggal:Date;status:string;checkInAt:Date|null;checkOutAt:Date|null;
  validatedAt:Date|null;suspiciousFlags:unknown;
};
export function countVerifiedHadir(
  records:AttendanceEvidence[],periodStart:Date,periodEnd:Date,asOf:Date,
):number{
  if(!Number.isFinite(periodStart.getTime())||!Number.isFinite(periodEnd.getTime())||
    !Number.isFinite(asOf.getTime())||periodStart>periodEnd)throw new Error("Invalid period");
  const days=new Set<string>();
  const limit=asOf<periodEnd?asOf:periodEnd;
  for(const r of records){
    const date=r.tanggal;
    if(!date||!Number.isFinite(date.getTime())||date<periodStart||date>limit ||
      r.status!=="HADIR"||!r.checkInAt||!r.checkOutAt||!r.validatedAt ||
      r.checkOutAt<=r.checkInAt||r.validatedAt<r.checkOutAt ||
      hasAttendanceFlags(r.suspiciousFlags))continue;
    days.add(date.toISOString().slice(0,10));
  }
  return days.size;
}
