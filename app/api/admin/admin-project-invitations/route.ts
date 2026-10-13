import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { issueAdminInvitation } from "@/lib/superadmin/admin-invitation";
import { parseAdminPtProjectInvite } from "@/lib/admin/project-self-service-validation";
export const runtime="nodejs";

export async function GET(){
  const actor=await getSession();
  if(!actor||actor.role!=="ADMIN"||!actor.clientId||actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  try{
    const admins=await db.user.findMany({
      where:{clientId:actor.clientId,role:"ADMIN_PROJECT"},
      select:{id:true,name:true,email:true,isActive:true,
        managedProject:{select:{id:true,name:true,code:true,isActive:true}},
        adminInvitations:{select:{expiresAt:true,usedAt:true},orderBy:{createdAt:"desc"},take:1}},
      },orderBy:{name:"asc"},take:200,
    });
    return NextResponse.json({admins:admins.map(a=>({
      id:a.id,name:a.name,email:a.email,isActive:a.isActive,
      managedProject:a.managedProject,
      invitation:a.adminInvitations[0]??null,
    }))},{headers:{"Cache-Control":"no-store"}});
  }catch{
    return NextResponse.json({error:"Daftar Admin Project tidak tersedia"},{status:503});
  }
}

/** Same single-use invitation system as Superadmin; role is fixed server-side. */
export async function POST(request:Request){
  const actor=await getSession();
  if(!actor||actor.role!=="ADMIN"||!actor.clientId||actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  if(!(request.headers.get("content-type")??"").includes("application/json"))
    return NextResponse.json({error:"JSON diperlukan"},{status:415});
  let input:ReturnType<typeof parseAdminPtProjectInvite>;
  try{input=parseAdminPtProjectInvite(await request.json(),actor.clientId);}
  catch{return NextResponse.json({error:"Hanya projectId, nama, dan email yang boleh dikirim"},{status:400});}
  try{
    const project=await db.project.findFirst({where:{
      id:input.projectId!,clientId:actor.clientId,isActive:true,
      client:{status:"AKTIF"},
    },select:{id:true}});
    if(!project)return NextResponse.json({error:"Project bukan milik PT Anda atau nonaktif"},{status:403});
    const invite=await issueAdminInvitation(actor.id,input);
    return NextResponse.json({email:invite.email,token:invite.token,
      expiresAt:invite.expiresAt.toISOString()},{
      status:201,headers:{"Cache-Control":"no-store"},
    });
  }catch(e){
    if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2002" ||
       e instanceof Error&&/already used/i.test(e.message))
      return NextResponse.json({error:"Email sudah digunakan"},{status:409});
    if(e instanceof Error&&/Tenant inactive|Foreign or inactive project/.test(e.message))
      return NextResponse.json({error:"Project atau PT tidak tersedia"},{status:403});
    console.error("Admin PT project invitation failed",e instanceof Error?e.name:"unknown");
    return NextResponse.json({error:"Undangan Admin Project gagal dibuat"},{status:503});
  }
}
