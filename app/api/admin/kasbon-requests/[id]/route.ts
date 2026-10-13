import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { parseKasbonReview } from "@/lib/integration/loan-request-input";
export const runtime="nodejs";
type Context={params:Promise<{id:string}>};
/** Admin PT only: HOLD is a non-financial review, not final approval nor Gajiku disbursement. */
export async function PATCH(req:Request,ctx:Context){
  const actor=await getSession();
  if(!actor||actor.role!=="ADMIN"||!actor.clientId||actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  if(!(req.headers.get("content-type")??"").includes("application/json"))
    return NextResponse.json({error:"JSON diperlukan"},{status:415});
  let input:ReturnType<typeof parseKasbonReview>;
  try{input=parseKasbonReview(await req.json());}
  catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Keputusan tidak valid"},{status:400});}
  const {id}=await ctx.params;
  if(!id||id.length>191)return NextResponse.json({error:"ID pengajuan tidak valid"},{status:400});
  try{
    const result=await db.$transaction(async tx=>{
      const row=await tx.kasbonRequest.findFirst({where:{
        id,clientId:actor.clientId!,status:"PENDING_REVIEW",
      },select:{id:true,pegawaiId:true}});
      if(!row)return "NOT_PENDING";
      const status=input.decision==="REJECT"?"REJECTED":"REVIEWED_HOLD";
      const updated=await tx.kasbonRequest.updateMany({where:{
        id:row.id,clientId:actor.clientId!,status:"PENDING_REVIEW",
      },data:{
        status,reviewerId:actor.id,reviewedAt:new Date(),
        reviewReason:input.reason,
      }});
      if(updated.count!==1)return "NOT_PENDING";
      await tx.auditLog.create({data:{
        clientId:actor.clientId!,actorId:actor.id,
        action:input.decision==="REJECT"?"REJECT":"UPDATE",
        entity:"KasbonRequest",entityId:row.id,oldValue:{status:"PENDING_REVIEW"},
        newValue:{status,stage:"NON_FINANCIAL_REVIEW_ONLY",
          gajikuTransactionCreated:false,creditReserved:false},
      }});
      return status;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    if(result==="NOT_PENDING"){
      const isOwned=await db.kasbonRequest.findFirst({
        where:{id,clientId:actor.clientId},select:{status:true}});
      if(!isOwned)return NextResponse.json({error:"Pengajuan tidak ditemukan dalam PT Anda"},{status:404});
      return NextResponse.json({error:"Pengajuan sudah diproses"},{status:409});
    }
    return NextResponse.json({status:result,
      availableLoanIdr:null,gajikuTransactionCreated:false,
      notice:"Review Elrise selesai; belum disetujui untuk pencairan atau dikirim ke Gajiku."},
      {headers:{"Cache-Control":"no-store"}});
  }catch(e){
    const code=e instanceof Error?e.message:"";
    if(/P2034/.test(code))return NextResponse.json({error:"Pengajuan sedang diproses; muat ulang"},{status:409});
    console.error("Kasbon preliminary review failed",e instanceof Error?e.name:"unknown");
    return NextResponse.json({error:"Review gagal, belum ada keputusan tercatat"},{status:503});
  }
}
