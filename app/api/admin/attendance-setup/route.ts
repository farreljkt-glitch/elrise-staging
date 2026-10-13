import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { parseAdminPtOffice } from "@/lib/admin/attendance-setup-validation";
export const runtime="nodejs";

/** Read current PT GPS office configuration without exposing tenant B information. */
export async function GET(){
  const actor=await getSession();
  if(!actor||actor.role!=="ADMIN"||!actor.clientId||actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  try{
    const [setting,offices]=await Promise.all([
      db.clientSetting.findUnique({where:{clientId:actor.clientId},
        select:{attendanceEnabled:true,requireSelfie:true,attendanceNetworkRule:true}}),
      db.officeLocation.findMany({where:{clientId:actor.clientId,projectId:{not:null}},
        select:{id:true,projectId:true,name:true,lat:true,lng:true,radiusM:true,isActive:true},
        orderBy:{name:"asc"},take:100}),
    ]);
    return NextResponse.json({setting,offices:offices.map(o=>({
      ...o,lat:Number(o.lat),lng:Number(o.lng),
    }))},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Konfigurasi absensi tidak dapat dimuat"},{status:503});}
}
/** An explicit admin setup, not a global demo bypass. Selfie & GPS stay enforced. */
export async function POST(request:Request){
  const actor=await getSession();
  if(!actor||actor.role!=="ADMIN"||!actor.clientId||actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  if(!(request.headers.get("content-type")??"").includes("application/json"))
    return NextResponse.json({error:"JSON diperlukan"},{status:415});
  let input:ReturnType<typeof parseAdminPtOffice>;
  try{input=parseAdminPtOffice(await request.json());}
  catch{return NextResponse.json({error:"Data lokasi tidak valid"},{status:400});}
  try{
    const configured=await db.$transaction(async tx=>{
      const project=await tx.project.findFirst({where:{
        id:input.projectId,clientId:actor.clientId!,isActive:true,client:{status:"AKTIF"},
      },select:{id:true}});
      if(!project)throw new Error("FOREIGN_PROJECT");
      const settings=await tx.clientSetting.findUnique({where:{clientId:actor.clientId!},
        select:{id:true,requireSelfie:true}});
      if(!settings)throw new Error("MISSING_SETTINGS");
      const office=await tx.officeLocation.findFirst({where:{
        clientId:actor.clientId!,projectId:project.id,isActive:true,
      },select:{id:true}});
      if(office)throw new Error("OFFICE_EXISTS");
      const created=await tx.officeLocation.create({data:{
        clientId:actor.clientId!,projectId:project.id,name:input.name,
        lat:new Prisma.Decimal(input.lat),lng:new Prisma.Decimal(input.lng),
        radiusM:input.radiusM,
      },select:{id:true,projectId:true,name:true,radiusM:true,isActive:true}});
      await tx.clientSetting.update({where:{clientId:actor.clientId!},data:{
        attendanceEnabled:true,
        // Existing security defaults retained: GPS is mandatory and camera selfie required.
        attendanceNetworkRule:"GPS",requireGps:true,requireSelfie:true,
      }});
      await tx.auditLog.create({data:{actorId:actor.id,clientId:actor.clientId!,
        action:"CREATE",entity:"OfficeLocation",entityId:created.id,
        newValue:{projectId:created.projectId,radiusM:created.radiusM,
          attendanceEnabled:true,rule:"GPS",requireSelfie:true}}});
      return created;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return NextResponse.json({office:configured,attendanceEnabled:true,requireSelfie:true},
      {status:201,headers:{"Cache-Control":"no-store"}});
  }catch(e){
    const msg=e instanceof Error?e.message:"";
    if(msg==="FOREIGN_PROJECT")return NextResponse.json({error:"Project tidak tersedia di PT Anda"},{status:403});
    if(msg==="OFFICE_EXISTS")return NextResponse.json({error:"Titik kantor aktif sudah ada untuk project"},{status:409});
    if(msg==="MISSING_SETTINGS")return NextResponse.json({error:"Konfigurasi PT belum tersedia"},{status:409});
    if(e instanceof Prisma.PrismaClientKnownRequestError&&e.code==="P2034")
      return NextResponse.json({error:"Konfigurasi sedang diproses, coba ulang"},{status:409});
    console.error("Admin PT attendance setup failed",e instanceof Error?e.name:"unknown");
    return NextResponse.json({error:"Gagal menyiapkan absensi"},{status:503});
  }
}
