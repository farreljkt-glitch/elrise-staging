"use client";
import { RoleGuard } from "@/components/auth/RoleGuard";
import Link from "next/link";
export default function ProjectLayout({children}:{children:React.ReactNode}){
  return <RoleGuard allowedRoles={["ADMIN_PROJECT"]}><div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
      <Link className="font-bold" href="/project/dashboard">Elrise · Admin Project</Link>
      <nav className="flex gap-3"><Link className="text-sm underline" href="/project/dashboard">Dashboard</Link><Link className="text-sm underline" href="/project/cuti">Cuti</Link></nav>
    </header>
    <div className="mx-auto max-w-5xl p-5">{children}</div>
  </div></RoleGuard>;
}
