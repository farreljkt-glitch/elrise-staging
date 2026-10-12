import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { parseNewClient } from "@/lib/superadmin/validation";
export const runtime="nodejs";
export async function GET(){
  const admin=await getSession();
  if(!admin||admin.role!=="SUPERADMIN"||admin.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  try{
    const clients=await db.client.findMany({
      select:{id:true,code:true,name:true,status:true,
        _count:{select:{employees:true,projects:true}},
        bundleSubscription:{select:{mode:true}},
      },orderBy:{name:"asc"},take:200});
    return NextResponse.json({clients,limited:clients.length===200},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Gagal memuat klien"},{status:503});}
}
export async function POST(req:Request){
  const admin=await getSession();
  if(!admin||admin.role!=="SUPERADMIN"||admin.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  let input: ReturnType<typeof parseNewClient>;
  try{input=parseNewClient(await req.json());}
  catch{return NextResponse.json({error:"Data klien tidak valid"},{status:400});}
  try{
    const result=await db.$transaction(async tx=>{
      const c=await tx.client.create({data:{
        code:input.code,name:input.name,
        setting:{create:{
          workDays:[1,2,3,4,5],holidays:[],
          attendanceEnabled:false,leaveEnabled:false,payrollEnabled:false,
        }},
      },select:{id:true,code:true,name:true,status:true}});
      await tx.bundleSubscription.create({data:{
        clientId:c.id,mode:"ELRISE_ONLY",effectiveAt:new Date(),provisionedByUserId:admin.id,
      }});
      await tx.auditLog.create({data:{
        actorId:admin.id,clientId:c.id,action:"CREATE",entity:"Client",entityId:c.id,
        newValue:{code:c.code,mode:"ELRISE_ONLY",modulesDisabledUntilConfigured:true},
      }});
      return c;
    });
    return NextResponse.json({client:result},{status:201});
  }catch(error){
    if(error instanceof Error&&/Unique constraint|P2002/.test(error.message))
      return NextResponse.json({error:"Kode klien sudah terdaftar"},{status:409});
    return NextResponse.json({error:"Gagal membuat klien"},{status:500});
  }
}
