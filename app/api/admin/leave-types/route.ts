import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth-server";
import {db} from "@/lib/db";
import {parseCreateLeaveType} from "@/lib/leave/admin-validation";
export const runtime="nodejs";
async function authorize(){
 const actor=await getSession();
 return actor&&actor.role==="ADMIN"&&actor.clientId&&!actor.mustChangePassword?actor:null;
}
export async function GET(){
 const actor=await authorize();if(!actor)return NextResponse.json({error:"Tidak diizinkan"},{status:403});
 const types=await db.leaveType.findMany({where:{clientId:actor.clientId!},
   select:{id:true,name:true,unit:true,paid:true,annualQuota:true,isActive:true},
   orderBy:{name:"asc"},take:100});
 return NextResponse.json({types},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(request:Request){
 const actor=await authorize();if(!actor)return NextResponse.json({error:"Tidak diizinkan"},{status:403});
 let input:ReturnType<typeof parseCreateLeaveType>;
 try{input=parseCreateLeaveType(await request.json());}
 catch{return NextResponse.json({error:"Data jenis cuti tidak valid"},{status:400});}
 try{
  const result=await db.$transaction(async tx=>{
   const client=await tx.client.findUnique({where:{id:actor.clientId!},
     select:{status:true,setting:{select:{leaveEnabled:true}}}});
   if(client?.status!=="AKTIF"||!client.setting?.leaveEnabled)
     throw new Error("Leave inactive");
   const created=await tx.leaveType.create({data:{
     clientId:actor.clientId!,name:input.name,paid:input.paid,
     annualQuota:input.annualQuota,unit:"HARI",
   },select:{id:true,name:true,paid:true,annualQuota:true,isActive:true}});
   await tx.auditLog.create({data:{
     actorId:actor.id,clientId:actor.clientId!,action:"CREATE",
     entity:"LeaveType",entityId:created.id,
     newValue:{name:created.name,paid:created.paid,annualQuota:created.annualQuota},
   }});
   return created;
  });
  return NextResponse.json({type:result},{status:201});
 }catch(e){
  if(e instanceof Error&&/P2002|Unique constraint/i.test(e.message))
    return NextResponse.json({error:"Jenis cuti sudah ada di PT ini"},{status:409});
  if(e instanceof Error&&e.message==="Leave inactive")
    return NextResponse.json({error:"Modul cuti/tenant tidak aktif"},{status:403});
  return NextResponse.json({error:"Gagal menyimpan jenis cuti"},{status:503});
 }
}
