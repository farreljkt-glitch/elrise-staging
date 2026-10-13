/** Elrise-only Sprint2 loan policy HTTP tests with fake verified staging link. */
const assert=require("node:assert/strict");
const {randomUUID}=require("node:crypto");
const bcrypt=require("bcryptjs");
const {PrismaClient}=require("@prisma/client");
const target=new URL(process.env.DATABASE_URL||"mysql://missing@invalid/none");
if(process.env.CI!=="true"||target.hostname!=="127.0.0.1"||target.pathname!=="/elrise_ci")
 throw new Error("Refusing to run outside disposable CI MySQL");
const db=new PrismaClient(),suffix=randomUUID().slice(0,8);
const base="http://127.0.0.1:3000",endpoint="/api/admin/loan-policies";
async function request(cookie,method="GET",body){
 const r=await fetch(base+endpoint,{
   method,redirect:"manual",headers:{cookie,...(body?{"content-type":"application/json"}:{})},
   ...(body?{body:JSON.stringify(body)}:{}),
 });
 let data;try{data=await r.json();}catch{data=null;}return {status:r.status,data};
}
async function login(email,password){
 const r=await fetch(base+"/api/auth/login",{method:"POST",
   headers:{"content-type":"application/json"},
   body:JSON.stringify({email,password}),redirect:"manual"});
 assert.equal(r.status,200,"login failed "+email);
 const cookie=r.headers.get("set-cookie")?.split(";")[0];
 assert.ok(cookie?.startsWith("tg_session="));return cookie;
}
async function createTenant(label,passwordHash){
 const tenant=await db.client.create({data:{
   code:"POL-"+label+"-"+suffix,name:"Synthetic policy tenant "+label,
 }});
 const project=await db.project.create({data:{
   clientId:tenant.id,code:"MAIN",name:"Main project",
 }});
 const employee=await db.pegawai.create({data:{
   clientId:tenant.id,projectId:project.id,idPegawai:"EMP-"+suffix,
   nama:"Synthetic Employee "+label,email:label+suffix+"@example.invalid",
 }});
 const email="admin-"+label+"-"+suffix+"@example.invalid";
 await db.user.create({data:{email,name:"Synthetic Admin "+label,role:"ADMIN",
   clientId:tenant.id,passwordHash,mustChangePassword:false}});
 await db.bundleSubscription.create({data:{
   clientId:tenant.id,mode:"BUNDLE",effectiveAt:new Date(Date.now()-86400000),
   provisionedByUserId:"synthetic-ci-superadmin",
 }});
 return {tenant,employee,email};
}
async function run(){
 const password="ci-policy-secret-"+suffix;
 const hash=await bcrypt.hash(password,12);
 const a=await createTenant("a",hash),b=await createTenant("b",hash);
 await db.integrationConnection.create({data:{
   clientId:a.tenant.id,externalTenantId:"draft-"+suffix,
   state:"DISABLED",verifiedAt:null,payrollOwner:"ELRISE",
 }});
 await db.integrationConnection.create({data:{
   clientId:b.tenant.id,externalTenantId:"verified-synthetic-"+suffix,
   state:"ACTIVE",verifiedAt:new Date(),payrollOwner:"ELRISE",
 }});
 const [cookieA,cookieB]=await Promise.all([login(a.email,password),login(b.email,password)]);
 const day=new Date(Date.now()+86400000).toISOString().slice(0,10);
 const payload={scope:"TENANT_DEFAULT",pegawaiIds:[],
   mode:"PERCENT_OF_PRE_KASBON_THP",percentBps:2500,
   denominatorDays:22,effectiveDate:day};
 const waiting=await request(cookieA,"POST",payload);
 assert.equal(waiting.status,409,JSON.stringify(waiting.data));
 assert.equal(await db.bundleLoanPolicy.count({where:{clientId:a.tenant.id}}),0);
 const statusA=await request(cookieA);
 assert.equal(statusA.status,200);
 assert.equal(statusA.data.policyConfigurationEnabled,false);
 console.log("PASS disabled synthetic draft cannot activate loan policies");

 const foreign=await request(cookieB,"POST",{...payload,
   scope:"EMPLOYEES",pegawaiIds:[a.employee.id]});
 assert.equal(foreign.status,409,JSON.stringify(foreign.data));
 const forbidden=await request(cookieB,"POST",{...payload,clientId:a.tenant.id});
 assert.equal(forbidden.status,400,"tenant mass assignment must be denied");

 const saved=await request(cookieB,"POST",payload);
 assert.equal(saved.status,201,JSON.stringify(saved.data));
 assert.equal(saved.data.savedCount,1);
 assert.equal((await request(cookieB,"POST",payload)).status,409,"same effective date must not duplicate");

 const fixed={scope:"EMPLOYEES",pegawaiIds:[b.employee.id],
   mode:"FIXED_IDR",fixedAmountIdr:"2500000",denominatorDays:22,effectiveDate:day};
 const savedFixed=await request(cookieB,"POST",fixed);
 assert.equal(savedFixed.status,201,JSON.stringify(savedFixed.data));
 const policyResponse=await request(cookieB);
 assert.equal(policyResponse.status,200);
 assert.equal(policyResponse.data.policyConfigurationEnabled,true);
 assert.ok(policyResponse.data.policies.some(p=>p.fixedAmountIdr==="2500000"));
 assert.equal(await db.bundleLoanPolicy.count({where:{clientId:b.tenant.id}}),2);
 assert.equal(await db.bundleLoanPolicy.count({where:{clientId:a.tenant.id}}),0);
 console.log("PASS Admin PT policy append-only writes, employee scope and percentage/fixed money");
 // Loan accrual must count only reviewed, complete, unflagged HADIR in payroll cycle.
 const lastMonthEnd=new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),0));
 const targetPeriod=lastMonthEnd.toISOString().slice(0,7);
 const day=offset=>new Date(lastMonthEnd.getTime()-offset*86400000);
 const presence=async(offset,status,flags=null,approved=true)=>{
  const tanggal=day(offset);
  const at=ms=>new Date(tanggal.getTime()+ms);
  return db.attendance.create({data:{
   clientId:b.tenant.id,projectId:(await db.pegawai.findUnique({where:{id:b.employee.id}})).projectId,
   pegawaiId:b.employee.id,tanggal,status,
   checkInAt:at(3600000),checkOutAt:at(9*3600000),
   validatedAt:approved?at(10*3600000):null,
   ...(flags?{suspiciousFlags:flags}:{}),
  }});
 };
 await presence(0,"HADIR");
 await presence(1,"TELAT");
 await presence(2,"HADIR",["gps_mismatch"]);
 await presence(3,"HADIR",null,false);
 const path="/api/admin/loan-accrual?pegawaiId="+encodeURIComponent(b.employee.id)+
   "&period="+encodeURIComponent(targetPeriod);
 const readiness=await fetch(base+path,{headers:{cookie:cookieB},redirect:"manual"});
 const preview=await readiness.json();
 assert.equal(readiness.status,200,JSON.stringify(preview));
 assert.equal(preview.validatedHadirDays,1,"only reviewed HADIR without flags is eligible");
 assert.equal(preview.availableLoanIdr,null,"no monetary loan balance before verified THP/outstanding");
 assert.equal(preview.readyForDisbursement,false);
 assert.ok(preview.blockers.includes("PRE_KASBON_THP_NOT_FINANCE_VERIFIED"));
 const unauthorized=await fetch(base+path,{headers:{cookie:cookieA},redirect:"manual"});
 assert.equal(unauthorized.status,404,"other PT cannot see employee presence");
 const badPeriod=await fetch(base+"/api/admin/loan-accrual?pegawaiId="+b.employee.id+
   "&period=W:2026-10-05",{headers:{cookie:cookieB},redirect:"manual"});
 assert.equal(badPeriod.status,400);
 console.log("PASS Sprint2 read-only validated HADIR tenant isolation; no loan payout");
 console.log("PASS Sprint2 Elrise policy API, no Gajiku network calls");
}
run().catch(e=>{
 console.error("Sprint2 loan policy HTTP failed",e instanceof Error?e.message:String(e));process.exitCode=1;
}).finally(()=>db.$disconnect());
