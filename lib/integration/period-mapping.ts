// Pemetaan siklus payroll HRIS. Semua tanggal menggunakan UTC date-only agar konsisten antar server.
export type PayrollCycleType="A"|"B"|"C"|"D";
export interface PeriodRange {startDate:Date;endDate:Date;gajikuPeriodKey:string;description:string}
const pad=(n:number)=>String(n).padStart(2,"0");
const date=(y:number,m:number,d:number,h=0)=>new Date(Date.UTC(y,m-1,d,h,0,0));
function lastDay(year:number,month:number){return new Date(Date.UTC(year,month,0)).getUTCDate();}
/**
 * Kontrak default berdasarkan spesifikasi: A mulai tanggal 1, B tanggal 16,
 * C tanggal 21, D tanggal 26. Rentang berakhir sehari sebelum siklus berikutnya.
 * Periode Gajiku memakai bulan awal siklus (YYYY-MM). Untuk tenant yang benar-benar
 * menggunakan payroll mingguan, gunakan mapWeeklyPeriod() dan simpan key W:YYYY-MM-DD.
 */
export function calculatePayrollPeriodRange(cycle:PayrollCycleType,year:number,month:number):PeriodRange{
 if(!Number.isInteger(year)||year<2000||year>2200||!Number.isInteger(month)||month<1||month>12) throw new Error("Tahun atau bulan tidak valid.");
 const startDay:Record<PayrollCycleType,number>={A:1,B:16,C:21,D:26};
 const start=startDay[cycle];
 const startDate=date(year,month,start);
 // Siklus A adalah satu bulan kalender. Siklus B/C/D berakhir sehari sebelum
 // tanggal mulai siklus yang sama pada bulan berikutnya.
 const nextCycleStart = cycle === "A"
   ? date(year, month + 1, 1)
   : date(year, month + 1, start);
 const end = new Date(nextCycleStart.getTime() - 86400000);
 end.setUTCHours(23,59,59,999);
 const key=`${year}-${pad(month)}`;
 const endLabel = `${pad(end.getUTCDate())} ${pad(end.getUTCMonth()+1)} ${end.getUTCFullYear()}`;
 return {startDate,endDate:end,gajikuPeriodKey:key,description:`Siklus ${cycle} (${startDate.toISOString().slice(0,10)} – ${endLabel})`};
}
/** Mingguan harus diberi tanggal awal eksplisit; tidak ditebak dari bulan. */
export function mapWeeklyPeriod(startDateISO:string,days=7):PeriodRange{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(startDateISO)||!Number.isInteger(days)||days<1||days>31) throw new Error("Tanggal awal atau jumlah hari periode mingguan tidak valid.");
 const [y,m,d]=startDateISO.split("-").map(Number); const start=date(y,m,d); const end=new Date(start.getTime()+days*86400000-1000);
 return {startDate:start,endDate:end,gajikuPeriodKey:`W:${startDateISO}`,description:`Periode mingguan ${startDateISO} (${days} hari)`};
}

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;
/** Fail-closed: periode mingguan tidak boleh dibandingkan dengan YYYY-MM secara leksikografis. */
export function validateMonthlyKasbonWindow(startPeriod:string|null|undefined,periodeKey:string){
 if(periodeKey.startsWith("W:")||startPeriod?.startsWith("W:")) throw new Error("Kasbon mingguan belum didukung. Payroll dibatalkan sampai konfigurasi cutoff mingguan tersedia.");
 if(!startPeriod||!MONTH_KEY.test(startPeriod)||!MONTH_KEY.test(periodeKey)||startPeriod>periodeKey) throw new Error("kasbonStartPeriod harus dikonfigurasi sebagai YYYY-MM dan tidak boleh setelah periode payroll.");
 return {startPeriod,periodeKey};
}
