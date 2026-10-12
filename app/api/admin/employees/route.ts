import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "ADMIN" || !user.clientId || user.mustChangePassword)
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  try {
  const employees = await db.pegawai.findMany({
    where: { clientId: user.clientId },
    select: {
      id: true, idPegawai: true, nama: true, email: true, jabatan: true,
      gajiPokok: true, isActive: true, siklusGaji: true, tanggalMasuk: true,
      project: { select: { id: true, name: true } },
      user: { select: { id: true, isActive: true, mustChangePassword: true } },
    },
    orderBy: [{ nama: "asc" }, { id: "asc" }],
    take: 500,
  });
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
    limited: employees.length === 500,
  }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Employee listing failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Gagal memuat karyawan" }, { status: 500 });
  }
}
