import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { parseNewProject } from "@/lib/superadmin/validation";
export const runtime="nodejs";
export async function GET(req:Request){
  const actor=await getSession();
  if(!actor||actor.role!=="SUPERADMIN"||actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  const url=new URL(req.url);const clientId=url.searchParams.get("clientId")||"";
  if(!clientId||clientId.length>191)return NextResponse.json({error:"Tenant wajib"},{status:400});
  try{
    const projects=await db.project.findMany({where:{clientId},
      select:{id:true,clientId:true,code:true,name:true,isActive:true,_count:{select:{employees:true}}},
      orderBy:{name:"asc"},take:200});
    return NextResponse.json({projects},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Gagal memuat proyek"},{status:503});}
}
export async function POST(req:Request){
  const actor=await getSession();
  if(!actor||actor.role!=="SUPERADMIN"||actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  let input:ReturnType<typeof parseNewProject>;
  try{input=parseNewProject(await req.json());}
  catch{return NextResponse.json({error:"Data proyek tidak valid"},{status:400});}
  try{
    const result=await db.$transaction(async tx=>{
      const client=await tx.client.findUnique({where:{id:input.clientId},select:{status:true}});
      if(client?.status!=="AKTIF")throw new Error("Inactive tenant");
      const project=await tx.project.create({data:input,select:{id:true,code:true,name:true,clientId:true}});
      await tx.auditLog.create({data:{actorId:actor.id,clientId:input.clientId,action:"CREATE",
        entity:"Project",entityId:project.id,newValue:{code:project.code}}});
      return project;
    });
    return NextResponse.json({project:result},{status:201});
  }catch(error){
    const message=error instanceof Error?error.message:"";
    if(/P2002|Unique constraint/.test(message))return NextResponse.json({error:"Kode atau nama proyek telah dipakai"},{status:409});
    if(/Inactive tenant/.test(message))return NextResponse.json({error:"Tenant tidak aktif"},{status:403});
    return NextResponse.json({error:"Gagal membuat proyek"},{status:503});
  }
}
