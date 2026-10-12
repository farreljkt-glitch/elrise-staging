import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const hashInvite = (token: string) => createHash("sha256").update(token).digest("hex");

/** Called only by an authenticated Admin PT endpoint. Return secret exactly once. */
export async function issueEmployeeInvitation(clientId: string, pegawaiId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashInvite(token);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const placeholderHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
  const result = await db.$transaction(async tx => {
    const employee = await tx.pegawai.findFirst({
      where: { id: pegawaiId, clientId, isActive: true, client: { status: "AKTIF" } },
      select: { id: true, nama: true, email: true }
    });
    if (!employee) throw new Error("Karyawan tidak ditemukan");
    const existing = await tx.user.findUnique({ where: { email: employee.email } });
    if (existing && (existing.clientId !== clientId || existing.pegawaiId !== employee.id || existing.role !== "PEGAWAI"))
      throw new Error("Email sudah terdaftar pada akun lain");
    if (existing && !existing.mustChangePassword) throw new Error("Akun sudah aktif; gunakan alur reset password");
    const user = existing ?? await tx.user.create({
      data: { email: employee.email, name: employee.nama, passwordHash: placeholderHash,
        role: "PEGAWAI", clientId, pegawaiId: employee.id, mustChangePassword: true, isActive: false }
    });
    await tx.employeeInvitation.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
    await tx.employeeInvitation.create({ data: { userId: user.id, clientId, tokenHash, expiresAt } });
    return { email: employee.email, expiresAt };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return { ...result, token };
}

export async function acceptEmployeeInvitation(token: string, password: string) {
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(token)) throw new Error("Undangan tidak valid");
  if (password.length < 12 || password.length > 200) throw new Error("Kata sandi minimal 12 karakter");
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  return db.$transaction(async tx => {
    const invitation = await tx.employeeInvitation.findUnique({ where: { tokenHash: hashInvite(token) } });
    if (!invitation || invitation.usedAt || invitation.expiresAt <= now) throw new Error("Undangan tidak berlaku");
    const updated = await tx.employeeInvitation.updateMany({
      where: { id: invitation.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now }
    });
    if (updated.count !== 1) throw new Error("Undangan sudah dipakai");
    const user = await tx.user.findUnique({ where: { id: invitation.userId } });
    if (!user || user.clientId !== invitation.clientId || user.role !== "PEGAWAI" ||
        !user.pegawaiId || !user.mustChangePassword) throw new Error("Akun tidak memenuhi syarat");
    const employee = await tx.pegawai.findFirst({
      where: { id: user.pegawaiId, clientId: invitation.clientId, isActive: true, client: { status: "AKTIF" } }
    });
    if (!employee) throw new Error("Karyawan tidak aktif");
    await tx.user.update({ where: { id: user.id }, data: {
      passwordHash, mustChangePassword: false, isActive: true,
      tokenVersion: { increment: 1 }, failedLoginCount: 0, lockedUntil: null
    } });
    return { activated: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
