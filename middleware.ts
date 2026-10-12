import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const protectedPrefixes: [string, string[]][] = [
  ["/superadmin", ["SUPERADMIN"]],
  ["/admin", ["SUPERADMIN", "ADMIN"]],
  ["/pegawai", ["PEGAWAI"]],
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPasswordPage = path === "/ganti-password";
  const prefix = protectedPrefixes.find(([p]) => path === p || path.startsWith(p + "/"));
  if (!prefix && !isPasswordPage) return NextResponse.next();

  const token = req.cookies.get("tg_session")?.value;
  if (!token) {
    const url = new URL("/login", req.url);
    if (!isPasswordPage) url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret || new TextEncoder().encode(secret).byteLength < 32) throw new Error("AUTH_SECRET tidak valid");
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    if (isPasswordPage) return NextResponse.next();
    if (!prefix || typeof payload.role !== "string" || !prefix[1].includes(payload.role)) {
      return NextResponse.redirect(new URL("/login?denied=1", req.url));
    }
    if (payload.mustChangePassword === true) return NextResponse.redirect(new URL("/ganti-password", req.url));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = { matcher: ["/superadmin/:path*", "/admin/:path*", "/pegawai/:path*", "/ganti-password"] };
