import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { parseDraftConnection } from "@/lib/integration/draft-mapping-validation";
export const runtime="nodejs";

export async function GET(request:Request){
 const actor=await getSession();
 if(!actor||actor.role!=="SUPERADMIN"||actor.mustChangePassword)
   return NextResponse.json({error:"Tidak diizinkan"},{status:403});
 const clientId=new URL(request.url).searchParams.get("clientId")?.trim();
 if(!clientId||clientId.length>191)return NextResponse.json({error:"Tenant wajib"},{status:400});
 try{
   const [client,connection,subscription]=await Promise.all([
     db.client.findUnique({where:{id:clientId},select:{id:true,status:true,name:true}}),
     db.integrationConnection.findUnique({where:{clientId},
       select:{id:true,externalTenantId:true,state:true,payrollOwner:true,verifiedAt:true,
         _count:{select:{employees:true}}}}),
     db.bundleSubscription.findUnique({where:{clientId},
       select:{mode:true,effectiveAt:true,activatedAt:true}}),
   ]);
   if(!client)return NextResponse.json({error:"Tenant tidak ditemukan"},{status:404});
   return NextResponse.json({client,connection,subscription,
     integrationReady:Boolean(connection?.state==="ACTIVE"&&connection?.verifiedAt&&
       connection?.payrollOwner==="ELRISE"&&subscription?.mode==="BUNDLE"),
   },{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Status integrasi tidak tersedia"},{status:503});}
}
export async function POST(request:Request){
 const actor=await getSession();
 if(!actor||actor.role!=="SUPERADMIN"||actor.mustChangePassword)
   return NextResponse.json({error:"Tidak diizinkan"},{status:403});
 let input:ReturnType<typeof parseDraftConnection>;
 try{input=parseDraftConnection(await request.json());}
 catch{return NextResponse.json({error:"Identitas draft tidak valid"},{status:400});}
 try{
  const conn=await db.$transaction(async tx=>{
   const client=await tx.client.findUnique({where:{id:input.clientId},select:{status:true}});
   if(client?.status!=="AKTIF")throw new Error("TENANT_INACTIVE");
   if(await tx.integrationConnection.findUnique({where:{clientId:input.clientId}}))
     throw new Error("ALREADY_LINKED");
   const record=await tx.integrationConnection.create({data:{
     clientId:input.clientId,externalTenantId:input.externalTenantId,
     state:"DISABLED",payrollOwner:"ELRISE",verifiedAt:null,
   },select:{id:true,clientId:true,externalTenantId:true,state:true,verifiedAt:true}});
   await tx.auditLog.create({data:{actorId:actor.id,clientId:input.clientId,
     action:"CREATE",entity:"IntegrationConnection",entityId:record.id,
     newValue:{stage:"DRAFT",verified:false,state:"DISABLED"}}});
   return record;
  });
  return NextResponse.json({connection:conn,warning:"DRAFT; tidak ada panggilan ke Gajiku atau aktivasi bundle"},
    {status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){
  const msg=e instanceof Error?e.message:"";
  if(msg==="TENANT_INACTIVE")return NextResponse.json({error:"PT tidak aktif"},{status:403});
  if(msg==="ALREADY_LINKED"||/P2002|Unique constraint/.test(msg))
    return NextResponse.json({error:"Tenant atau ID eksternal sudah terhubung"},{status:409});
  console.error("Gajiku draft connection",e instanceof Error?e.name:"unknown");
  return NextResponse.json({error:"Gagal membuat draft"},{status:503});
 }
}
