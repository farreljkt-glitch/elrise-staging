import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-server";
import { Prisma } from "@prisma/client";
import { countLeaveWorkdays, parseLeaveDecision } from "@/lib/leave/workdays";
export const runtime="nodejs";
type Context={params:Promise<{id:string}>};
export async function PATCH(request:Request,ctx:Context){
  const actor=await getSession();
  if(!actor||!actor.clientId||actor.mustChangePassword||
    !["ADMIN","ADMIN_PROJECT"].includes(actor.role)||
    actor.role==="ADMIN_PROJECT"&&!actor.managedProjectId)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  let decision:ReturnType<typeof parseLeaveDecision>;
  try{decision=parseLeaveDecision(await request.json());}
  catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Data tidak valid"},{status:400});}
  const {id}=await ctx.params;
  if(!id||id.length>191)return NextResponse.json({error:"ID cuti tidak valid"},{status:400});
  try{
    const result=await db.$transaction(async tx=>{
      const item=await tx.leaveRequest.findFirst({where:{
        id,clientId:actor.clientId!,
        ...(actor.role==="ADMIN_PROJECT"?{pegawai:{projectId:actor.managedProjectId!}}:{}),
      },include:{pegawai:{select:{projectId:true,isActive:true}},
        leaveType:{select:{unit:true,paid:true}},
      }});
      if(!item)return "NOT_FOUND";
      if(item.status!=="MENUNGGU")return "ALREADY_REVIEWED";
      if(!item.pegawai.isActive)return "INACTIVE";
      let days=0;
      if(decision.decision==="APPROVE"){
        const client=await tx.client.findUnique({where:{id:actor.clientId!},
          select:{status:true,setting:{select:{leaveEnabled:true,workDays:true,holidays:true}}}});
        if(client?.status!=="AKTIF"||!client.setting?.leaveEnabled||item.leaveType.unit!=="HARI")
          return "INACTIVE";
        days=countLeaveWorkdays(item.startDate,item.endDate,
          client.setting.workDays,client.setting.holidays);
        if(days<1)return "INSUFFICIENT";
        const actualAttendance=await tx.attendance.count({where:{
          clientId:actor.clientId!,pegawaiId:item.pegawaiId,
          tanggal:{gte:item.startDate,lte:item.endDate},
          checkInAt:{not:null},
        }});
        if(actualAttendance)return "ATTENDANCE_CONFLICT";
      }
      const updated=await tx.leaveRequest.updateMany({where:{
        id:item.id,clientId:actor.clientId!,status:"MENUNGGU",
      },data:{
        status:decision.decision==="APPROVE"?"DISETUJUI":"DITOLAK",
        reviewedById:actor.id,reviewedAt:new Date(),
        reviewReason:decision.decision==="REJECT"?decision.reason:null,
      }});
      if(updated.count!==1)return "ALREADY_REVIEWED";
      if(decision.decision==="APPROVE"&&item.leaveType.paid){
        const balance=await tx.leaveBalance.findUnique({where:{
          pegawaiId_leaveTypeId_year:{
            pegawaiId:item.pegawaiId,leaveTypeId:item.leaveTypeId,
            year:item.startDate.getUTCFullYear(),
          },
        }});
        if(!balance||balance.clientId!==actor.clientId||balance.quota-balance.used<days)
          throw new Error("INSUFFICIENT");
        const changed=await tx.leaveBalance.updateMany({where:{
          id:balance.id,clientId:actor.clientId!,used:{lte:balance.quota-days},
        },data:{used:{increment:days}}});
        if(changed.count!==1)throw new Error("INSUFFICIENT");
      }
      await tx.auditLog.create({data:{
        clientId:actor.clientId!,actorId:actor.id,action:decision.decision==="APPROVE"?"APPROVE":"REJECT",
        entity:"LeaveRequest",entityId:item.id,
        oldValue:{status:"MENUNGGU"},
        newValue:{status:decision.decision==="APPROVE"?"DISETUJUI":"DITOLAK",
          reviewerRole:actor.role,workdays:days},
      }});
      return decision.decision==="APPROVE"?"APPROVED":"REJECTED";
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    if(result==="NOT_FOUND")return NextResponse.json({error:"Pengajuan tidak ditemukan dalam scope"},{status:404});
    if(result==="ALREADY_REVIEWED")return NextResponse.json({error:"Pengajuan sudah diproses"},{status:409});
    if(result==="INACTIVE")return NextResponse.json({error:"Modul, pegawai atau jenis cuti tidak aktif"},{status:422});
    if(result==="ATTENDANCE_CONFLICT")return NextResponse.json({error:"Sudah ada absensi pada rentang cuti; butuh koreksi terlebih dahulu"},{status:422});
    if(result==="INSUFFICIENT")return NextResponse.json({error:"Hari kerja/saldo cuti tidak mencukupi"},{status:422});
    return NextResponse.json({result},{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    if(e instanceof Error&&/INSUFFICIENT|31 hari|hari libur|hari kerja/.test(e.message))
      return NextResponse.json({error:"Saldo/konfigurasi cuti tidak mencukupi"},{status:422});
    console.error("Leave review failed",e instanceof Error?e.name:"unknown");
    return NextResponse.json({error:"Review cuti gagal"},{status:503});
  }
}
