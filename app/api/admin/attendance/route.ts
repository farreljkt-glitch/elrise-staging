import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const actor = await getSession();
  if (!actor || actor.role !== "ADMIN" || !actor.clientId || actor.mustChangePassword)
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || "";
  if (!/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(date) ||
      Number.isNaN(new Date(date + "T00:00:00.000Z").getTime()) ||
      new Date(date+"T00:00:00.000Z").toISOString().slice(0,10)!==date)
    return NextResponse.json({ error: "Tanggal harus YYYY-MM-DD" }, { status: 400 });
  const projectId = url.searchParams.get("projectId") || "";
  if (projectId.length > 191) return NextResponse.json({ error: "Project tidak valid" }, { status: 400 });
  const page = Number(url.searchParams.get("page") || "1");
  if (!Number.isInteger(page) || page < 1 || page > 10000)
    return NextResponse.json({ error: "Halaman tidak valid" }, { status: 400 });
  try {
    const where = { clientId: actor.clientId, tanggal: new Date(date + "T00:00:00.000Z"),
      ...(projectId ? { projectId } : {}) };
    const [total, rows] = await Promise.all([
      db.attendance.count({ where }),
      db.attendance.findMany({ where, select: {
        id: true, status: true, checkInAt: true, checkOutAt: true,
        validatedAt: true, suspiciousFlags: true,
        pegawai: { select: { idPegawai: true, nama: true } },
        project: { select: { name: true } },
      }, orderBy: { createdAt: "desc" }, skip: (page-1)*100, take: 100 }),
    ]);
    return NextResponse.json({ date, page, pages: Math.ceil(total/100), total,
      rows: rows.map(r=>({
        id:r.id, code:r.pegawai.idPegawai, name:r.pegawai.nama, project:r.project.name,
        status:r.status, checkedInAt:r.checkInAt?.toISOString()??null,
        checkedOutAt:r.checkOutAt?.toISOString()??null,
        validated:Boolean(r.validatedAt), suspicious: r.suspiciousFlags!==null && JSON.stringify(r.suspiciousFlags)!=="[]" && JSON.stringify(r.suspiciousFlags)!=="{}",
      })) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Gagal membaca absensi" }, { status: 503 });
  }
}
