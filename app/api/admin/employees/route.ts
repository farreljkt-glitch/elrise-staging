import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { parseEmployeeSearch } from "@/lib/employees/search-validation";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const user = await getSession();
  if (!user || user.role !== "ADMIN" || !user.clientId || user.mustChangePassword)
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  let query: ReturnType<typeof parseEmployeeSearch>;
  try { query = parseEmployeeSearch(request.url); }
  catch { return NextResponse.json({error:"Parameter pencarian tidak valid"},{status:400}); }
  try {
  const where: Prisma.PegawaiWhereInput = { clientId: user.clientId,
    ...(query.q ? { OR: [
      { nama: { contains: query.q } }, { email: { contains: query.q } },
      { idPegawai: { contains: query.q } }, { jabatan: { contains: query.q } },
    ] } : {}),
  };
  const [total, employees] = await Promise.all([
    db.pegawai.count({where}),
    db.pegawai.findMany({
    where,
    select: {
      id: true, idPegawai: true, nama: true, email: true, jabatan: true,
      gajiPokok: true, isActive: true, siklusGaji: true, tanggalMasuk: true,
      project: { select: { id: true, name: true } },
      user: { select: { id: true, isActive: true, mustChangePassword: true } },
    },
    orderBy: [{ nama: "asc" }, { id: "asc" }],
    skip: (query.page-1)*query.pageSize,
    take: query.pageSize,
  }),
  ]);
  return NextResponse.json({
    employees: employees.map(e => ({
      id: e.id, code: e.idPegawai, name: e.nama, email: e.email,
      position: e.jabatan ?? "-", salary: e.gajiPokok.toString(),
      active: e.isActive, cycle: e.siklusGaji,
      joinedAt: e.tanggalMasuk?.toISOString() ?? null,
      project: e.project.name, projectId: e.project.id,
      accountStatus: !e.user ? "BELUM_DIUNDANG" :
        e.user.isActive && !e.user.mustChangePassword ? "AKTIF" : "BELUM_AKTIF",
    })),
    limited: query.page * query.pageSize < total,
    total, page: query.page, pageSize: query.pageSize, pages: Math.ceil(total/query.pageSize),
  }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Employee listing failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Gagal memuat karyawan" }, { status: 500 });
  }
}


export async function POST(request: Request) {
  const actor = await getSession();
  if (!actor || actor.role !== "ADMIN" || !actor.clientId || actor.mustChangePassword)
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  try {
    const { parseEmployeeCreate } = await import("@/lib/employees/create-validation");
    const payload = await request.json();
    const input = parseEmployeeCreate(payload);
    const result = await db.$transaction(async tx => {
      const client = await tx.client.findUnique({
        where: { id: actor.clientId! }, select: { status: true },
      });
      if (client?.status !== "AKTIF") throw new Error("Inactive tenant");
      const project = await tx.project.findFirst({
        where: { id: input.projectId, clientId: actor.clientId!, isActive: true },
        select: { id: true },
      });
      if (!project) throw new Error("Project unavailable");
      const conflicts = await Promise.all([
        tx.pegawai.findFirst({ where: { OR: [
          { clientId: actor.clientId!, idPegawai: input.employeeCode },
          { clientId: actor.clientId!, email: input.email },
        ] }, select: { id: true } }),
        tx.user.findFirst({ where: { email: input.email }, select: { id: true } }),
      ]);
      if (conflicts.some(Boolean)) throw new Error("Employee conflict");
      const created = await tx.pegawai.create({
        data: {
          clientId: actor.clientId!, projectId: project.id,
          idPegawai: input.employeeCode, nama: input.name,
          email: input.email, gajiPokok: BigInt(input.baseSalaryIdr),
        },
        select: { id: true, idPegawai: true, nama: true, email: true },
      });
      await tx.auditLog.create({ data: {
        clientId: actor.clientId!, actorId: actor.id, action: "CREATE", entity: "Pegawai", entityId: created.id,
        newValue: { employeeCode: created.idPegawai, projectId: project.id },
      } });
      return created;
    });
    return NextResponse.json({ employee: result, accountStatus: "NOT_PROVISIONED" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    if (/conflict|Unique constraint|P2002/i.test(message))
      return NextResponse.json({ error: "Data pegawai sudah digunakan" }, { status: 409 });
    if (/tenant|Project unavailable/.test(message))
      return NextResponse.json({ error: "Tenant atau project tidak tersedia" }, { status: 403 });
    if (/Invalid|Unexpected token|JSON/.test(message))
      return NextResponse.json({ error: "Data pegawai tidak valid" }, { status: 400 });
    console.error("Employee creation failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Gagal menambahkan pegawai" }, { status: 500 });
  }
}
