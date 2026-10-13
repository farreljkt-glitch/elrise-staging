import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-server";
import { Prisma } from "@prisma/client";
import { parseLeaveRequest, countLeaveWorkdays } from "@/lib/leave/workdays";
export const runtime="nodejs";

export async function GET(request:Request){
  const actor=await getSession();
  if(!actor||!actor.clientId||actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  if(!["ADMIN","ADMIN_PROJECT","PEGAWAI"].includes(actor.role))
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  if(actor.role==="PEGAWAI"&&!actor.pegawaiId||
    actor.role==="ADMIN_PROJECT"&&!actor.managedProjectId)
    return NextResponse.json({error:"Scope akun tidak ada"},{status:403});
  const status=new URL(request.url).searchParams.get("status");
  if(status&&!["MENUNGGU","DISETUJUI","DITOLAK","DIBATALKAN"].includes(status))
    return NextResponse.json({error:"Filter status tidak valid"},{status:400});
  try{
    const where: Prisma.LeaveRequestWhereInput={
      clientId:actor.clientId,
      ...(actor.role==="PEGAWAI"?{pegawaiId:actor.pegawaiId!}:{}),
      ...(actor.role==="ADMIN_PROJECT"?{pegawai:{projectId:actor.managedProjectId!}}:{}),
      ...(status?{status:status as "MENUNGGU"|"DISETUJUI"|"DITOLAK"|"DIBATALKAN"}:{}),
    };
    const rows=await db.leaveRequest.findMany({
      where,take:100,orderBy:{createdAt:"desc"},
      select:{id:true,reason:true,status:true,startDate:true,endDate:true,
        createdAt:true,reviewedAt:true,reviewReason:true,
        pegawai:{select:{nama:true,idPegawai:true,projectId:true}},
        leaveType:{select:{id:true,name:true,paid:true,unit:true}},
      },
    });
    const result:Record<string,unknown>={rows:rows.map(v=>({
      id:v.id,name:v.pegawai.nama,code:v.pegawai.idPegawai,projectId:v.pegawai.projectId,
      typeId:v.leaveType.id,type:v.leaveType.name,paid:v.leaveType.paid,unit:v.leaveType.unit,
      status:v.status,reason:v.reason,reviewReason:v.reviewReason,
      startDate:v.startDate.toISOString().slice(0,10),endDate:v.endDate.toISOString().slice(0,10),
      createdAt:v.createdAt.toISOString(),reviewedAt:v.reviewedAt?.toISOString()??null,
    }))};
    if(actor.role==="PEGAWAI"){
      const [types,balances]=await Promise.all([
        db.leaveType.findMany({where:{clientId:actor.clientId,isActive:true,unit:"HARI"},
          select:{id:true,name:true,paid:true,unit:true},orderBy:{name:"asc"},take:100}),
        db.leaveBalance.findMany({where:{clientId:actor.clientId,pegawaiId:actor.pegawaiId!},
          select:{leaveTypeId:true,year:true,quota:true,used:true},take:100}),
      ]);
      result.types=types;result.balances=balances;
    }
    return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({error:"Data cuti tidak tersedia"},{status:503});
  }
}

export async function POST(request:Request){
  const actor=await getSession();
  if(!actor||actor.role!=="PEGAWAI"||!actor.clientId||!actor.pegawaiId||actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  let input:ReturnType<typeof parseLeaveRequest>;
  try{input=parseLeaveRequest(await request.json());}
  catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Data tidak valid"},{status:400});}
  try{
    const result=await db.$transaction(async tx=>{
      const employee=await tx.pegawai.findFirst({where:{
        id:actor.pegawaiId!,clientId:actor.clientId!,isActive:true,project:{isActive:true},
      },select:{id:true}});
      const client=await tx.client.findUnique({where:{id:actor.clientId!},
        select:{status:true,setting:{select:{leaveEnabled:true,workDays:true,holidays:true}}}});
      if(!employee||client?.status!=="AKTIF"||!client.setting?.leaveEnabled)
        throw new Error("Modul cuti/pegawai tidak aktif");
      const type=await tx.leaveType.findFirst({where:{
        id:input.leaveTypeId,clientId:actor.clientId!,isActive:true,unit:"HARI"},
        select:{id:true}});
      if(!type)throw new Error("Jenis cuti tidak tersedia");
      const days=countLeaveWorkdays(input.start,input.end,client.setting.workDays,client.setting.holidays);
      if(days===0)throw new Error("Periode tidak memiliki hari kerja");
      const overlap=await tx.leaveRequest.count({where:{
        clientId:actor.clientId!,pegawaiId:actor.pegawaiId!,
        status:{in:["MENUNGGU","DISETUJUI"]},
        startDate:{lte:input.end},endDate:{gte:input.start},
      }});
      if(overlap)throw new Error("Tanggal sudah memiliki pengajuan aktif");
      const created=await tx.leaveRequest.create({data:{
        clientId:actor.clientId!,pegawaiId:actor.pegawaiId!,
        leaveTypeId:input.leaveTypeId,startDate:input.start,
        endDate:input.end,reason:input.reason,
      },select:{id:true,status:true}});
      await tx.auditLog.create({data:{
        actorId:actor.id,clientId:actor.clientId!,action:"CREATE",
        entity:"LeaveRequest",entityId:created.id,
        newValue:{typeId:input.leaveTypeId,workdays:days},
      }});
      return {...created,workdays:days};
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return NextResponse.json(result,{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(e){
    const message=e instanceof Error?e.message:"";
    if(/modul|tidak tersedia|tanggal sudah|hari kerja|31 hari|hari libur/i.test(message))
      return NextResponse.json({error:message},{status:422});
    console.error("Leave submission failed",e instanceof Error?e.name:"unknown");
    return NextResponse.json({error:"Pengajuan cuti gagal"},{status:503});
  }
}
