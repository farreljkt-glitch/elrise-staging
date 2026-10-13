/** HTTP negative tests against Next dev and disposable MySQL elrise_ci. */
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const target = new URL(process.env.DATABASE_URL || "mysql://missing@invalid/none");
if (process.env.CI !== "true" || target.hostname !== "127.0.0.1" || target.pathname !== "/elrise_ci")
  throw new Error("Q12 refuses to run outside isolated CI MySQL");
const db = new PrismaClient();
const base = "http://127.0.0.1:3000";
const suffix = randomUUID().slice(0, 8);
async function request(path, options = {}) {
  const response = await fetch(base + path, { redirect: "manual", ...options });
  let body;
  try { body = await response.json(); } catch { body = null; }
  return { response, body };
}
async function login(email, password) {
  const { response, body } = await request("/api/auth/login", { method: "POST",
    headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  assert.equal(response.status, 200, "login failed: " + JSON.stringify(body));
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie?.startsWith("tg_session="), "missing session cookie");
  return cookie;
}
async function main() {
  const clientA = await db.client.create({ data: { code: "Q12A-" + suffix, name: "Q12 Tenant A" } });
  const clientB = await db.client.create({ data: { code: "Q12B-" + suffix, name: "Q12 Tenant B" } });
  const projectA = await db.project.create({ data: { clientId: clientA.id, code: "MAIN", name: "Project A" } });
  const projectB = await db.project.create({ data: { clientId: clientB.id, code: "MAIN", name: "Project B" } });
  const employeeA = await db.pegawai.create({ data: {
    clientId: clientA.id, projectId: projectA.id, nama: "Synthetic A", idPegawai: "EA-" + suffix,
    email: "employee-a-" + suffix + "@example.com", gajiPokok: 1_000_000n,
  } });
  const employeeB = await db.pegawai.create({ data: {
    clientId: clientB.id, projectId: projectB.id, nama: "Synthetic B", idPegawai: "EA-" + suffix,
    email: "employee-b-" + suffix + "@example.com", gajiPokok: 2_000_000n,
  } });
  const password = "ci-demo-secret-" + suffix;
  const passwordHash = await bcrypt.hash(password, 12);
  const a = "admin-a-" + suffix + "@example.com";
  const b = "admin-b-" + suffix + "@example.com";
  const projectEmail = "project-" + suffix + "@example.com";
  await db.user.createMany({ data: [
    { email: a, name: "Admin A", passwordHash, role: "ADMIN", clientId: clientA.id, mustChangePassword: false },
    { email: b, name: "Admin B", passwordHash, role: "ADMIN", clientId: clientB.id, mustChangePassword: false },
    { email: projectEmail, name: "Project Manager", passwordHash, role: "ADMIN_PROJECT",
      clientId: clientA.id, managedProjectId: projectA.id, mustChangePassword: false },
  ] });
  const cookieA = await login(a, password);
  const cookieB = await login(b, password);
  const cookieProject = await login(projectEmail, password);
  const withCookie = cookie => ({ headers: { cookie } });

  const listA = await request("/api/admin/employees", withCookie(cookieA));
  const listB = await request("/api/admin/employees", withCookie(cookieB));
  assert.equal(listA.response.status, 200);
  assert.equal(listB.response.status, 200);
  assert.ok(listA.body.employees.some(x=>x.id===employeeA.id));
  assert.ok(!listA.body.employees.some(x=>x.id===employeeB.id));
  assert.ok(listB.body.employees.some(x=>x.id===employeeB.id));
  assert.ok(!listB.body.employees.some(x=>x.id===employeeA.id));
  assert.equal(employeeA.idPegawai,employeeB.idPegawai);
  console.log("PASS tenant-filtered HTTP lists with duplicate codes across PT");

  const detailB = await request("/api/admin/employees/" + employeeB.id, withCookie(cookieA));
  assert.equal(detailB.response.status, 404);
  const crossEdit = await request("/api/admin/employees/" + employeeB.id, {
    method: "PATCH", headers: { cookie: cookieA, "content-type": "application/json" },
    body: JSON.stringify({ name: "INTRUDER" }),
  });
  assert.equal(crossEdit.response.status, 404);
  assert.equal((await db.pegawai.findUnique({ where: { id: employeeB.id } })).nama, "Synthetic B");
  console.log("PASS cross-tenant IDOR reads and mutations denied");

  const crossCreate = await request("/api/admin/employees", {
    method: "POST", headers: { cookie: cookieA, "content-type": "application/json" },
    body: JSON.stringify({ employeeCode:"X-" + suffix,name:"Unauthorized",email:"no-"+suffix+"@example.com",
      projectId:projectB.id,baseSalaryIdr:"1000000" }),
  });
  assert.equal(crossCreate.response.status, 403, JSON.stringify(crossCreate.body));
  console.log("PASS cross-tenant project assignment denied");

  const ownCreate = await request("/api/admin/employees", {
    method: "POST", headers: { cookie: cookieA, "content-type": "application/json" },
    body: JSON.stringify({ employeeCode:"NEW-" + suffix,name:"Authorized Person",
      email:"new-"+suffix+"@example.com",projectId:projectA.id,baseSalaryIdr:"1000000" }),
  });
  assert.equal(ownCreate.response.status, 201, JSON.stringify(ownCreate.body));
  assert.ok(await db.pegawai.findFirst({ where: { id:ownCreate.body.employee.id,clientId:clientA.id } }));
  console.log("PASS authorized Admin PT employee creation persists");

  // Invitation, activation and session account provisioning are exercised over HTTP.
  const foreignInvite = await request("/api/admin/employee-invitations", {
    method: "POST", headers: { cookie: cookieA, "content-type": "application/json" },
    body: JSON.stringify({ pegawaiId: employeeB.id }),
  });
  assert.equal(foreignInvite.response.status, 400, "foreign tenant invitation must be denied");
  const invite = await request("/api/admin/employee-invitations", {
    method: "POST", headers: { cookie: cookieA, "content-type": "application/json" },
    body: JSON.stringify({ pegawaiId: ownCreate.body.employee.id }),
  });
  assert.equal(invite.response.status, 200, JSON.stringify(invite.body));
  assert.ok(invite.body.token && invite.body.token.length >= 40);
  const activatedPassword = "new-employee-secret-" + suffix;
  const activate = await request("/api/auth/employee-invitation", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: invite.body.token, password: activatedPassword }),
  });
  assert.equal(activate.response.status, 200, JSON.stringify(activate.body));
  const replay = await request("/api/auth/employee-invitation", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: invite.body.token, password: activatedPassword }),
  });
  assert.equal(replay.response.status, 400, "used invitation must not activate again");
  const cookieEmployee = await login("new-"+suffix+"@example.com", activatedPassword);
  const employeeAdminDenied = await request("/api/admin/employees", withCookie(cookieEmployee));
  assert.equal(employeeAdminDenied.response.status, 403);
  console.log("PASS tenant-scoped invitation, single-use activation and employee RBAC");

  const projectDenied = await request("/api/admin/employees", withCookie(cookieProject));
  assert.equal(projectDenied.response.status, 403);
  const projectTeam = await request("/api/project/team", withCookie(cookieProject));
  assert.equal(projectTeam.response.status, 200, JSON.stringify(projectTeam.body));
  assert.ok(projectTeam.body.employees.some(e=>e.id===employeeA.id));
  assert.ok(!projectTeam.body.employees.some(e=>e.id===employeeB.id));
  assert.ok(!JSON.stringify(projectTeam.body).includes("gajiPokok"));
  assert.ok(!JSON.stringify(projectTeam.body).includes("1000000"));
  console.log("PASS Admin Project boundary and salary redaction");

  // Privileged role creation must require Superadmin and a same-tenant project.
  const superEmail = "super-"+suffix+"@example.com";
  await db.user.create({ data: {
    email: superEmail, name: "Synthetic Superadmin", passwordHash,
    role: "SUPERADMIN", mustChangePassword: false,
  } });
  const cookieSuper = await login(superEmail,password);
  const unauthorizedAdminInvite = await request("/api/superadmin/admin-invitations", {
    method: "POST",headers:{cookie:cookieA,"content-type":"application/json"},
    body:JSON.stringify({clientId:clientA.id,role:"ADMIN_PROJECT",projectId:projectA.id,
      name:"Should be denied",email:"denied-"+suffix+"@example.com"}),
  });
  assert.equal(unauthorizedAdminInvite.response.status,403);

  const foreignAdminInvite = await request("/api/superadmin/admin-invitations",{
    method:"POST",headers:{cookie:cookieSuper,"content-type":"application/json"},
    body:JSON.stringify({clientId:clientA.id,role:"ADMIN_PROJECT",projectId:projectB.id,
      name:"Foreign Manager",email:"foreign-"+suffix+"@example.com"}),
  });
  assert.equal(foreignAdminInvite.response.status,403,
    "Superadmin must not assign a cross-tenant project");

  const adminProjectEmail="manager-"+suffix+"@example.com";
  const adminInvite = await request("/api/superadmin/admin-invitations",{
    method:"POST",headers:{cookie:cookieSuper,"content-type":"application/json"},
    body:JSON.stringify({clientId:clientA.id,role:"ADMIN_PROJECT",projectId:projectA.id,
      name:"Assigned Manager",email:adminProjectEmail}),
  });
  assert.equal(adminInvite.response.status,201,JSON.stringify(adminInvite.body));
  assert.ok(adminInvite.body.token && adminInvite.body.token.length>=40);
  const inactiveManager=await db.user.findUnique({where:{email:adminProjectEmail}});
  assert.equal(inactiveManager.isActive,false);
  assert.equal(inactiveManager.clientId,clientA.id);
  assert.equal(inactiveManager.managedProjectId,projectA.id);

  const managerPassword="manager-password-"+suffix;
  const adminActivate=await request("/api/auth/admin-invitation",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({token:adminInvite.body.token,password:managerPassword}),
  });
  assert.equal(adminActivate.response.status,200,JSON.stringify(adminActivate.body));
  const adminReplay=await request("/api/auth/admin-invitation",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({token:adminInvite.body.token,password:managerPassword}),
  });
  assert.equal(adminReplay.response.status,400);
  const cookieManager=await login(adminProjectEmail,managerPassword);
  const managerScope=await request("/api/project/team",withCookie(cookieManager));
  assert.equal(managerScope.response.status,200,JSON.stringify(managerScope.body));
  assert.ok(managerScope.body.employees.some(e=>e.id===employeeA.id));
  assert.ok(!managerScope.body.employees.some(e=>e.id===employeeB.id));
  assert.equal((await request("/api/admin/employees",withCookie(cookieManager))).response.status,403);

  const adminPTEmail="tenant-admin-"+suffix+"@example.com";
  const ptInvite=await request("/api/superadmin/admin-invitations",{
    method:"POST",headers:{cookie:cookieSuper,"content-type":"application/json"},
    body:JSON.stringify({clientId:clientB.id,role:"ADMIN",projectId:null,
      name:"Admin PT B",email:adminPTEmail}),
  });
  assert.equal(ptInvite.response.status,201,JSON.stringify(ptInvite.body));
  const ptActivate=await request("/api/auth/admin-invitation",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({token:ptInvite.body.token,password:"tenant-admin-"+suffix}),
  });
  assert.equal(ptActivate.response.status,200,JSON.stringify(ptActivate.body));
  const cookieAdminPT=await login(adminPTEmail,"tenant-admin-"+suffix);
  const ptList=await request("/api/admin/employees",withCookie(cookieAdminPT));
  assert.equal(ptList.response.status,200);
  assert.ok(ptList.body.employees.some(e=>e.id===employeeB.id));
  assert.ok(!ptList.body.employees.some(e=>e.id===employeeA.id));
  // Real check-in/out must never auto-validate; approval is a separate role-scoped action.
  await db.clientSetting.create({data:{
    clientId:clientA.id,workDays:[1,2,3,4,5],holidays:[],
    attendanceEnabled:true,payrollEnabled:true,requireSelfie:false,
  }});
  await db.officeLocation.create({data:{
    clientId:clientA.id,projectId:projectA.id,name:"Synthetic Office",
    lat:-6.2,lng:106.8,radiusM:100,isActive:true,
  }});
  const sendPresence=async action=>{
    const form=new FormData();
    for(const [k,v] of Object.entries({action,lat:"-6.2",lng:"106.8",accuracyM:"12"}))
      form.set(k,v);
    return request("/api/absen",{method:"POST",headers:{cookie:cookieEmployee},body:form});
  };
  const freshCheckIn=await sendPresence("CHECK_IN");
  assert.equal(freshCheckIn.response.status,201,JSON.stringify(freshCheckIn.body));
  const checkinRow=await db.attendance.findUnique({where:{id:freshCheckIn.body.attendanceId}});
  assert.equal(checkinRow.validatedAt,null,"check-in must not pre-approve attendance");
  assert.equal(checkinRow.checkOutAt,null,"check-in is incomplete");
  const doubleCheckIn=await sendPresence("CHECK_IN");
  assert.equal(doubleCheckIn.response.status,409);
  const checkedOut=await sendPresence("CHECK_OUT");
  assert.equal(checkedOut.response.status,201,JSON.stringify(checkedOut.body));
  const completeRow=await db.attendance.findUnique({where:{id:checkinRow.id}});
  assert.ok(completeRow.checkOutAt);
  assert.equal(completeRow.validatedAt,null,"check-out must still require approval");
  const newReview=await request("/api/attendance/review/"+checkinRow.id,{
    method:"POST",headers:{cookie:cookieProject,"content-type":"application/json"},
    body:JSON.stringify({decision:"APPROVE"}),
  });
  assert.equal(newReview.response.status,200,JSON.stringify(newReview.body));
  const validatedRow=await db.attendance.findUnique({where:{id:checkinRow.id}});
  assert.ok(validatedRow.validatedAt);
  assert.ok(validatedRow.validatedAt>=completeRow.checkOutAt);
  console.log("PASS P0 check-in/out remain unvalidated until scoped review");

  // Validated presence must be scoped to the acting PT/project and block suspicious cases.
  const attendanceDate=new Date("2026-10-11T00:00:00.000Z");
  const checkInAt=new Date("2026-10-11T01:00:00.000Z");
  const checkOutAt=new Date("2026-10-11T09:00:00.000Z");
  const attendanceA=await db.attendance.create({data:{
    clientId:clientA.id,projectId:projectA.id,pegawaiId:employeeA.id,
    tanggal:attendanceDate,status:"HADIR",checkInAt,checkOutAt,
  }});
  const attendanceB=await db.attendance.create({data:{
    clientId:clientB.id,projectId:projectB.id,pegawaiId:employeeB.id,
    tanggal:attendanceDate,status:"HADIR",checkInAt,checkOutAt,
  }});
  const approveReq=(id,cookie)=>request("/api/attendance/review/"+id,{
    method:"POST",headers:{cookie,"content-type":"application/json"},
    body:JSON.stringify({decision:"APPROVE"}),
  });
  assert.equal((await approveReq(attendanceB.id,cookieProject)).response.status,404,
    "Admin Project must not approve a foreign tenant/project attendance");
  assert.equal((await approveReq(attendanceA.id,cookieB)).response.status,404,
    "Admin PT must not approve attendance of another company");
  assert.equal((await approveReq(attendanceA.id,cookieEmployee)).response.status,403,
    "Employees cannot approve their own attendance");
  const approved=await approveReq(attendanceA.id,cookieProject);
  assert.equal(approved.response.status,200,JSON.stringify(approved.body));
  assert.ok((await db.attendance.findUnique({where:{id:attendanceA.id}})).validatedAt);
  assert.equal((await approveReq(attendanceA.id,cookieProject)).response.status,409,
    "Replayed attendance approval must not cause double business effect");

  const flagged=await db.attendance.create({data:{
    clientId:clientA.id,projectId:projectA.id,pegawaiId:ownCreate.body.employee.id,
    tanggal:attendanceDate,status:"TELAT",checkInAt,checkOutAt,
    suspiciousFlags:["gps_mismatch"],
  }});
  assert.equal((await approveReq(flagged.id,cookieA)).response.status,422);
  assert.equal((await db.attendance.findUnique({where:{id:flagged.id}})).validatedAt,null);
  console.log("PASS T1 validated attendance approval RBAC, replay and anomaly rejection");

  // Emergency offboarding must invalidate even already-issued JWT cookies.
  const unauthorizedRevoke=await request("/api/superadmin/admin-accounts/"+inactiveManager.id,{
    method:"PATCH",headers:{cookie:cookieA,"content-type":"application/json"},
    body:JSON.stringify({active:false}),
  });
  assert.equal(unauthorizedRevoke.response.status,403);
  const invalidRevoke=await request("/api/superadmin/admin-accounts/"+inactiveManager.id,{
    method:"PATCH",headers:{cookie:cookieSuper,"content-type":"application/json"},
    body:JSON.stringify({active:true}),
  });
  assert.equal(invalidRevoke.response.status,400);
  const revoked=await request("/api/superadmin/admin-accounts/"+inactiveManager.id,{
    method:"PATCH",headers:{cookie:cookieSuper,"content-type":"application/json"},
    body:JSON.stringify({active:false}),
  });
  assert.equal(revoked.response.status,200,JSON.stringify(revoked.body));
  const oldSession=await request("/api/project/team",withCookie(cookieManager));
  assert.equal(oldSession.response.status,403,"offboarded admin old session must be revoked");
  const loginRevoked=await request("/api/auth/login",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({email:adminProjectEmail,password:managerPassword}),
  });
  assert.equal(loginRevoked.response.status,401);
  const revokedAgain=await request("/api/superadmin/admin-accounts/"+inactiveManager.id,{
    method:"PATCH",headers:{cookie:cookieSuper,"content-type":"application/json"},
    body:JSON.stringify({active:false}),
  });
  assert.equal(revokedAgain.response.status,409);
  console.log("PASS S4 privileged access revocation and JWT invalidation");

  console.log("PASS S3 Superadmin privileged invitations and role-scoped activation");

  console.log("PASS Q12 real HTTP tenant and project isolation");
}
main().catch(err => {
  console.error("Q12 HTTP test failed", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
}).finally(()=>db.$disconnect());
