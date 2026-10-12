import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth-server";
import { writeAudit } from "@/lib/audit";
import { THROTTLE_WINDOW_MS, throttleKeys } from "@/lib/auth/login-throttle";
const schema=z.object({email:z.string().email().max(191),password:z.string().min(1).max(200)});
export const runtime="nodejs";
const DUMMY_HASH = bcrypt.hashSync("dummy-password-not-used", 12);
async function isLoginBlocked(fingerprint: string) {
  const now = new Date();
  const existing = await db.loginThrottle.findUnique({ where: { fingerprint } });
  if (!existing) return false;
  if (existing.blockedUntil && existing.blockedUntil > now) return true;
  if (now.getTime() - existing.windowStartedAt.getTime() >= THROTTLE_WINDOW_MS) {
    await db.loginThrottle.update({ where: { fingerprint }, data: { attempts: 0, windowStartedAt: now, blockedUntil: null } });
  }
  return false;
}
async function recordFailedLogin(fingerprint: string, limit: number) {
  const now = new Date();
  const existing = await db.loginThrottle.findUnique({ where: { fingerprint } });
  if (!existing || now.getTime() - existing.windowStartedAt.getTime() >= THROTTLE_WINDOW_MS) {
    await db.loginThrottle.upsert({ where: { fingerprint }, create: { fingerprint, attempts: 1, windowStartedAt: now }, update: { attempts: 1, windowStartedAt: now, blockedUntil: null } });
    return;
  }
  const attempts = existing.attempts + 1;
  await db.loginThrottle.update({ where: { fingerprint }, data: { attempts, ...(attempts >= limit ? { blockedUntil: new Date(now.getTime() + THROTTLE_WINDOW_MS) } : {}) } });
}
async function clearFailedLogins(fingerprint: string) {
  await db.loginThrottle.deleteMany({ where: { fingerprint } });
}
export async function POST(req:Request) {
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({message:"Email atau kata sandi tidak valid."},{status:400});
  const email=parsed.data.email.trim().toLowerCase();
  try {
    // X-Real-IP hanya aman jika reverse proxy menghapus header kiriman client lalu mengisinya sendiri.
    const ip = req.headers.get("x-real-ip")?.trim() || null;
    const keys = throttleKeys(email, ip);
    const blocked = await Promise.all(keys.map(k => isLoginBlocked(k.fingerprint)));
    if (blocked.some(Boolean)) {
      return NextResponse.json({ message: "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit." }, { status: 429, headers: { "Retry-After": "900" } });
    }
    const user=await db.user.findUnique({where:{email},include:{client:true}});
    // Hash bcrypt valid 60 karakter agar jalur email tidak terdaftar tetap melakukan compare.
    const passwordMatches = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH).catch(()=>false);
    if(!user || !user.isActive || (user.client && user.client.status!=="AKTIF") || (user.lockedUntil && user.lockedUntil>new Date()) || !passwordMatches) {
      await Promise.all(keys.map(k => recordFailedLogin(k.fingerprint, k.limit)));
      // Jangan mengunci akun hanya berdasarkan percobaan gagal: itu memungkinkan DoS akun target.
      return NextResponse.json({message:"Email atau kata sandi salah, atau akun sedang tidak aktif."},{status:401});
    }
    await db.user.update({where:{id:user.id},data:{failedLoginCount:0,lockedUntil:null,lastLoginAt:new Date()}});
    // Login sukses hanya membersihkan bucket pasangan email+IP; bucket IP dan email-global tetap menghitung.
    await Promise.all(keys.filter(k => k.clearOnSuccess).map(k => clearFailedLogins(k.fingerprint)));
    const session={id:user.id,email:user.email,name:user.name,role:user.role,clientId:user.clientId,pegawaiId:user.pegawaiId,mustChangePassword:user.mustChangePassword};
    await createSession(session);
    await writeAudit({actor:session,clientId:user.clientId,action:"LOGIN",entity:"User",entityId:user.id,newValue:{email:user.email}}).catch(()=>{});
    return NextResponse.json({user:{id:user.id,email:user.email,name:user.name,role:user.role,clientId:user.clientId,pegawaiId:user.pegawaiId,mustChangePassword:user.mustChangePassword}});
  } catch(error) {
    console.error("Login HRIS gagal:",error instanceof Error?error.message:"unknown");
    return NextResponse.json({message:"Layanan autentikasi tidak tersedia. Periksa koneksi database."},{status:503});
  }
}
