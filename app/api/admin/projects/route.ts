import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  const actor = await getSession();
  if (!actor || actor.role !== "ADMIN" || !actor.clientId || actor.mustChangePassword)
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  try {
    const projects = await db.project.findMany({
      where: { clientId: actor.clientId, isActive: true, client: { status: "AKTIF" } },
      select: { id: true, name: true, code: true }, orderBy: { name: "asc" }, take: 250,
    });
    return NextResponse.json({ projects }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Gagal memuat project" }, { status: 503 });
  }
}
