import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
export const runtime="nodejs";
/** Superadmin admin listing is not an employee listing; do not expose payroll or secret fields. */
export async function GET(req:Request){
  const actor=await getSession();
  if(!actor || actor.role!=="SUPERADMIN" || actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  const clientId=new URL(req.url).searchParams.get("clientId")?.trim();
  if(!clientId || clientId.length>191)return NextResponse.json({error:"Tenant wajib"},{status:400});
  const admins=await db.user.findMany({
    where:{clientId,role:{in:["ADMIN","ADMIN_PROJECT"]}},
    select:{id:true,name:true,email:true,role:true,isActive:true,
      managedProject:{select:{id:true,name:true}}},
    orderBy:{name:"asc"},take:200,
  });
  return NextResponse.json({admins},{headers:{"Cache-Control":"no-store"}});
}
