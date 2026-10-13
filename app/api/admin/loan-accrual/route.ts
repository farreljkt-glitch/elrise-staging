import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { calculatePayrollPeriodRange } from "@/lib/integration/period-mapping";
import { countVerifiedHadir } from "@/lib/integration/validated-hadir";
export const runtime="nodejs";

/** Elrise-only readiness: NO disbursable amount without finance-approved THP and Gajiku outstanding. */
export async function GET(request:Request){
 const actor=await getSession();
 if(!actor||actor.role!=="ADMIN"||!actor.clientId||actor.mustChangePassword)
   return NextResponse.json({error:"Tidak diizinkan"},{status:403});
 const url=new URL(request.url);
 const pegawaiId=url.searchParams.get("pegawaiId")?.trim()||"";
 const period=url.searchParams.get("period")||"";
 if(!pegawaiId||pegawaiId.length>191||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(period))
   return NextResponse.json({error:"Pegawai atau periode tidak valid"},{status:400});
 try{
   const employee=await db.pegawai.findFirst({where:{
     id:pegawaiId,clientId:actor.clientId,isActive:true,project:{isActive:true},
   },select:{id:true,idPegawai:true,nama:true,siklusGaji:true}});
   if(!employee)return NextResponse.json({error:"Pegawai tidak ditemukan di PT Anda"},{status:404});
   const [year,month]=period.split("-").map(Number);
   const cycle=employee.siklusGaji;
   const range=calculatePayrollPeriodRange(cycle,year,month);
   // Attendance stores WIB calendar days in MySQL @db.Date, not UTC server dates.
   const wibParts=new Intl.DateTimeFormat("en-US",{
     timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit",
   }).formatToParts(new Date());
   const val=(type:string)=>wibParts.find(p=>p.type===type)?.value??"";
   const today=new Date(val("year")+"-"+val("month")+"-"+val("day")+"T00:00:00.000Z");
   const periodEndDate=new Date(range.endDate.toISOString().slice(0,10)+"T00:00:00.000Z");
   const cutoff=today<periodEndDate?today:periodEndDate;
   const [attendance,subscription,connection,mapping,settings,override,defaultPolicy]=await Promise.all([
     db.attendance.findMany({where:{
       clientId:actor.clientId,pegawaiId:employee.id,status:"HADIR",
       tanggal:{gte:range.startDate,lte:cutoff},
       validatedAt:{not:null},checkInAt:{not:null},checkOutAt:{not:null},
     },select:{tanggal:true,status:true,checkInAt:true,checkOutAt:true,
       validatedAt:true,suspiciousFlags:true},take:370}),
     db.bundleSubscription.findUnique({where:{clientId:actor.clientId},
       select:{mode:true,effectiveAt:true}}),
     db.integrationConnection.findUnique({where:{clientId:actor.clientId},
       select:{id:true,state:true,payrollOwner:true,verifiedAt:true}}),
     db.integrationEmployeeMap.findUnique({where:{pegawaiId:employee.id},
       select:{connectionId:true,clientId:true,verifiedAt:true}}),
     db.clientSetting.findUnique({where:{clientId:actor.clientId},
       select:{attendanceEnabled:true,kasbonGajikuEnabled:true,kasbonStartPeriod:true}}),
     db.bundleLoanPolicy.findFirst({where:{clientId:actor.clientId,pegawaiId:employee.id,
       effectiveAt:{lte:range.startDate}},orderBy:[{effectiveAt:"desc"},{createdAt:"desc"},{id:"desc"}],
       select:{id:true,mode:true,percentBps:true,fixedAmount:true,denominatorDays:true,effectiveAt:true}}),
     db.bundleLoanPolicy.findFirst({where:{clientId:actor.clientId,pegawaiId:null,
       effectiveAt:{lte:range.startDate}},orderBy:[{effectiveAt:"desc"},{createdAt:"desc"},{id:"desc"}],
       select:{id:true,mode:true,percentBps:true,fixedAmount:true,denominatorDays:true,effectiveAt:true}}),
   ]);
   if(attendance.length>=370)
     return NextResponse.json({error:"Data absensi melebihi batas aman untuk preview"},{status:409});
   const days=countVerifiedHadir(attendance,range.startDate,range.endDate,today);
   const policy=override??defaultPolicy;
   const verified=Boolean(subscription?.mode==="BUNDLE" &&
     subscription.effectiveAt<=range.startDate &&
     connection?.state==="ACTIVE" && connection.verifiedAt &&
     connection.payrollOwner==="ELRISE" && mapping?.verifiedAt &&
     mapping.clientId===actor.clientId && mapping.connectionId===connection.id &&
     settings?.attendanceEnabled && settings.kasbonGajikuEnabled &&
     settings.kasbonStartPeriod && settings.kasbonStartPeriod<=period);
   const blockers=[
     ...(!verified?["BUNDLE_MAPPING_OR_CUTOVER_UNVERIFIED"]:[]),
     ...(!policy?["NO_EFFECTIVE_POLICY_AT_PERIOD_START"]:[]),
     "PRE_KASBON_THP_NOT_FINANCE_VERIFIED",
     "GAJIKU_OUTSTANDING_AND_RESERVATIONS_NOT_RECONCILED",
   ];
   return NextResponse.json({
     employee:{id:employee.id,code:employee.idPegawai,name:employee.nama,cycle},
     period:{code:period,start:range.startDate.toISOString().slice(0,10),
       end:range.endDate.toISOString().slice(0,10),asOf:today.toISOString().slice(0,10)},
     validatedHadirDays:days,
     policy:policy?{id:policy.id,mode:policy.mode,percentBps:policy.percentBps,
       fixedAmountIdr:policy.fixedAmount?.toString()??null,
       denominatorDays:policy.denominatorDays,effectiveAt:policy.effectiveAt.toISOString()}:null,
     availableLoanIdr:null,readyForDisbursement:false,blockers,
     notice:"Hanya hitung hari HADIR sah; BELUM nilai plafon kasbon. Tidak ada akses Gajiku dari endpoint ini.",
   },{headers:{"Cache-Control":"no-store"}});
 }catch(e){
   console.error("Loan attendance readiness failed",e instanceof Error?e.name:"unknown");
   return NextResponse.json({error:"Rekap HADIR tidak tersedia"},{status:503});
 }
}
