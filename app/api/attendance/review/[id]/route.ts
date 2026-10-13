import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { canApproveAttendance } from "@/lib/attendance/review-guard";
export const runtime="nodejs";
type Context={params:Promise<{id:string}>};

export async function POST(request:Request,context:Context){
  const actor=await getSession();
  if(!actor || !actor.clientId || actor.mustChangePassword ||
     !["ADMIN","ADMIN_PROJECT"].includes(actor.role))
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  if(actor.role==="ADMIN_PROJECT" && !actor.managedProjectId)
    return NextResponse.json({error:"Project penugasan tidak tersedia"},{status:403});
  let body:unknown;
  try{body=await request.json();}
  catch{return NextResponse.json({error:"Payload tidak valid"},{status:400});}
  if(!body || typeof body!=="object" || Array.isArray(body) ||
     Object.keys(body).length!==1 || (body as {decision?:unknown}).decision!=="APPROVE")
    return NextResponse.json({error:"Hanya persetujuan absensi yang didukung"},{status:400});
  const {id}=await context.params;
  if(!id || id.length>191)return NextResponse.json({error:"ID absensi tidak valid"},{status:400});
  try{
    const result=await db.$transaction(async tx=>{
      const row=await tx.attendance.findFirst({
        where:{
          id,clientId:actor.clientId!,
          ...(actor.role==="ADMIN_PROJECT"?{projectId:actor.managedProjectId!}:{}),
          project:{isActive:true},pegawai:{isActive:true},
        },
        select:{
          id:true,clientId:true,projectId:true,pegawaiId:true,
          checkInAt:true,checkOutAt:true,validatedAt:true,
          status:true,suspiciousFlags:true,
        },
      });
      if(!row)return "NOT_FOUND";
      if(row.validatedAt)return "ALREADY_APPROVED";
      if(!canApproveAttendance(row))return "NOT_REVIEWABLE";
      const updated=await tx.attendance.updateMany({
        where:{id:row.id,clientId:row.clientId,projectId:row.projectId,
          validatedAt:null,status:{in:["HADIR","TELAT"]}},
        data:{validatedAt:new Date()},
      });
      if(updated.count!==1)return "ALREADY_APPROVED";
      await tx.auditLog.create({data:{
        actorId:actor.id,clientId:actor.clientId!,
        action:"APPROVE",entity:"Attendance",entityId:row.id,
        oldValue:{validated:false},newValue:{
          validated:true,projectId:row.projectId,reviewerRole:actor.role,
        },
      }});
      return "APPROVED";
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    if(result==="NOT_FOUND")return NextResponse.json({error:"Absensi tidak ditemukan dalam kewenangan Anda"},{status:404});
    if(result==="ALREADY_APPROVED")return NextResponse.json({error:"Absensi sudah tervalidasi"},{status:409});
    if(result==="NOT_REVIEWABLE")return NextResponse.json({
      error:"Absensi harus lengkap (masuk dan pulang), berstatus HADIR/TELAT dan bebas flag mencurigakan. Tangani anomali melalui alur koreksi terpisah.",
    },{status:422});
    return NextResponse.json({approved:true},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    console.error("Attendance review failed",error instanceof Error?error.name:"unknown");
    return NextResponse.json({error:"Validasi absensi gagal; belum ada perubahan"},{status:503});
  }
}
