import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { assertProjectActor } from "@/lib/project/scope";
export const runtime="nodejs";
export async function GET(request:Request){
  const requestedProjectId=new URL(request.url).searchParams.get("projectId");
  const actor=await getSession();
  let scope;
  try{scope=assertProjectActor(actor ? {role:actor.role,clientId:actor.clientId,managedProjectId:actor.managedProjectId??null}:null);}
  catch{return NextResponse.json({error:"Tidak diizinkan"},{status:403});}
  if(requestedProjectId && requestedProjectId!==scope.projectId)
    return NextResponse.json({error:"Project di luar penugasan"},{status:403});
  const project=await db.project.findFirst({where:{id:scope.projectId,clientId:scope.clientId,isActive:true},select:{name:true}});
  if(!project)return NextResponse.json({error:"Project tidak aktif atau tidak dimiliki tenant"},{status:403});
  try{
    const employees=await db.pegawai.findMany({
      where:{clientId:scope.clientId,projectId:scope.projectId},take:200,orderBy:{nama:"asc"},
      select:{id:true,idPegawai:true,nama:true,jabatan:true,isActive:true},
    });
    return NextResponse.json({project:project.name,employees,limited:employees.length===200},
      {headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Data proyek tidak tersedia"},{status:503});}
}
