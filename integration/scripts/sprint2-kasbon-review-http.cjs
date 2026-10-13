/** Elrise-only kasbon intake/review HTTP tests; disposable MySQL; zero Gajiku requests. */
const assert=require("node:assert/strict");
const bcrypt=require("bcryptjs");
const {randomUUID}=require("node:crypto");
const {PrismaClient}=require("@prisma/client");
const url=new URL(process.env.DATABASE_URL||"mysql://missing@invalid/none");
if(process.env.CI!=="true"||url.hostname!=="127.0.0.1"||url.pathname!=="/elrise_ci")
  throw new Error("Kasbon HTTP tests only run in isolated CI MySQL");
const db=new PrismaClient(),suffix=randomUUID().slice(0,8);
const origin="http://127.0.0.1:3000";
const newKey=()=>randomUUID();
async function call(path,method="GET",cookie="",body){
  const result=await fetch(origin+path,{
    method,redirect:"manual",
    headers:{...(cookie?{cookie}:{}),...(body?{"content-type":"application/json"}:{})},
    ...(body?{body:JSON.stringify(body)}:{}),
  });
  let data;try{data=await result.json();}catch{data=null;}
  return {status:result.status,data};
}
async function login(email,password){
  const result=await fetch(origin+"/api/auth/login",{method:"POST",redirect:"manual",
    headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});
  assert.equal(result.status,200,"Synthetic login failed: "+email);
  const cookie=result.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie?.startsWith("tg_session="));return cookie;
}
async function fixture(label,hash,bundle){
  const client=await db.client.create({data:{
    code:"LOAN-"+label+"-"+suffix,name:"CI Loan Tenant "+label,
    setting:{create:{workDays:[1,2,3,4,5],holidays:[],
      kasbonGajikuEnabled:bundle,kasbonStartPeriod:"2020-01"}},
  }});
  const project=await db.project.create({data:{
    clientId:client.id,code:"OPS",name:"Synthetic Operations",
  }});
  const employee=await db.pegawai.create({data:{
    clientId:client.id,projectId:project.id,nama:"Synthetic "+label,
    idPegawai:"EMP-"+suffix,email:"loan-employee-"+label+"-"+suffix+"@example.invalid",
    siklusGaji:"B",
  }});
  const adminEmail="loan-admin-"+label+"-"+suffix+"@example.invalid";
  const employeeEmail="loan-user-"+label+"-"+suffix+"@example.invalid";
  const projectEmail="loan-project-"+label+"-"+suffix+"@example.invalid";
  await db.user.createMany({data:[
    {email:adminEmail,name:"PT Reviewer",passwordHash:hash,
      clientId:client.id,role:"ADMIN",mustChangePassword:false},
    {email:employeeEmail,name:"Synthetic Employee",passwordHash:hash,
      clientId:client.id,pegawaiId:employee.id,role:"PEGAWAI",mustChangePassword:false},
    {email:projectEmail,name:"Synthetic Project Manager",passwordHash:hash,
      clientId:client.id,managedProjectId:project.id,role:"ADMIN_PROJECT",mustChangePassword:false},
  ]});
  if(bundle){
    await db.bundleSubscription.create({data:{
      clientId:client.id,mode:"BUNDLE",effectiveAt:new Date("2020-01-01T00:00:00Z"),
      provisionedByUserId:"synthetic-superadmin",
    }});
    const connection=await db.integrationConnection.create({data:{
      clientId:client.id,externalTenantId:"synthetic-draft-"+suffix+"-"+label,
      state:"DISABLED",verifiedAt:null,payrollOwner:"ELRISE",
    }});
    await db.integrationEmployeeMap.create({data:{
      clientId:client.id,connectionId:connection.id,pegawaiId:employee.id,
      externalEmployeeId:"synthetic-employee-"+label,verifiedAt:null,
    }});
    await db.bundleLoanPolicy.create({data:{
      clientId:client.id,mode:"FIXED_IDR",fixedAmount:500_000n,
      denominatorDays:22,effectiveAt:new Date("2020-01-01T00:00:00Z"),
      createdByUserId:"synthetic-admin",
    }});
  }
  return {client,employee,adminEmail,employeeEmail,projectEmail};
}
async function main(){
  const password="synthetic-kasbon-password-"+suffix;
  const hash=await bcrypt.hash(password,12);
  const a=await fixture("a",hash,true);
  const b=await fixture("b",hash,false);
  const [applicant,adminA,adminB,employeeB,managerA]=await Promise.all([
    login(a.employeeEmail,password),login(a.adminEmail,password),login(b.adminEmail,password),
    login(b.employeeEmail,password),login(a.projectEmail,password),
  ]);
  const path="/api/kasbon-requests";
  const review=id=>"/api/admin/kasbon-requests/"+id;
  const input={amountIdr:"250000",purpose:"Kebutuhan keluarga mendesak",requestKey:newKey()};
  const disabled=await call(path,"POST",employeeB,input);
  assert.equal(disabled.status,409,JSON.stringify(disabled.data));
  assert.equal(await db.kasbonRequest.count({where:{clientId:b.client.id}}),0);
  const forbidden=await call(path,"POST",adminA,input);
  assert.equal(forbidden.status,403);
  const massAssign=await call(path,"POST",applicant,{...input,clientId:b.client.id});
  assert.equal(massAssign.status,400);
  const massStatus=await call(path,"POST",applicant,{...input,status:"APPROVED"});
  assert.equal(massStatus.status,400);

  const created=await call(path,"POST",applicant,input);
  assert.equal(created.status,201,JSON.stringify(created.data));
  assert.equal(created.data.request.status,"PENDING_REVIEW");
  assert.equal(created.data.request.amountIdr,"250000");
  assert.equal(created.data.request.cycle,"B");
  assert.equal(created.data.replayed,false);
  const id=created.data.request.id;
  const existing=await call(path,"POST",applicant,input);
  assert.equal(existing.status,200,JSON.stringify(existing.data));
  assert.equal(existing.data.replayed,true);
  assert.equal(existing.data.request.id,id);
  const keyConflict=await call(path,"POST",applicant,{...input,amountIdr:"350000"});
  assert.equal(keyConflict.status,409);
  assert.equal(await db.kasbonRequest.count({where:{
    clientId:a.client.id,pegawaiId:a.employee.id,requestKey:input.requestKey,
  }}),1);
  assert.equal(await db.kasbonRequest.count({where:{clientId:b.client.id}}),0);
  console.log("PASS Elrise kasbon intake, tenant scope, bundle prerequisite and idempotency");

  const listA=await call(path,"GET",applicant);
  assert.equal(listA.status,200);
  assert.equal(listA.data.requests.length,1);
  assert.equal(listA.data.requests[0].id,id);
  assert.ok(!JSON.stringify(listA.data).includes("gajiPokok"));
  assert.equal((await call(path,"GET",employeeB)).data.requests.length,0);
  const reviewNotAdmin=await call(review(id),"PATCH",applicant,{decision:"REVIEW_HOLD"});
  assert.equal(reviewNotAdmin.status,403);
  assert.equal((await call(review(id),"PATCH",managerA,{decision:"REVIEW_HOLD"})).status,403);
  assert.equal((await call(review(id),"PATCH",adminB,{decision:"REVIEW_HOLD"})).status,404);
  assert.equal((await call(review(id),"PATCH",adminA,{decision:"APPROVE"})).status,400);
  const adminHold=await call(review(id),"PATCH",adminA,{decision:"REVIEW_HOLD"});
  assert.equal(adminHold.status,200,JSON.stringify(adminHold.data));
  assert.equal(adminHold.data.status,"REVIEWED_HOLD");
  assert.equal(adminHold.data.availableLoanIdr,null);
  assert.equal(adminHold.data.gajikuTransactionCreated,false);
  assert.equal((await call(review(id),"PATCH",adminA,{decision:"REVIEW_HOLD"})).status,409);
  const reviewed=await db.kasbonRequest.findUnique({where:{id}});
  assert.equal(reviewed.status,"REVIEWED_HOLD");
  assert.equal(reviewed.reviewerId,(await db.user.findUnique({where:{email:a.adminEmail}})).id);
  assert.equal(await db.integrationSettlementOutbox.count({where:{clientId:a.client.id}}),0);
  assert.equal(await db.kasbonSettlement.count({where:{clientId:a.client.id}}),0);
  const adminBList=await call(path,"GET",adminB);
  assert.equal(adminBList.status,200);
  assert.equal(adminBList.data.requests.length,0);
  const adminAList=await call(path,"GET",adminA);
  assert.ok(adminAList.data.requests.some(r=>r.id===id&&r.employee.code===a.employee.idPegawai));
  console.log("PASS only Admin PT can review HOLD, no cross-tenant reads or Gajiku side effects");

  const second={...input,requestKey:newKey(),amountIdr:"100000"};
  const next=await call(path,"POST",applicant,second);
  assert.equal(next.status,201,JSON.stringify(next.data));
  assert.equal((await call(review(next.data.request.id),"PATCH",adminA,
    {decision:"REJECT"})).status,400);
  const rejected=await call(review(next.data.request.id),"PATCH",adminA,
    {decision:"REJECT",reason:"Pengajuan tidak memenuhi dokumen"});
  assert.equal(rejected.status,200,JSON.stringify(rejected.data));
  assert.equal(rejected.data.status,"REJECTED");
  assert.equal((await call(review(next.data.request.id),"PATCH",adminA,
    {decision:"REVIEW_HOLD"})).status,409);
  assert.equal((await db.kasbonRequest.findUnique({where:{id:next.data.request.id}})).status,"REJECTED");
  const events=await db.auditLog.findMany({where:{clientId:a.client.id,entity:"KasbonRequest"}});
  assert.ok(events.length>=4);
  assert.ok(events.some(x=>x.action==="REJECT"));
  assert.ok(events.some(x=>x.action==="UPDATE"&&x.newValue?.status==="REVIEWED_HOLD"));
  console.log("PASS reject reason, one-way decisions, salary-free audit and no payout");
}
main().catch(e=>{
  console.error("Sprint2 kasbon intake HTTP failed",e instanceof Error?e.stack:String(e));
  process.exitCode=1;
}).finally(()=>db.$disconnect());
