import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { assertProjectActor } from "@/lib/project/scope";
export const runtime="nodejs";
export async function GET(request:Request){
  const actor=await getSession();let scope;
  try{scope=assertProjectActor(actor?{role:actor.role,clientId:actor.clientId,managedProjectId:actor.managedProjectId??null}:null);}
  catch{return NextResponse.json({error:"Tidak diizinkan"},{status:403});}
  const period=new URL(request.url).searchParams.get("date")||"";
  if(!/^\d{4}-\d{2}-\d{2}$/.test(period)||Number.isNaN(Date.parse(period+"T00:00:00Z"))||
      new Date(period+"T00:00:00Z").toISOString().slice(0,10)!==period)
    return NextResponse.json({error:"Tanggal harus YYYY-MM-DD"},{status:400});
  const project=await db.project.findFirst({where:{id:scope.projectId,clientId:scope.clientId,isActive:true},select:{id:true}});
  if(!project)return NextResponse.json({error:"Project tidak aktif"},{status:403});
  try{
    const attendance=await db.attendance.findMany({
      where:{clientId:scope.clientId,projectId:scope.projectId,tanggal:new Date(period+"T00:00:00Z")},
      take:200,orderBy:{createdAt:"desc"},
      select:{id:true,status:true,checkInAt:true,checkOutAt:true,validatedAt:true,
        pegawai:{select:{idPegawai:true,nama:true}}},
    });
    return NextResponse.json({date:period,rows:attendance.map(a=>({
      id:a.id,code:a.pegawai.idPegawai,name:a.pegawai.nama,status:a.status,
      checkedInAt:a.checkInAt?.toISOString()||null,validated:Boolean(a.validatedAt),
    }))},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Absensi tidak tersedia"},{status:503});}
}
