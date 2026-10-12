import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, getSession } from "@/lib/auth-server";

export const runtime = "nodejs";
const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(12, "Kata sandi baru minimal 12 karakter.").max(200),
}).refine((v) => v.currentPassword !== v.newPassword, {
  message: "Kata sandi baru harus berbeda dari kata sandi saat ini.",
  path: ["newPassword"],
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Sesi tidak valid. Silakan masuk kembali." }, { status: 401 });
  if (!(req.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
    return NextResponse.json({ message: "Format permintaan tidak valid." }, { status: 415 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Data kata sandi tidak valid." }, { status: 400 });
  try {
    const user = await db.user.findUnique({ where: { id: session.id } });
    if (!user || !user.isActive) return NextResponse.json({ message: "Akun tidak aktif." }, { status: 403 });
    if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
      return NextResponse.json({ message: "Kata sandi saat ini tidak sesuai." }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    const ip = req.headers.get("x-real-ip")?.slice(0, 45) ?? null;
    const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false, tokenVersion: { increment: 1 }, failedLoginCount: 0, lockedUntil: null } });
      await tx.auditLog.create({ data: { actorId: user.id, clientId: user.clientId, action: "UPDATE", entity: "UserPassword", entityId: user.id, oldValue: { mustChangePassword: user.mustChangePassword }, newValue: { passwordChanged: true }, ip, userAgent } });
    });
    const nextSession = { ...session, mustChangePassword: false };
    await createSession(nextSession);
    return NextResponse.json({ ok: true, message: "Kata sandi berhasil diperbarui." });
  } catch (error) {
    console.error("Perubahan kata sandi gagal:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ message: "Kata sandi belum berhasil diperbarui. Silakan coba lagi." }, { status: 503 });
  }
}
