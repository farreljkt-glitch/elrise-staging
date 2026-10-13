import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { parseDraftEmployeeMapping } from "@/lib/integration/draft-mapping-validation";
export const runtime="nodejs";

export async function GET(request:Request){
 const actor=await getSession();
 if(!actor||actor.role!=="SUPERADMIN"||actor.mustChangePassword)
   return NextResponse.json({error:"Tidak diizinkan"},{status:403});
 const clientId=new URL(request.url).searchParams.get("clientId")?.trim();
 if(!clientId||clientId.length>191)return NextResponse.json({error:"Tenant wajib"},{status:400});
 try{
  const [connection,mapped,unmappedCount,employees]=await Promise.all([
   db.integrationConnection.findUnique({where:{clientId},
     select:{id:true,state:true,verifiedAt:true,externalTenantId:true}}),
   db.integrationEmployeeMap.findMany({where:{clientId},take:200,orderBy:{createdAt:"desc"},
     select:{id:true,externalEmployeeId:true,verifiedAt:true,
       pegawai:{select:{id:true,idPegawai:true,nama:true,isActive:true}}}}),
   db.pegawai.count({where:{clientId,isActive:true,integrationEmployeeMap:null}}),
   db.pegawai.findMany({where:{clientId,isActive:true,integrationEmployeeMap:null},
     select:{id:true,idPegawai:true,nama:true},orderBy:{nama:"asc"},take:200}),
  ]);
  return NextResponse.json({connection,mapped,unmappedCount,employees,
    warning:"ID pegawai eksternal masih DRAFT sampai diverifikasi di Gajiku staging"},
    {headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Mapping tidak tersedia"},{status:503});}
}
export async function POST(request:Request){
 const actor=await getSession();
 if(!actor||actor.role!=="SUPERADMIN"||actor.mustChangePassword)
   return NextResponse.json({error:"Tidak diizinkan"},{status:403});
 let input:ReturnType<typeof parseDraftEmployeeMapping>;
 try{input=parseDraftEmployeeMapping(await request.json());}
 catch{return NextResponse.json({error:"Mapping draft tidak valid"},{status:400});}
 try{
  const mapped=await db.$transaction(async tx=>{
   const connection=await tx.integrationConnection.findUnique({where:{clientId:input.clientId},
     select:{id:true,state:true,verifiedAt:true}});
   if(!connection||connection.state!=="DISABLED"||connection.verifiedAt)
     throw new Error("NOT_DRAFT");
   const employee=await tx.pegawai.findFirst({where:{id:input.pegawaiId,
     clientId:input.clientId,isActive:true,project:{isActive:true}},select:{id:true}});
   if(!employee)throw new Error("FOREIGN_EMPLOYEE");
   if(await tx.integrationEmployeeMap.findUnique({where:{pegawaiId:employee.id}}))
     throw new Error("ALREADY_MAPPED");
   const record=await tx.integrationEmployeeMap.create({data:{
     clientId:input.clientId,connectionId:connection.id,pegawaiId:employee.id,
     externalEmployeeId:input.externalEmployeeId,verifiedAt:null,
   },select:{id:true,clientId:true,pegawaiId:true,externalEmployeeId:true,verifiedAt:true}});
   await tx.auditLog.create({data:{actorId:actor.id,clientId:input.clientId,
     action:"CREATE",entity:"IntegrationEmployeeMap",entityId:record.id,
     newValue:{stage:"DRAFT",verified:false}}});
   return record;
  });
  return NextResponse.json({mapping:mapped,warning:"Belum terverifikasi Gajiku"},
    {status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){
  const msg=e instanceof Error?e.message:"";
  if(msg==="NOT_DRAFT")return NextResponse.json({error:"Hanya koneksi DISABLED yang menerima draft"},{status:409});
  if(msg==="FOREIGN_EMPLOYEE")return NextResponse.json({error:"Pegawai tidak sesuai PT/aktif"},{status:404});
  if(msg==="ALREADY_MAPPED"||/P2002|Unique constraint/.test(msg))
    return NextResponse.json({error:"Pegawai atau ID eksternal sudah dimapping"},{status:409});
  console.error("Gajiku draft employee mapping",e instanceof Error?e.name:"unknown");
  return NextResponse.json({error:"Gagal membuat mapping"},{status:503});
 }
}
