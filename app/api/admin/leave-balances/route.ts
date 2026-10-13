import {NextResponse} from "next/server";
import {getSession} from "@/lib/auth-server";
import {db} from "@/lib/db";
import {Prisma} from "@prisma/client";
import {parseGrantLeaveBalances} from "@/lib/leave/admin-validation";
export const runtime="nodejs";
export async function POST(request:Request){
 const actor=await getSession();
 if(!actor||actor.role!=="ADMIN"||!actor.clientId||actor.mustChangePassword)
  return NextResponse.json({error:"Tidak diizinkan"},{status:403});
 let input:ReturnType<typeof parseGrantLeaveBalances>;
 try{input=parseGrantLeaveBalances(await request.json());}
 catch{return NextResponse.json({error:"Kuota/daftar pegawai tidak valid"},{status:400});}
 try{
  const result=await db.$transaction(async tx=>{
   const [tenant,type,employees,existing]=await Promise.all([
    tx.client.findUnique({where:{id:actor.clientId!},select:{
      status:true,setting:{select:{leaveEnabled:true}},
    }}),
    tx.leaveType.findFirst({where:{id:input.leaveTypeId,clientId:actor.clientId!,isActive:true,paid:true,unit:"HARI"},
      select:{id:true}}),
    tx.pegawai.findMany({where:{clientId:actor.clientId!,isActive:true,id:{in:input.employeeIds}},
      select:{id:true}}),
    tx.leaveBalance.count({where:{clientId:actor.clientId!,leaveTypeId:input.leaveTypeId,
      year:input.year,pegawaiId:{in:input.employeeIds}}}),
   ]);
   if(tenant?.status!=="AKTIF"||!tenant.setting?.leaveEnabled)
    throw new Error("Tenant disabled");
   if(!type||employees.length!==input.employeeIds.length)
    throw new Error("Scope invalid");
   if(existing)throw new Error("Balance already exists");
   const created=await tx.leaveBalance.createMany({data:input.employeeIds.map(pegawaiId=>({
      clientId:actor.clientId!,leaveTypeId:input.leaveTypeId,
      pegawaiId,year:input.year,quota:input.quota,used:0,
   }))});
   if(created.count!==input.employeeIds.length)throw new Error("Incomplete batch");
   await tx.auditLog.create({data:{
     actorId:actor.id,clientId:actor.clientId!,action:"CREATE",entity:"LeaveBalance",
     newValue:{typeId:input.leaveTypeId,year:input.year,quota:input.quota,employees:created.count},
   }});
   return created.count;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return NextResponse.json({created:result},{status:201});
 }catch(e){
  const msg=e instanceof Error?e.message:"";
  if(/Balance already exists|Unique constraint|P2002/.test(msg))
    return NextResponse.json({error:"Saldo sudah ada; tidak ditimpa untuk menjaga pemakaian lama"},{status:409});
  if(/Scope invalid/.test(msg))
    return NextResponse.json({error:"Jenis cuti/pegawai tidak sesuai PT atau tidak aktif"},{status:422});
  if(/Tenant disabled/.test(msg))
    return NextResponse.json({error:"Modul cuti tidak aktif"},{status:403});
  return NextResponse.json({error:"Pemberian saldo cuti gagal"},{status:503});
 }
}
