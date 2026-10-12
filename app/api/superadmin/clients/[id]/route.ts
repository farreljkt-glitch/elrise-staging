import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
type Context={params:Promise<{id:string}>};
export const runtime="nodejs";
export async function PATCH(req:Request,ctx:Context){
  const admin=await getSession();
  if(!admin||admin.role!=="SUPERADMIN"||admin.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  let status:"AKTIF"|"SUSPEND"|"NONAKTIF";
  try{
    const body=await req.json();
    if(!body||typeof body!=="object"||Array.isArray(body)||
      Object.keys(body).length!==1||!["AKTIF","SUSPEND","NONAKTIF"].includes(body.status))
      throw new Error("Invalid");
    status=body.status;
  }catch{return NextResponse.json({error:"Status tidak valid"},{status:400});}
  const {id}=await ctx.params;
  try{
    const changed=await db.$transaction(async tx=>{
      const old=await tx.client.findUnique({where:{id},select:{id:true,status:true}});
      if(!old)return null;
      const c=await tx.client.update({where:{id},data:{status},select:{id:true,status:true}});
      await tx.auditLog.create({data:{actorId:admin.id,clientId:id,action:"UPDATE",
        entity:"Client",entityId:id,oldValue:{status:old.status},newValue:{status:c.status}}});
      return c;
    });
    if(!changed)return NextResponse.json({error:"Klien tidak ditemukan"},{status:404});
    return NextResponse.json({client:changed});
  }catch{return NextResponse.json({error:"Update klien gagal"},{status:503});}
}
