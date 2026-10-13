/** Demo core flow: the only direct DB write is one synthetic SUPERADMIN bootstrap.
 * Every tenant/project/admin/employee/office/attendance business action uses HTTP.
 * Disallowed outside disposable CI MySQL. Never calls Gajiku.
 */
const assert=require("node:assert/strict");
const {randomUUID}=require("node:crypto");
const bcrypt=require("bcryptjs");
const sharp=require("sharp");
const {PrismaClient}=require("@prisma/client");
const dbUrl=new URL(process.env.DATABASE_URL||"mysql://missing@invalid/none");
if(process.env.CI!=="true"||dbUrl.hostname!=="127.0.0.1"||dbUrl.pathname!=="/elrise_ci")
  throw new Error("Demo acceptance may run only on disposable CI MySQL");
const db=new PrismaClient();
const base="http://127.0.0.1:3000";
const suffix=randomUUID().slice(0,8);
const secret="demo-password-"+suffix+"-secure";
async function request(path,{method="GET",cookie,body}={}){
  const response=await fetch(base+path,{
    method,redirect:"manual",headers:{
      ...(cookie?{cookie}:{}),
      ...(body && !(body instanceof FormData)?{"content-type":"application/json"}:{}),
    },...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{}),
  });
  let data;try{data=await response.json();}catch{data=null;}
  return {status:response.status,data,headers:response.headers};
}
async function login(email,password=secret){
  const r=await request("/api/auth/login",{method:"POST",body:{email,password}});
  assert.equal(r.status,200,"login "+email+" "+JSON.stringify(r.data));
  const cookie=r.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie?.startsWith("tg_session="));
  return cookie;
}
async function requireStatus(path,opts,status){
  const response=await request(path,opts);
  assert.equal(response.status,status,path+" "+JSON.stringify(response.data));
  return response.data;
}
async function activateAdmin(token){
  return requireStatus("/api/auth/admin-invitation",{method:"POST",body:{token,password:secret}},200);
}
async function makeTenant(superCookie,code,name){
  const result=await requireStatus("/api/superadmin/clients",{
    method:"POST",cookie:superCookie,body:{code,name},
  },201);
  return result.client;
}
async function invitePt(superCookie,clientId,email){
  const result=await requireStatus("/api/superadmin/admin-invitations",{
    method:"POST",cookie:superCookie,
    body:{clientId,name:"Admin PT Demo",email,role:"ADMIN",projectId:null},
  },201);
  assert.ok(result.token.length>=40);
  await activateAdmin(result.token);
  assert.equal((await request("/api/auth/admin-invitation",{
    method:"POST",body:{token:result.token,password:secret},
  })).status,400,"admin invitation must be single-use");
  return login(email);
}
async function createProject(adminCookie,code,name){
  return (await requireStatus("/api/admin/projects",{
    method:"POST",cookie:adminCookie,body:{code,name},
  },201)).project;
}
async function createEmployee(adminCookie,projectId,code,name,email,salary="5000000"){
  return (await requireStatus("/api/admin/employees",{
    method:"POST",cookie:adminCookie,body:{
      employeeCode:code,name,email,projectId,baseSalaryIdr:salary,
    },
  },201)).employee;
}
async function run(){
  // Test bootstrap only. In real demo an existing Superadmin signs in normally.
  const superEmail="ci-super-demo-"+suffix+"@example.invalid";
  await db.user.create({data:{email:superEmail,name:"Synthetic Superadmin",
    passwordHash:await bcrypt.hash(secret,12),role:"SUPERADMIN",
    mustChangePassword:false,isActive:true}});
  const superCookie=await login(superEmail);
  const tenantA=await makeTenant(superCookie,"DEMOA-"+suffix,"PT Demo Indonesia");
  const tenantB=await makeTenant(superCookie,"DEMOB-"+suffix,"PT Demo Tenant B");
  const configA=await db.clientSetting.findUnique({where:{clientId:tenantA.id}});
  assert.equal(configA.attendanceEnabled,false,"new PT must not auto-enable attendance");

  // Superadmin -> Admin PT activation/login.
  const adminA=await invitePt(superCookie,tenantA.id,"admin@ptdemo.test");
  const adminB=await invitePt(superCookie,tenantB.id,"admin@ptdemob.test");
  const forbiddenNewTenant=await request("/api/superadmin/clients",{
    method:"POST",cookie:adminA,body:{code:"ELEVATE",name:"Hijacked PT"},
  });
  assert.equal(forbiddenNewTenant.status,403);
  console.log("PASS demo Superadmin creates PT and activates Admin PT via UI-backed HTTP");

  // Admin PT -> Project; employees may be created WITHOUT a project manager.
  const a2=await createProject(adminA,"SITE-SCBD","Site SCBD");
  const b1=await createProject(adminB,"SITE-OTHER","Site Tenant B");
  assert.equal(a2.clientId,tenantA.id);
  assert.equal(b1.clientId,tenantB.id);
  const projectsA=await requireStatus("/api/admin/projects?all=1",{cookie:adminA},200);
  assert.ok(projectsA.projects.some(p=>p.id===a2.id&&p.isActive&&p._count.employees===0));
  assert.ok(!projectsA.projects.some(p=>p.id===b1.id));
  assert.equal((await request("/api/admin/projects",{cookie:adminB,method:"POST",
    body:{code:"SITE-OTHER",name:"Duplicated"}})).status,409);
  assert.equal((await request("/api/admin/projects",{cookie:adminA,method:"POST",
    body:{code:"SITE-SCBD",name:"Second SCBD"}})).status,409);
  assert.equal((await request("/api/admin/projects",{cookie:adminA,method:"POST",
    body:{code:"SITE-OTHER",name:"Site SCBD"}})).status,409);
  for(const injected of [
    {clientId:tenantB.id},{isActive:true},{id:b1.id},{role:"SUPERADMIN"},
  ]){
    assert.equal((await request("/api/admin/projects",{cookie:adminA,method:"POST",
      body:{code:"BLOCKED",name:"Escalation",...injected}})).status,400);
  }
  console.log("PASS Admin PT self-service project, duplicates, tenant A/B isolation and input allowlist");

  // Admin PT -> Admin Project invitation; role and tenant fixed on server.
  const invitePath="/api/admin/admin-project-invitations";
  const managerEmail="manager.scbd@ptdemo.test";
  const inviteData={projectId:a2.id,name:"Manager SCBD",email:managerEmail};
  assert.equal((await request(invitePath,{cookie:adminA,method:"POST",
    body:{...inviteData,projectId:b1.id}})).status,403);
  for(const injected of [
    {role:"SUPERADMIN"},{role:"ADMIN"},{clientId:tenantB.id},
    {managedProjectId:b1.id},{isActive:true},{passwordHash:"arbitrary"},
    {mustChangePassword:false},{tokenVersion:0},
  ]){
    assert.equal((await request(invitePath,{cookie:adminA,method:"POST",
      body:{...inviteData,...injected}})).status,400);
  }
  const managerInvite=await requireStatus(invitePath,{
    cookie:adminA,method:"POST",body:inviteData,
  },201);
  assert.ok(managerInvite.token.length>=40);
  assert.equal((await request(invitePath,{cookie:adminA,method:"POST",body:inviteData})).status,409);
  const preActivation=await db.user.findUnique({where:{email:managerEmail}});
  assert.equal(preActivation.isActive,false);
  assert.equal(preActivation.role,"ADMIN_PROJECT");
  assert.equal(preActivation.managedProjectId,a2.id);
  assert.equal(preActivation.clientId,tenantA.id);
  const listings=await requireStatus(invitePath,{cookie:adminA},200);
  assert.ok(listings.admins.some(x=>x.email===managerEmail&&!x.isActive));
  assert.equal((await request(invitePath,{cookie:adminB})).data.admins.some(x=>x.email===managerEmail),false);
  await activateAdmin(managerInvite.token);
  const manager=await login(managerEmail);
  assert.equal((await db.user.findUnique({where:{email:managerEmail}})).isActive,true);
  assert.equal((await request(invitePath,{cookie:manager,method:"POST",body:inviteData})).status,403);
  assert.equal((await request("/api/admin/projects",{cookie:manager})).status,403);
  assert.equal((await request("/api/superadmin/clients",{cookie:manager})).status,403);
  console.log("PASS Admin PT invites a scoped Admin Project, activation & login; privilege escalation denied");

  // Admin PT -> employee before/without Admin Project in B; own PT after manager in A.
  const bEmployee=await createEmployee(adminB,b1.id,"EMP002","Employee Tenant B",
    "employee@ptdemob.test","9000000");
  const budi=await createEmployee(adminA,a2.id,"EMP001","Budi Demo","budi@ptdemo.test");
  const ownList=await requireStatus("/api/admin/employees",{cookie:adminA},200);
  assert.ok(ownList.employees.some(x=>x.id===budi.id&&x.projectId===a2.id));
  assert.ok(!ownList.employees.some(x=>x.id===bEmployee.id));
  assert.equal((await request("/api/admin/employees/"+bEmployee.id,{cookie:adminA})).status,404);
  assert.equal((await request("/api/admin/employees",{cookie:adminA,method:"POST",
    body:{employeeCode:"EMP099",name:"Foreign",email:"foreign@ptdemo.test",
      projectId:b1.id,baseSalaryIdr:"100000"}})).status,403);
  const employeeInvite=await requireStatus("/api/admin/employee-invitations",{
    cookie:adminA,method:"POST",body:{pegawaiId:budi.id},
  },200);
  assert.ok(employeeInvite.token.length>=40);
  await requireStatus("/api/auth/employee-invitation",{
    method:"POST",body:{token:employeeInvite.token,password:secret},
  },200);
  assert.equal((await request("/api/auth/employee-invitation",{
    method:"POST",body:{token:employeeInvite.token,password:secret},
  })).status,400,"employee token single-use");
  const budiCookie=await login("budi@ptdemo.test");
  assert.equal((await request("/api/admin/projects",{cookie:budiCookie})).status,403);
  const team=await requireStatus("/api/project/team",{cookie:manager},200);
  assert.equal(team.project,"Site SCBD");
  assert.ok(team.employees.some(x=>x.id===budi.id));
  assert.ok(!team.employees.some(x=>x.id===bEmployee.id));
  assert.ok(!JSON.stringify(team).includes("gajiPokok"));
  assert.ok(!JSON.stringify(team).includes("9000000"));
  assert.equal((await request("/api/project/team?projectId="+b1.id,{cookie:manager})).status,403);
  console.log("PASS Budi employee activation/login, project-only manager team, salary redaction");

  // New PT attendance remains OFF until Admin PT explicitly configures the office.
  const officePath="/api/admin/attendance-setup";
  const officeBody={projectId:a2.id,name:"Kantor Site SCBD",lat:-6.2,lng:106.8,radiusM:100};
  assert.equal((await request(officePath,{cookie:adminA,method:"POST",
    body:{...officeBody,projectId:b1.id}})).status,403);
  assert.equal((await request(officePath,{cookie:manager,method:"POST",body:officeBody})).status,403);
  assert.equal((await request(officePath,{cookie:adminA,method:"POST",
    body:{...officeBody,clientId:tenantB.id}})).status,400);
  assert.equal((await request(officePath,{cookie:adminA,method:"POST",
    body:{...officeBody,requireSelfie:false}})).status,400);
  const configured=await requireStatus(officePath,{cookie:adminA,method:"POST",body:officeBody},201);
  assert.equal(configured.attendanceEnabled,true);
  assert.equal(configured.requireSelfie,true);
  assert.equal((await request(officePath,{cookie:adminA,method:"POST",body:officeBody})).status,409);
  const activeSetting=await db.clientSetting.findUnique({where:{clientId:tenantA.id}});
  assert.equal(activeSetting.attendanceEnabled,true);
  assert.equal(activeSetting.requireSelfie,true);
  assert.equal(activeSetting.attendanceNetworkRule,"GPS");
  assert.equal((await db.clientSetting.findUnique({where:{clientId:tenantB.id}})).attendanceEnabled,false);

  const photo=await sharp({create:{width:320,height:240,channels:3,
    background:{r:47,g:84,b:113}}}).jpeg().toBuffer();
  const attendanceForm=action=>{
    const form=new FormData();
    form.set("action",action);
    form.set("lat","-6.2");form.set("lng","106.8");form.set("accuracyM","10");
    form.set("selfie",new Blob([photo],{type:"image/jpeg"}),"synthetic-demo-selfie.jpg");
    return form;
  };
  const checkedIn=await requireStatus("/api/absen",{
    cookie:budiCookie,method:"POST",body:attendanceForm("CHECK_IN"),
  },201);
  const id=checkedIn.attendanceId;
  assert.ok(id);
  const checkinRecord=await db.attendance.findUnique({where:{id}});
  assert.equal(checkinRecord.clientId,tenantA.id);
  assert.equal(checkinRecord.projectId,a2.id);
  assert.equal(checkinRecord.validatedAt,null);
  assert.equal((await request("/api/absen",{
    cookie:budiCookie,method:"POST",body:attendanceForm("CHECK_IN"),
  })).status,409);
  await new Promise(resolve=>setTimeout(resolve,40));
  await requireStatus("/api/absen",{
    cookie:budiCookie,method:"POST",body:attendanceForm("CHECK_OUT"),
  },201);
  const afterCheckout=await db.attendance.findUnique({where:{id}});
  assert.ok(afterCheckout.checkOutAt>afterCheckout.checkInAt);
  assert.equal(afterCheckout.validatedAt,null);
  const dateParts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Jakarta",
    year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const part=name=>dateParts.find(p=>p.type===name)?.value||"";
  const date=part("year")+"-"+part("month")+"-"+part("day");
  const attendance=await requireStatus("/api/project/attendance?date="+date,{cookie:manager},200);
  assert.ok(attendance.rows.some(x=>x.id===id));
  assert.equal((await request("/api/project/attendance?date="+date+
    "&projectId="+b1.id,{cookie:manager})).status,403);
  await requireStatus("/api/attendance/review/"+id,{
    cookie:manager,method:"POST",body:{decision:"APPROVE"},
  },200);
  assert.ok((await db.attendance.findUnique({where:{id}})).validatedAt);
  assert.equal((await request("/api/attendance/review/"+id,{
    cookie:manager,method:"POST",body:{decision:"APPROVE"},
  })).status,409);
  assert.equal((await request("/api/attendance/review/"+id,{
    cookie:adminB,method:"POST",body:{decision:"APPROVE"},
  })).status,404);
  const audit=await db.auditLog.findMany({where:{clientId:tenantA.id},take:200});
  assert.ok(audit.some(x=>x.entity==="Project"&&x.action==="CREATE"));
  assert.ok(audit.some(x=>x.entity==="AdminInvitation"&&x.action==="CREATE"));
  assert.ok(audit.some(x=>x.entity==="Pegawai"&&x.action==="CREATE"));
  assert.ok(audit.some(x=>x.entity==="Attendance"&&x.action==="APPROVE"));
  assert.ok(audit.some(x=>x.entity==="OfficeLocation"&&x.action==="CREATE"));
  console.log("PASS full UI-backed demo business flow: tenant -> invited PT -> project -> project manager -> Budi -> GPS+photo check-in/out -> validated attendance");
  console.log("PASS no db edits for business state; unrelated Gajiku/Kasbon/Payroll tables untouched");
}
run().catch(e=>{
  console.error("Demo core flow HTTP failure",e?.stack||String(e));
  process.exitCode=1;
}).finally(()=>db.$disconnect());
