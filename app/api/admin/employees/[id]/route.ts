import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { parseEmployeeEdit } from "@/lib/employees/edit-validation";
export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
async function authorize() {
  const actor = await getSession();
  if (!actor || actor.role !== "ADMIN" || !actor.clientId || actor.mustChangePassword) return null;
  return actor;
}
export async function GET(_request: Request, ctx: Context) {
  const actor = await authorize();
  if (!actor) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const { id } = await ctx.params;
  const employee = await db.pegawai.findFirst({
    where: { id, clientId: actor.clientId! },
    select: {
      id: true, idPegawai: true, nama: true, email: true, jabatan: true,
      gajiPokok: true, isActive: true, tanggalMasuk: true, siklusGaji: true,
      projectId: true, project: { select: { name: true } },
      user: { select: { isActive: true, mustChangePassword: true } },
    },
  });
  if (!employee) return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ employee: {
    id: employee.id, code: employee.idPegawai, name: employee.nama,
    email: employee.email, position: employee.jabatan || "",
    salary: employee.gajiPokok.toString(), active: employee.isActive,
    projectId: employee.projectId, projectName: employee.project.name,
    cycle: employee.siklusGaji, joinedAt: employee.tanggalMasuk?.toISOString() ?? null,
    accountActive: Boolean(employee.user?.isActive && !employee.user?.mustChangePassword),
  } }, { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(request: Request, ctx: Context) {
  const actor = await authorize();
  if (!actor) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const { id } = await ctx.params;
  let input: ReturnType<typeof parseEmployeeEdit>;
  try { input = parseEmployeeEdit(await request.json()); }
  catch { return NextResponse.json({ error: "Data perubahan tidak valid" }, { status: 400 }); }
  try {
    const result = await db.$transaction(async tx => {
      const employee = await tx.pegawai.findFirst({
        where: { id, clientId: actor.clientId!, client: { status: "AKTIF" } },
        select: { id: true, isActive: true, projectId: true },
      });
      if (!employee) return null;
      if (input.projectId) {
        const project = await tx.project.findFirst({
          where: { id: input.projectId, clientId: actor.clientId!, isActive: true },
          select: { id: true },
        });
        if (!project) throw new Error("Project unavailable");
      }
      const updated = await tx.pegawai.update({
        where: { id: employee.id },
        data: {
          ...(input.name !== undefined ? { nama: input.name } : {}),
          ...(input.position !== undefined ? { jabatan: input.position } : {}),
          ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
          ...(input.baseSalaryIdr !== undefined ? { gajiPokok: BigInt(input.baseSalaryIdr) } : {}),
          ...(input.active !== undefined ? { isActive: input.active } : {}),
        },
        select: { id: true, nama: true, isActive: true },
      });
      if (input.name !== undefined) await tx.user.updateMany({
        where: { pegawaiId: employee.id, clientId: actor.clientId! }, data: { name: input.name },
      });
      if (input.active === false) {
        await tx.user.updateMany({ where: { pegawaiId: employee.id, clientId: actor.clientId! },
          data: { isActive: false, tokenVersion: { increment: 1 } } });
        const users = await tx.user.findMany({
          where: { pegawaiId: employee.id, clientId: actor.clientId! }, select: { id: true },
        });
        if (users.length) await tx.employeeInvitation.updateMany({
          where: { userId: { in: users.map(u => u.id) }, usedAt: null }, data: { usedAt: new Date() },
        });
      }
      await tx.auditLog.create({ data: {
        clientId: actor.clientId!, actorId: actor.id, action: "UPDATE",
        entity: "Pegawai", entityId: employee.id,
        oldValue: { active: employee.isActive, projectId: employee.projectId },
        newValue: { fields: Object.keys(input), active: updated.isActive },
      } });
      return updated;
    });
    if (!result) return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ employee: result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && /Project unavailable/.test(error.message))
      return NextResponse.json({ error: "Project tidak tersedia" }, { status: 400 });
    console.error("Employee update failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Perubahan pegawai gagal" }, { status: 500 });
  }
}
