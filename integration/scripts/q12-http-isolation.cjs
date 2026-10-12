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
    clientId: clientB.id, projectId: projectB.id, nama: "Synthetic B", idPegawai: "EB-" + suffix,
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
  console.log("PASS tenant-filtered HTTP employee lists");

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

  const projectDenied = await request("/api/admin/employees", withCookie(cookieProject));
  assert.equal(projectDenied.response.status, 403);
  const projectTeam = await request("/api/project/team", withCookie(cookieProject));
  assert.equal(projectTeam.response.status, 200, JSON.stringify(projectTeam.body));
  assert.ok(projectTeam.body.employees.some(e=>e.id===employeeA.id));
  assert.ok(!projectTeam.body.employees.some(e=>e.id===employeeB.id));
  assert.ok(!JSON.stringify(projectTeam.body).includes("gajiPokok"));
  assert.ok(!JSON.stringify(projectTeam.body).includes("1000000"));
  console.log("PASS Admin Project boundary and salary redaction");
  console.log("PASS Q12 real HTTP tenant and project isolation");
}
main().catch(err => {
  console.error("Q12 HTTP test failed", err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
}).finally(()=>db.$disconnect());
