import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-server";
import { currentKasbonPeriod, getWibDate, parseKasbonStartPeriod,
  parseKasbonSubmission } from "@/lib/integration/loan-request-input";

export const runtime="nodejs";
const noStore={"Cache-Control":"no-store"};

type Row={id:string;amount:bigint;periodCode:string;cycle:string;purpose:string;
  status:string;reviewedAt:Date|null;reviewReason:string|null;createdAt:Date;
  pegawai?:{nama:string;idPegawai:string}};
function present(row:Row){
  return {id:row.id,amountIdr:row.amount.toString(),periodCode:row.periodCode,
    cycle:row.cycle,purpose:row.purpose,status:row.status,
    createdAt:row.createdAt.toISOString(),
    reviewedAt:row.reviewedAt?.toISOString()??null,
    reviewReason:row.reviewReason??null,
    ...(row.pegawai?{employee:{name:row.pegawai.nama,code:row.pegawai.idPegawai}}:{})};
}

export async function GET(){
  const actor=await getSession();
  if(!actor||!actor.clientId||actor.mustChangePassword||
     (actor.role!=="PEGAWAI"&&actor.role!=="ADMIN"))
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  if(actor.role==="PEGAWAI"&&!actor.pegawaiId)
    return NextResponse.json({error:"Akun tidak memiliki identitas pegawai"},{status:403});
  try{
    const rows=await db.kasbonRequest.findMany({where:{
      clientId:actor.clientId,
      ...(actor.role==="PEGAWAI"?{pegawaiId:actor.pegawaiId!}:{}),
    },take:101,orderBy:[{createdAt:"desc"},{id:"desc"}],
      select:{id:true,amount:true,periodCode:true,cycle:true,purpose:true,
        status:true,reviewedAt:true,reviewReason:true,createdAt:true,
        ...(actor.role==="ADMIN"?{pegawai:{select:{nama:true,idPegawai:true}}}:{})},
    });
    return NextResponse.json({requests:rows.slice(0,100).map(row=>present(row)),
      limited:rows.length>100,
      notice:"REVIEWED_HOLD bukan persetujuan keuangan, saldo tersedia, atau pencairan Gajiku."},
      {headers:noStore});
  }catch{
    return NextResponse.json({error:"Riwayat pengajuan tidak dapat dimuat"},{status:503});
  }
}

