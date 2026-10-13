import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { parseAdminPtProject } from "@/lib/admin/project-self-service-validation";
export const runtime = "nodejs";

export async function GET(request:Request){
  const actor=await getSession();
  if(!actor || actor.role!=="ADMIN" || !actor.clientId || actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  const all=new URL(request.url).searchParams.get("all")==="1";
  try{
    const projects=await db.project.findMany({
      where:{clientId:actor.clientId,client:{status:"AKTIF"},...(!all?{isActive:true}:{})},
      select:{id:true,name:true,code:true,isActive:true,
        _count:{select:{employees:true,projectManagers:true}}},
      orderBy:{name:"asc"},take:250,
    });
    return NextResponse.json({projects,limited:projects.length===250},
      {headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({error:"Gagal memuat project"},{status:503});
  }
}

/** Project belongs to actor.clientId; no input key can choose another tenant. */
export async function POST(request:Request){
  const actor=await getSession();
  if(!actor||actor.role!=="ADMIN"||!actor.clientId||actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  if(!(request.headers.get("content-type")??"").includes("application/json"))
    return NextResponse.json({error:"JSON diperlukan"},{status:415});
  let input:ReturnType<typeof parseAdminPtProject>;
  try{input=parseAdminPtProject(await request.json(),actor.clientId);}
  catch{return NextResponse.json({error:"Hanya kode dan nama project yang boleh dikirim"},{status:400});}
  try{
    const project=await db.$transaction(async tx=>{
      const client=await tx.client.findUnique({
        where:{id:actor.clientId!},select:{status:true},
      });
      if(client?.status!=="AKTIF")throw new Error("INACTIVE_TENANT");
      const row=await tx.project.create({data:{
        clientId:actor.clientId!,code:input.code,name:input.name,
      },select:{id:true,code:true,name:true,clientId:true,isActive:true}});
      await tx.auditLog.create({data:{
        actorId:actor.id,clientId:actor.clientId!,action:"CREATE",
        entity:"Project",entityId:row.id,newValue:{code:row.code,name:row.name},
      }});
      return row;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return NextResponse.json({project},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch(e){
    if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002")
      return NextResponse.json({error:"Kode atau nama project sudah digunakan di PT ini"},{status:409});
    if(e instanceof Error&&e.message==="INACTIVE_TENANT")
      return NextResponse.json({error:"PT tidak aktif"},{status:403});
    console.error("Admin PT project create failed",e instanceof Error?e.name:"unknown");
    return NextResponse.json({error:"Gagal membuat project"},{status:503});
  }
}
