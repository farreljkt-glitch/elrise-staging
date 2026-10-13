import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
export const runtime="nodejs";
type Context={params:Promise<{id:string}>};

/** Emergency offboarding is a one-way operation: re-onboarding needs a reviewed flow. */
export async function PATCH(req:Request,ctx:Context){
  const actor=await getSession();
  if(!actor || actor.role!=="SUPERADMIN" || actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  let body:unknown;
  try{body=await req.json();}
  catch{return NextResponse.json({error:"Payload tidak valid"},{status:400});}
  if(!body || typeof body!=="object" || Array.isArray(body) ||
     Object.keys(body).length!==1 || (body as {active?:unknown}).active!==false)
    return NextResponse.json({error:"Hanya penonaktifan admin yang didukung"},{status:400});
  const {id}=await ctx.params;
  if(!id || id.length>191)return NextResponse.json({error:"ID tidak valid"},{status:400});
  try{
    const result=await db.$transaction(async tx=>{
      const admin=await tx.user.findUnique({where:{id},
        select:{id:true,role:true,clientId:true,isActive:true,tokenVersion:true},
      });
      if(!admin || !admin.clientId || !["ADMIN","ADMIN_PROJECT"].includes(admin.role))
        return "NOT_FOUND";
      if(!admin.isActive)return "ALREADY_DISABLED";
      const revoked=await tx.user.updateMany({where:{
        id:admin.id,clientId:admin.clientId,role:{in:["ADMIN","ADMIN_PROJECT"]},isActive:true,
      },data:{isActive:false,tokenVersion:{increment:1}}});
      if(revoked.count!==1)return "ALREADY_DISABLED";
      await tx.adminInvitation.updateMany({
        where:{userId:admin.id,usedAt:null},
        data:{usedAt:new Date()},
      });
      await tx.auditLog.create({data:{
        actorId:actor.id,clientId:admin.clientId,action:"UPDATE",
        entity:"User",entityId:admin.id,
        oldValue:{active:true},newValue:{active:false,reason:"Superadmin offboarding"},
      }});
      return "REVOKED";
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    if(result==="NOT_FOUND")return NextResponse.json({error:"Akun admin tidak ditemukan"},{status:404});
    if(result==="ALREADY_DISABLED")return NextResponse.json({error:"Akun admin sudah nonaktif"},{status:409});
    return NextResponse.json({revoked:true},{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    console.error("Admin access revocation failed",error instanceof Error?error.name:"unknown");
    return NextResponse.json({error:"Penonaktifan gagal"},{status:503});
  }
}