/** Employee-owned intake, without calling Gajiku, reserving credit, or paying money. */
export async function POST(req:Request){
  const actor=await getSession();
  if(!actor||actor.role!=="PEGAWAI"||!actor.clientId||
     !actor.pegawaiId||actor.mustChangePassword)
    return NextResponse.json({error:"Tidak diizinkan"},{status:403});
  if(!(req.headers.get("content-type")??"").includes("application/json"))
    return NextResponse.json({error:"JSON diperlukan"},{status:415});
  let input:ReturnType<typeof parseKasbonSubmission>;
  try{input=parseKasbonSubmission(await req.json());}
  catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Pengajuan tidak valid"},{status:400});}
  const {clientId,pegawaiId}=actor;
  const lookup={clientId_pegawaiId_requestKey:{
    clientId,pegawaiId,requestKey:input.requestKey,
  }};
  async function existingResponse(){
    const row=await db.kasbonRequest.findUnique({where:lookup,
      select:{id:true,amount:true,periodCode:true,cycle:true,purpose:true,
        status:true,reviewedAt:true,reviewReason:true,createdAt:true}});
    if(!row)return null;
    if(row.amount!==input.amount||row.purpose!==input.purpose)
      return NextResponse.json({error:"Kunci idempotency dipakai untuk pengajuan berbeda"},{status:409});
    return NextResponse.json({request:present(row),replayed:true,
      notice:"Pengajuan yang sama tidak dicatat ulang; belum ada transaksi Gajiku."},
      {headers:noStore});
  }
  try{
    const old=await existingResponse();
    if(old)return old;
    const today=getWibDate(new Date());
    const result=await db.$transaction(async tx=>{
      const employee=await tx.pegawai.findFirst({where:{
        id:pegawaiId,clientId,isActive:true,project:{isActive:true},
      },select:{id:true,siklusGaji:true}});
      if(!employee)throw new Error("EMPLOYEE_UNAVAILABLE");
      const range=currentKasbonPeriod(employee.siklusGaji,today);
      const [subscription,settings,mapping,connection]=await Promise.all([
        tx.bundleSubscription.findUnique({where:{clientId},
          select:{mode:true,effectiveAt:true}}),
        tx.clientSetting.findUnique({where:{clientId},
          select:{kasbonGajikuEnabled:true,kasbonStartPeriod:true,
            kasbonWeeklyCutoffDay:true}}),
        tx.integrationEmployeeMap.findUnique({where:{pegawaiId},
          select:{clientId:true,connectionId:true}}),
        tx.integrationConnection.findUnique({where:{clientId},
          select:{id:true}}),
      ]);
      if(subscription?.mode!=="BUNDLE"||subscription.effectiveAt>range.startDate ||
         !settings?.kasbonGajikuEnabled)
        throw new Error("BUNDLE_NOT_CONFIGURED");
      if(settings.kasbonWeeklyCutoffDay!==null)
        throw new Error("WEEKLY_NOT_SUPPORTED");
      parseKasbonStartPeriod(settings.kasbonStartPeriod,range.gajikuPeriodKey);
      if(!connection||!mapping||mapping.clientId!==clientId||
         mapping.connectionId!==connection.id)
        throw new Error("MAPPING_UNAVAILABLE");
      const policyWhere={clientId,effectiveAt:{lte:range.startDate}};
      const override=await tx.bundleLoanPolicy.findFirst({where:{
        ...policyWhere,pegawaiId,
      },orderBy:[{effectiveAt:"desc" as const},{createdAt:"desc" as const}]});
      const policy=override??await tx.bundleLoanPolicy.findFirst({where:{
        ...policyWhere,pegawaiId:null,
      },orderBy:[{effectiveAt:"desc" as const},{createdAt:"desc" as const}]});
      if(!policy)throw new Error("POLICY_UNAVAILABLE");
      const created=await tx.kasbonRequest.create({data:{
        clientId,pegawaiId,periodCode:range.gajikuPeriodKey,
        cycle:employee.siklusGaji,amount:input.amount,
        requestKey:input.requestKey,purpose:input.purpose,status:"PENDING_REVIEW",
      },select:{id:true,amount:true,periodCode:true,cycle:true,purpose:true,
        status:true,reviewedAt:true,reviewReason:true,createdAt:true}});
      await tx.auditLog.create({data:{clientId,actorId:actor.id,action:"CREATE",
        entity:"KasbonRequest",entityId:created.id,newValue:{
          status:"PENDING_REVIEW",periodCode:range.gajikuPeriodKey,
          stage:"ELRISE_INTAKE_ONLY",policyId:policy.id,
        }}});
      return created;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return NextResponse.json({request:present(result),replayed:false,
      notice:"Hanya diterima di Elrise. Nominal belum diverifikasi dan tidak dikirim ke Gajiku."},
      {status:201,headers:noStore});
  }catch(e){
    const code=e instanceof Error?e.message:"";
    if(/P2002|P2034|Unique constraint/.test(code)){
      const replay=await existingResponse();
      if(replay)return replay;
      return NextResponse.json({error:"Benturan transaksi; coba ulang dengan kunci yang sama"},{status:409});
    }
    if(["BUNDLE_NOT_CONFIGURED","EMPLOYEE_UNAVAILABLE","WEEKLY_NOT_SUPPORTED",
      "MAPPING_UNAVAILABLE","POLICY_UNAVAILABLE"].includes(code) ||
       /Cutover kasbon/.test(code)){
      return NextResponse.json({error:"Pengajuan belum dapat dibuka: "+code},{status:409});
    }
    console.error("Kasbon request intake failed",e instanceof Error?e.name:"unknown");
    return NextResponse.json({error:"Gagal mencatat pengajuan di Elrise"},{status:503});
  }
}
