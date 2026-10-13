import "server-only";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";
import { getVerifiedClientIp } from "@/lib/auth/verified-proxy-ip";

const COOKIE = "tg_session";
const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value || Buffer.byteLength(value) < 32) throw new Error("AUTH_SECRET wajib diisi dengan minimal 32 byte acak.");
  return new TextEncoder().encode(value);
};
export type SessionUser = { id:string; email:string; name:string; role:Role; clientId:string|null; pegawaiId:string|null; managedProjectId?:string|null; mustChangePassword:boolean };
export async function createSession(user: SessionUser) {
  const currentUser = await db.user.findUnique({
  where: { id: user.id },
  select: { tokenVersion: true },
});

const token = await new SignJWT({
  role: user.role,
  tokenVersion: currentUser?.tokenVersion ?? -1,
})
  .setProtectedHeader({ alg: "HS256" })
  .setSubject(user.id)
  .setIssuedAt()
  .setExpirationTime("8h")
  .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"lax", path:"/", maxAge:8*60*60 });
}
export async function clearSession() { (await cookies()).delete(COOKIE); }
export async function getSession(): Promise<SessionUser|null> {
  const token=(await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const {payload}=await jwtVerify(token,secret(),{algorithms:["HS256"]});
    if (!payload.sub) return null;
    // Token bukan sumber kebenaran status akun; baca ulang user setiap request.
    const user=await db.user.findUnique({where:{id:payload.sub},include:{client:true}});
    if (!user || !user.isActive || (user.client && user.client.status !== "AKTIF")) return null;
    if (typeof payload.tokenVersion !== "number" || payload.tokenVersion !== user.tokenVersion) return null;
    return {id:user.id,email:user.email,name:user.name,role:user.role,clientId:user.clientId,pegawaiId:user.pegawaiId,managedProjectId:user.managedProjectId,mustChangePassword:user.mustChangePassword};
  } catch { return null; }
}
export async function requireUser(roles?: Role[]) {
  const user=await getSession();
  if (!user) throw new Error("Sesi tidak valid. Silakan masuk kembali.");
  if (user.mustChangePassword) throw new Error("Anda wajib mengganti kata sandi sebelum melanjutkan.");
  if (roles && !roles.includes(user.role)) throw new Error("Anda tidak memiliki izin untuk melakukan tindakan ini.");
  return user;
}
export async function requestMetadata() {
  const h=await headers();
  return { ip:getVerifiedClientIp(h), userAgent:h.get("user-agent")?.slice(0,500) || null };
}
