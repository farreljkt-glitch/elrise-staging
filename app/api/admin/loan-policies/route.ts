import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { parseNewPolicy } from "@/lib/integration/loan-policy-input";
import { createEffectiveDatedLoanPolicies } from "@/lib/integration/bundle-policy-management";
export const runtime="nodejs";

/** Policy records are configuration, NOT approved credit limits or Gajiku transactions. */
export async function GET(){
 const actor=await getSession();
 if(!actor||actor.role!=="ADMIN"||!actor.clientId||actor.mustChangePassword)
   return NextResponse.json({error:"Tidak diizinkan"},{status:403});
 try{
   const [client,subscription,connection,policies]=await Promise.all([
     db.client.findUnique({where:{id:actor.clientId},select:{status:true}}),
     db.bundleSubscription.findUnique({where:{clientId:actor.clientId},
       select:{mode:true,effectiveAt:true}}),
     db.integrationConnection.findUnique({where:{clientId:actor.clientId},
       select:{state:true,verifiedAt:true,payrollOwner:true}}),
     db.bundleLoanPolicy.findMany({where:{clientId:actor.clientId},take:250,
       select:{id:true,pegawaiId:true,mode:true,percentBps:true,fixedAmount:true,
         denominatorDays:true,effectiveAt:true,createdAt:true},
       orderBy:[{effectiveAt:"desc"},{createdAt:"desc"},{id:"desc"}]}),
   ]);
   const ready=Boolean(client?.status==="AKTIF" && subscription?.mode==="BUNDLE" &&
     connection?.state==="ACTIVE" && connection.verifiedAt && connection.payrollOwner==="ELRISE");
   return NextResponse.json({
     policyConfigurationEnabled:ready,
     reason:ready?null:"Memerlukan tenant BUNDLE dan koneksi Gajiku terverifikasi dari staging.",
     policies:policies.map(p=>({...p,
       fixedAmountIdr:p.fixedAmount?.toString()??null,fixedAmount:undefined,
       effectiveAt:p.effectiveAt.toISOString(),createdAt:p.createdAt.toISOString()})),
     notice:"Ini konfigurasi kebijakan, BUKAN limit siap cair. THP dan saldo Gajiku belum terverifikasi.",
   },{headers:{"Cache-Control":"no-store"}});
 }catch{
   return NextResponse.json({error:"Kebijakan plafon tidak tersedia"},{status:503});
 }
}
export async function POST(request:Request){
 const actor=await getSession();
 if(!actor||actor.role!=="ADMIN"||!actor.clientId||actor.mustChangePassword)
   return NextResponse.json({error:"Tidak diizinkan"},{status:403});
 let input:ReturnType<typeof parseNewPolicy>;
 try{input=parseNewPolicy(await request.json());}
 catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Data tidak valid"},{status:400});}
 try{
   const result=await createEffectiveDatedLoanPolicies({
     clientId:actor.clientId,
     pegawaiIds:input.pegawaiIds,
     mode:input.mode,
     ...(input.mode==="FIXED_IDR"?{fixedAmountIdr:input.fixedAmountIdr}:{
       percentBps:input.percentBps,
     }),
     denominatorDays:input.denominatorDays,
     effectiveAt:input.effectiveDate+"T00:00:00.000Z",
   });
   return NextResponse.json({savedCount:result.count,mode:input.mode,
     message:"Kebijakan tercatat. Belum ada transfer atau transaksi Gajiku."},
     {status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){
   const m=e instanceof Error?e.message:"";
   if(/Verified bundle required|Tenant.*inactive/.test(m))
     return NextResponse.json({error:"Bundle belum terverifikasi/aktif"},{status:409});
   if(/Employee not found|already effective|duplicate policy/.test(m))
     return NextResponse.json({error:"Pegawai tidak sesuai PT atau tanggal kebijakan sudah dipakai"},{status:409});
   if(/Invalid|Tenant mismatch/.test(m))
     return NextResponse.json({error:"Konfigurasi kebijakan tidak valid"},{status:400});
   console.error("Admin PT loan policy setup failed",e instanceof Error?e.name:"unknown");
   return NextResponse.json({error:"Gagal menyimpan kebijakan"},{status:503});
 }
}
